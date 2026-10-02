'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Home, KeyRound } from 'lucide-react'
import { AuthShell } from '@/components/AuthShell'
import { Button, Field, Segmented } from '@/components/ui'
import { useSession } from '@/store/session'
import { CURRENCIES, ROLE_LABELS } from '@/lib/categories'
import { parseMoney } from '@/lib/money'
import type { Role } from '@/lib/model'

export default function OnboardingPage() {
  const router = useRouter()
  const { status, fullName, createHousehold, joinHousehold, signOut } = useSession()
  const [tab, setTab] = useState<'create' | 'join'>('create')
  const [name, setName] = useState('')
  const [currency, setCurrency] = useState('INR')
  const [code, setCode] = useState('')
  const [role, setRole] = useState<Exclude<Role, 'HOUSEHEAD'>>('PARENT')
  const [income, setIncome] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'signedOut') router.replace('/auth/login')
    if (status === 'ready') router.replace('/dashboard')
  }, [status, router])

  const defaultName = fullName ? `${fullName.split(' ').slice(-1)[0]} Household` : 'My Household'

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const monthly = income.trim() ? parseMoney(income) : 0
    if (!Number.isFinite(monthly) || monthly < 0) return setError('Enter your monthly take-home income, or leave it blank.')
    setBusy(true)
    try {
      if (tab === 'create') {
        await createHousehold(name.trim() || defaultName, currency, monthly)
      } else {
        if (code.trim().length < 6) throw new Error('Enter the invite code you received.')
        await joinHousehold(code, role, monthly)
      }
      router.replace('/dashboard')
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  return (
    <AuthShell title={`Welcome${fullName ? `, ${fullName.split(' ')[0]}` : ''}!`} subtitle="Set up your household, or join your family’s."
      footer={<button className="font-semibold text-primary" onClick={async () => { await signOut(); router.replace('/') }}>Sign out</button>}>
      <Segmented className="mb-5 w-full" value={tab} onChange={setTab} options={[
        { value: 'create', label: <span className="inline-flex items-center gap-1.5"><Home size={14} />Create household</span> },
        { value: 'join', label: <span className="inline-flex items-center gap-1.5"><KeyRound size={14} />Join with code</span> },
      ]} />
      <form onSubmit={submit} className="space-y-4">
        {tab === 'create' ? (
          <>
            <Field label="Household name"><input className="field" maxLength={80} placeholder={defaultName} value={name} onChange={(e) => setName(e.target.value)} /></Field>
            <Field label="Currency">
              <select className="field" value={currency} onChange={(e) => setCurrency(e.target.value)}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select>
            </Field>
          </>
        ) : (
          <>
            <Field label="Invite code" hint="Ask the household head — it’s on their Household page.">
              <input className="field font-mono uppercase tracking-[0.2em]" maxLength={12} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
            </Field>
            <Field label="I am a">
              <select className="field" value={role} onChange={(e) => setRole(e.target.value as Exclude<Role, 'HOUSEHEAD'>)}>
                {(['PARENT', 'ADULT_CHILD', 'STUDENT'] as const).map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}{r === 'STUDENT' ? ' (pocket money, no reports)' : ''}</option>)}
              </select>
            </Field>
          </>
        )}
        <Field label="Your monthly income (optional)" hint="Take-home pay. Used for savings rate — visible to your household.">
          <input className="field" inputMode="decimal" placeholder="0" value={income} onChange={(e) => setIncome(e.target.value)} />
        </Field>
        {error && <p className="rounded-[10px] bg-negative-soft px-3 py-2 text-sm text-negative" role="alert">{error}</p>}
        <Button type="submit" size="lg" className="w-full" loading={busy}>{tab === 'create' ? 'Create household' : 'Join household'}</Button>
      </form>
    </AuthShell>
  )
}
