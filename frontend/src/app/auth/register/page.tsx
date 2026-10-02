'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MailCheck } from 'lucide-react'
import { AuthShell } from '@/components/AuthShell'
import { Button, Field } from '@/components/ui'
import { useSession } from '@/store/session'

function passwordProblem(p: string) {
  if (p.length < 8) return 'Use at least 8 characters.'
  if (!/[A-Za-z]/.test(p) || !/\d/.test(p)) return 'Mix letters and numbers.'
  return null
}

export default function RegisterPage() {
  const router = useRouter()
  const { status, mode, signUp } = useSession()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [agree, setAgree] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'ready' && mode === 'live') router.replace('/dashboard')
    if (status === 'onboarding') router.replace('/onboarding')
  }, [status, mode, router])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!form.name.trim()) return setError('Tell us your name.')
    const pw = passwordProblem(form.password)
    if (pw) return setError(pw)
    if (!agree) return setError('Please accept the Terms and Privacy Policy.')
    setBusy(true)
    try {
      const { needsConfirmation } = await signUp(form.name, form.email, form.password)
      if (needsConfirmation) setSentTo(form.email.trim())
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (sentTo) {
    return (
      <AuthShell title="Check your email" footer={<>Wrong address? <button className="font-semibold text-primary" onClick={() => setSentTo(null)}>Start again</button></>}>
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary"><MailCheck size={26} /></div>
          <p className="mt-4 text-sm text-ink-2">We sent a confirmation link to <b className="text-ink">{sentTo}</b>. Open it on this device to finish creating your account.</p>
          <p className="mt-3 text-[12.5px] text-ink-3">Can’t find it? Check spam or promotions. The link expires in 24 hours.</p>
          <Link href="/auth/login" className="mt-5 w-full"><Button variant="secondary" className="w-full">Back to sign in</Button></Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Create your account" subtitle="Free for the whole family. Takes under a minute."
      footer={<>Already have an account? <Link href="/auth/login" className="font-semibold text-primary">Sign in</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Your name"><input className="field" autoComplete="name" maxLength={80} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Email"><input className="field" type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label="Password" hint="At least 8 characters, with letters and numbers.">
          <input className="field" type="password" autoComplete="new-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </Field>
        <label className="flex items-start gap-2.5 text-[13px] text-ink-2">
          <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[var(--primary)]" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          <span>I agree to the <Link href="/terms" className="font-semibold text-primary" target="_blank">Terms of Service</Link> and <Link href="/privacy" className="font-semibold text-primary" target="_blank">Privacy Policy</Link>, and I am 18 or older (younger members join through a parent’s household).</span>
        </label>
        {error && <p className="rounded-[10px] bg-negative-soft px-3 py-2 text-sm text-negative" role="alert">{error}</p>}
        <Button type="submit" size="lg" className="w-full" loading={busy}>Create account</Button>
      </form>
    </AuthShell>
  )
}
