'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AuthShell } from '@/components/AuthShell'
import { Button, Field } from '@/components/ui'
import { useSession } from '@/store/session'

export default function ForgotPasswordPage() {
  const sendPasswordReset = useSession((s) => s.sendPasswordReset)
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try { await sendPasswordReset(email); setSent(true) } catch (err) { setError((err as Error).message) } finally { setBusy(false) }
  }

  return (
    <AuthShell title="Reset your password" subtitle={sent ? undefined : 'We’ll email you a link to choose a new password.'}
      footer={<Link href="/auth/login" className="font-semibold text-primary">Back to sign in</Link>}>
      {sent ? (
        <p className="text-sm text-ink-2">If an account exists for <b className="text-ink">{email}</b>, a reset link is on its way. It expires in one hour.</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="Email"><input className="field" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          {error && <p className="rounded-[10px] bg-negative-soft px-3 py-2 text-sm text-negative">{error}</p>}
          <Button type="submit" size="lg" className="w-full" loading={busy}>Send reset link</Button>
        </form>
      )}
    </AuthShell>
  )
}
