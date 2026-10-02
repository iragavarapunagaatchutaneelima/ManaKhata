'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthShell } from '@/components/AuthShell'
import { Button, Field } from '@/components/ui'
import { useSession } from '@/store/session'

// Reached from the password-reset email; Supabase signs the user in with a recovery session.
export default function ResetPasswordPage() {
  const router = useRouter()
  const { status, updatePassword } = useSession()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) return setError('Use at least 8 characters.')
    if (password !== confirm) return setError('The two passwords don’t match.')
    setBusy(true)
    try { await updatePassword(password); router.replace('/dashboard') } catch (err) { setError((err as Error).message); setBusy(false) }
  }

  if (status === 'signedOut') {
    return <AuthShell title="Link expired" subtitle="This reset link is invalid or has expired. Request a new one from the sign-in page."><Button className="w-full" onClick={() => router.push('/auth/forgot')}>Request a new link</Button></AuthShell>
  }

  return (
    <AuthShell title="Choose a new password">
      <form onSubmit={submit} className="space-y-4">
        <Field label="New password"><input className="field" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        <Field label="Repeat password"><input className="field" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></Field>
        {error && <p className="rounded-[10px] bg-negative-soft px-3 py-2 text-sm text-negative">{error}</p>}
        <Button type="submit" size="lg" className="w-full" loading={busy || status === 'loading'}>Save password</Button>
      </form>
    </AuthShell>
  )
}
