'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Crown, LogOut, RefreshCw, Share2, UserMinus } from 'lucide-react'
import { Avatar, Badge, Button, Card, CardHeader, Field, IconButton, Modal, PageHeader, Toggle, confirmAction } from '@/components/ui'
import { useHousehold } from '@/store/ledger'
import { useSession } from '@/store/session'
import { CURRENCIES, ROLE_LABELS } from '@/lib/categories'
import { formatMoney, parseMoney } from '@/lib/money'
import type { Member, Role } from '@/lib/model'
import { SITE_URL } from '@/lib/config'
import toast from 'react-hot-toast'

export default function HouseholdPage() {
  const router = useRouter()
  const { data, userId, isManager, isHead, currency, mode, mutate } = useHousehold()
  const init = useSession((s) => s.init)
  const [incomeFor, setIncomeFor] = useState<Member | null>(null)
  const [name, setName] = useState('')
  if (!data) return null
  const h = data.household
  const inviteText = `Join our household “${h.name}” on ManaKhata. Sign up at ${SITE_URL} and use invite code ${h.invite_code}.`

  async function share() {
    if (navigator.share) { try { await navigator.share({ title: 'Join us on ManaKhata', text: inviteText }); return } catch { /* cancelled */ } }
    await navigator.clipboard.writeText(inviteText)
    toast.success('Invite message copied')
  }

  async function leave() {
    if (!(await confirmAction({ title: `Leave ${h.name}?`, body: 'You will lose access to this household’s shared data. Your past entries stay with the household.', confirmLabel: 'Leave household', danger: true }))) return
    const ok = await mutate(async (b) => { await b.removeMember(userId); return true })
    if (ok) { await init(); router.replace('/onboarding') }
  }

  return (
    <div>
      <PageHeader title="Household" subtitle="Members, roles, income and what each person can see." />

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-1" fold>
          <div className="text-[13px] font-semibold text-ink-3">Invite code</div>
          <div className="mt-1 font-mono text-3xl font-bold tracking-[0.2em] text-primary">{h.invite_code}</div>
          <p className="mt-2 text-[13px] text-ink-3">Family members sign up, choose “Join a household” and enter this code.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" icon={<Copy size={15} />} onClick={async () => { await navigator.clipboard.writeText(h.invite_code); toast.success('Code copied') }}>Copy</Button>
            <Button size="sm" icon={<Share2 size={15} />} onClick={share}>Share invite</Button>
            {isManager && mode === 'live' && (
              <IconButton label="Generate a new code" onClick={async () => {
                if (await confirmAction({ title: 'Generate a new invite code?', body: 'The old code will stop working. Existing members are not affected.', confirmLabel: 'New code' }))
                  mutate((b) => b.regenerateInvite(), 'New invite code created')
              }}><RefreshCw size={16} /></IconButton>
            )}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Household settings" />
          <div className="grid gap-4 px-5 pb-5 sm:grid-cols-2">
            <Field label="Name">
              <div className="flex gap-2">
                <input className="field" defaultValue={h.name} disabled={!isManager} maxLength={80} onChange={(e) => setName(e.target.value)} />
                {isManager && <Button variant="secondary" disabled={!name.trim() || name.trim() === h.name} onClick={() => mutate((b) => b.updateHousehold({ name: name.trim() }), 'Name updated')}>Save</Button>}
              </div>
            </Field>
            <Field label="Currency" hint="Used for all amounts in this household.">
              <select className="field" value={h.currency} disabled={!isManager} onChange={(e) => mutate((b) => b.updateHousehold({ currency: e.target.value }), 'Currency updated')}>
                {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
          </div>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader title={`Members (${data.members.length})`} subtitle="Monthly income is used for savings rate and budgets. Only managers can change roles and permissions." />
        <ul className="divide-y divide-line">
          {data.members.map((m) => {
            const self = m.user_id === userId
            const editable = isManager && m.role !== 'HOUSEHEAD'
            return (
              <li key={m.user_id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                <Avatar name={m.full_name} size={40} />
                <div className="min-w-[160px] flex-1">
                  <div className="flex items-center gap-2 font-semibold">{m.full_name}{self && <span className="text-ink-3">(you)</span>}{m.role === 'HOUSEHEAD' && <Crown size={14} className="text-saffron" />}</div>
                  <div className="text-[12.5px] text-ink-3">{m.email}</div>
                </div>
                <div className="w-36">
                  {editable ? (
                    <select className="field h-9" value={m.role} onChange={(e) => mutate((b) => b.updateMember(m.user_id, { role: e.target.value as Role }), 'Role updated')}>
                      {(['PARENT', 'ADULT_CHILD', 'STUDENT'] as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                    </select>
                  ) : <Badge tone={m.role === 'HOUSEHEAD' ? 'saffron' : 'primary'}>{ROLE_LABELS[m.role]}</Badge>}
                </div>
                <button className="w-32 text-left text-sm disabled:cursor-default" disabled={!(self || isManager)} onClick={() => setIncomeFor(m)}>
                  <div className="text-[11.5px] text-ink-3">Monthly income</div>
                  <div className="font-semibold tabular-nums">{formatMoney(m.monthly_income, currency)}{(self || isManager) && <span className="ml-1 text-[12px] text-primary">edit</span>}</div>
                </button>
                <div className="flex items-center gap-4 text-[12.5px] text-ink-2">
                  <label className="flex items-center gap-2">Reports <Toggle label="Can see reports" checked={m.role === 'HOUSEHEAD' || m.role === 'PARENT' || m.can_view_analytics} disabled={!editable || m.role === 'PARENT'}
                    onChange={(v) => mutate((b) => b.updateMember(m.user_id, { can_view_analytics: v }), 'Permission updated')} /></label>
                </div>
                {isHead && !self && (
                  <div className="flex gap-1">
                    <IconButton label="Make household head" onClick={async () => {
                      if (await confirmAction({ title: `Make ${m.full_name} the household head?`, body: 'You will become a parent. Only one person can be head.', confirmLabel: 'Hand over' }))
                        mutate((b) => b.transferHeadship(m.user_id), 'Household head changed')
                    }}><Crown size={16} /></IconButton>
                    <IconButton label="Remove from household" onClick={async () => {
                      if (await confirmAction({ title: `Remove ${m.full_name}?`, body: 'They lose access immediately. Their past entries stay in the household.', confirmLabel: 'Remove', danger: true }))
                        mutate((b) => b.removeMember(m.user_id), 'Member removed')
                    }}><UserMinus size={16} /></IconButton>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </Card>

      {!isHead && mode === 'live' && (
        <div className="mt-5"><Button variant="ghost" className="text-negative" icon={<LogOut size={16} />} onClick={leave}>Leave this household</Button></div>
      )}

      <IncomeForm member={incomeFor} onClose={() => setIncomeFor(null)} />
    </div>
  )
}

function IncomeForm({ member, onClose }: { member: Member | null; onClose: () => void }) {
  const { currency, mutate } = useHousehold()
  const [value, setValue] = useState('')
  const [key, setKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  if ((member?.user_id ?? null) !== key) { setKey(member?.user_id ?? null); setValue(member ? String(member.monthly_income) : ''); setError(null) }

  async function save() {
    const amount = value.trim() === '' ? 0 : parseMoney(value)
    if (!member) return
    if (!Number.isFinite(amount) || amount < 0) return setError('Enter zero or a positive amount.')
    const ok = await mutate(async (b) => { await b.updateMember(member.user_id, { monthly_income: amount }); return true }, 'Income updated')
    if (ok) onClose()
  }

  return (
    <Modal open={!!member} onClose={onClose} title={`Monthly income · ${member?.full_name ?? ''}`} description="Take-home pay per month (after tax). Add bonuses and other income as Income entries."
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save}>Save</Button></>}>
      <Field label={`Amount (${currency})`}><input className="field" inputMode="decimal" autoFocus value={value} onChange={(e) => setValue(e.target.value)} /></Field>
      {error && <p className="mt-3 rounded-[10px] bg-negative-soft px-3 py-2 text-sm text-negative">{error}</p>}
    </Modal>
  )
}
