'use client'

import { useMemo, useState } from 'react'
import { HeartPulse, Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react'
import { Badge, Button, Card, CardHeader, EmptyState, Field, IconButton, Modal, PageHeader, Progress, Stat, confirmAction } from '@/components/ui'
import { useHousehold } from '@/store/ledger'
import { daysBetween, formatCompact, formatDate, formatMoney, parseMoney, sumMoney, today } from '@/lib/money'
import { annualPremiums } from '@/lib/finance'
import type { InsurancePolicy, PolicyType } from '@/lib/model'

const TYPES: { value: PolicyType; label: string }[] = [
  { value: 'HEALTH', label: 'Health' }, { value: 'TERM_LIFE', label: 'Term life' }, { value: 'LIFE', label: 'Life / endowment' },
  { value: 'VEHICLE', label: 'Vehicle' }, { value: 'HOME', label: 'Home' }, { value: 'TRAVEL', label: 'Travel' }, { value: 'OTHER', label: 'Other' },
]
const HEALTH_TARGET = 1000000

export default function InsurancePage() {
  const { data, currency, firstName, members, mutate } = useHousehold()
  const [editing, setEditing] = useState<InsurancePolicy | 'new' | null>(null)
  const t = today()

  const view = useMemo(() => {
    if (!data) return null
    const health = sumMoney(data.policies.filter((p) => p.policy_type === 'HEALTH'), (p) => p.coverage_amount)
    const life = sumMoney(data.policies.filter((p) => p.policy_type === 'TERM_LIFE' || p.policy_type === 'LIFE'), (p) => p.coverage_amount)
    const annualIncome = sumMoney(members, (m) => m.monthly_income) * 12
    return {
      health, life, annualIncome,
      lifeTarget: annualIncome * 10,
      premiums: annualPremiums(data.policies),
      renewing: data.policies.filter((p) => p.expiry_date && daysBetween(t, p.expiry_date) >= 0 && daysBetween(t, p.expiry_date) <= 30).length,
      policies: [...data.policies].sort((a, b) => (a.expiry_date ?? '9').localeCompare(b.expiry_date ?? '9')),
    }
  }, [data, members, t])

  if (!view) return null

  return (
    <div>
      <PageHeader title="Insurance" subtitle="Know your cover, premiums and renewal dates." actions={<Button icon={<Plus size={16} />} onClick={() => setEditing('new')}>Add policy</Button>} />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Health cover" value={formatCompact(view.health, currency)} />
        <Stat label="Life cover" value={formatCompact(view.life, currency)} />
        <Stat label="Premiums per year" value={formatMoney(view.premiums, currency)} />
        <Stat label="Renewing in 30 days" value={String(view.renewing)} tone={view.renewing ? 'saffron' : undefined} />
      </div>

      <Card className="mb-5" fold>
        <CardHeader title="Cover check" subtitle="Common rules of thumb — talk to an adviser for your situation." />
        <div className="grid gap-5 px-5 pb-5 md:grid-cols-2">
          <div>
            <div className="mb-1 flex justify-between text-[13px]"><span className="font-semibold">Life cover vs 10× family income</span><span className="text-ink-3">{formatCompact(view.life, currency)} / {formatCompact(view.lifeTarget, currency)}</span></div>
            <Progress value={view.lifeTarget ? (view.life / view.lifeTarget) * 100 : 0} tone={view.life >= view.lifeTarget ? 'positive' : 'warning'} />
            <p className="mt-1.5 text-[12.5px] text-ink-3">{view.annualIncome === 0 ? 'Add monthly income in Household to calculate this.' : view.life >= view.lifeTarget ? 'Your earning members look well covered.' : `About ${formatCompact(view.lifeTarget - view.life, currency)} more term cover would meet the guideline.`}</p>
          </div>
          <div>
            <div className="mb-1 flex justify-between text-[13px]"><span className="font-semibold">Health cover vs ₹10L family floater</span><span className="text-ink-3">{formatCompact(view.health, currency)} / {formatCompact(HEALTH_TARGET, currency)}</span></div>
            <Progress value={(view.health / HEALTH_TARGET) * 100} tone={view.health >= HEALTH_TARGET ? 'positive' : 'warning'} />
            <p className="mt-1.5 text-[12.5px] text-ink-3">{view.health >= HEALTH_TARGET ? 'Good base cover. A super top-up adds protection cheaply.' : 'Hospital costs in cities often exceed ₹5L; consider raising cover.'}</p>
          </div>
        </div>
      </Card>

      {view.policies.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {view.policies.map((p) => {
            const days = p.expiry_date ? daysBetween(t, p.expiry_date) : null
            return (
              <Card key={p.id} className="p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-primary-soft text-primary">{p.policy_type === 'HEALTH' ? <HeartPulse size={20} /> : <ShieldCheck size={20} />}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><span className="font-semibold">{p.provider}</span><Badge>{TYPES.find((x) => x.value === p.policy_type)?.label}</Badge></div>
                    <div className="text-[12.5px] text-ink-3">{p.policy_number && `${p.policy_number} · `}{p.owner_id && firstName(p.owner_id)}</div>
                  </div>
                  <IconButton label="Edit policy" onClick={() => setEditing(p)}><Pencil size={15} /></IconButton>
                  <IconButton label="Delete policy" onClick={async () => { if (await confirmAction({ title: `Delete ${p.provider} policy?`, confirmLabel: 'Delete', danger: true })) mutate((b) => b.remove('policies', p.id), 'Policy deleted') }}><Trash2 size={15} /></IconButton>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-[12.5px]">
                  <div className="rounded-[10px] bg-surface-2 px-3 py-2"><div className="text-ink-3">Cover</div><div className="font-semibold">{formatCompact(p.coverage_amount, currency)}</div></div>
                  <div className="rounded-[10px] bg-surface-2 px-3 py-2"><div className="text-ink-3">Premium</div><div className="font-semibold">{formatMoney(p.premium_amount, currency)}<span className="font-normal text-ink-3">/{p.premium_frequency === 'MONTHLY' ? 'mo' : p.premium_frequency === 'QUARTERLY' ? 'qtr' : 'yr'}</span></div></div>
                  <div className="rounded-[10px] bg-surface-2 px-3 py-2"><div className="text-ink-3">Renews</div><div className={`font-semibold ${days !== null && days <= 30 ? 'text-warning' : ''}`}>{p.expiry_date ? (days! < 0 ? 'Expired' : formatDate(p.expiry_date, 'long')) : '—'}</div></div>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card><EmptyState icon={<ShieldCheck size={20} />} title="No policies yet" body="Add health, term life and vehicle policies so renewals never lapse." action={<Button onClick={() => setEditing('new')}>Add policy</Button>} /></Card>
      )}

      <PolicyForm policy={editing} onClose={() => setEditing(null)} />
    </div>
  )
}

function PolicyForm({ policy, onClose }: { policy: InsurancePolicy | 'new' | null; onClose: () => void }) {
  const { members, userId, currency, mutate } = useHousehold()
  const editing = policy && policy !== 'new' ? policy : null
  const blank = { provider: '', number: '', type: 'HEALTH' as PolicyType, cover: '', premium: '', freq: 'YEARLY' as InsurancePolicy['premium_frequency'], expiry: '', owner: userId }
  const [form, setForm] = useState(blank)
  const [error, setError] = useState<string | null>(null)
  const [key, setKey] = useState<string | null>(null)
  const formKey = policy === null ? null : editing?.id ?? 'new'
  if (formKey !== key) {
    setKey(formKey)
    setForm(editing ? { provider: editing.provider, number: editing.policy_number ?? '', type: editing.policy_type, cover: String(editing.coverage_amount), premium: String(editing.premium_amount), freq: editing.premium_frequency, expiry: editing.expiry_date ?? '', owner: editing.owner_id ?? userId } : blank)
    setError(null)
  }

  async function save() {
    const cover = parseMoney(form.cover)
    const premium = form.premium ? parseMoney(form.premium) : 0
    if (!form.provider.trim()) return setError('Which insurer?')
    if (!Number.isFinite(cover) || cover < 0) return setError('Enter the sum insured.')
    if (!Number.isFinite(premium) || premium < 0) return setError('Enter the premium.')
    const row = { provider: form.provider.trim(), policy_number: form.number || null, policy_type: form.type, coverage_amount: cover, premium_amount: premium, premium_frequency: form.freq, expiry_date: form.expiry || null, owner_id: form.owner || null }
    const ok = await mutate((b) => editing ? b.update('policies', editing.id, row) : b.insert('policies', row), editing ? 'Policy updated' : 'Policy added')
    if (ok) onClose()
  }

  return (
    <Modal open={policy !== null} onClose={onClose} title={editing ? 'Edit policy' : 'Add policy'} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save}>Save</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Insurer / plan"><input className="field" maxLength={80} value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} /></Field>
        <Field label="Policy number"><input className="field" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} /></Field>
        <Field label="Type"><select className="field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as PolicyType })}>{TYPES.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}</select></Field>
        <Field label="Policy holder"><select className="field" value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })}>{members.map((m) => <option key={m.user_id} value={m.user_id}>{m.full_name}</option>)}</select></Field>
        <Field label={`Sum insured (${currency})`}><input className="field" inputMode="decimal" value={form.cover} onChange={(e) => setForm({ ...form, cover: e.target.value })} /></Field>
        <Field label={`Premium (${currency})`}><input className="field" inputMode="decimal" value={form.premium} onChange={(e) => setForm({ ...form, premium: e.target.value })} /></Field>
        <Field label="Premium paid"><select className="field" value={form.freq} onChange={(e) => setForm({ ...form, freq: e.target.value as InsurancePolicy['premium_frequency'] })}><option value="MONTHLY">Monthly</option><option value="QUARTERLY">Quarterly</option><option value="YEARLY">Yearly</option></select></Field>
        <Field label="Renewal / expiry date"><input className="field" type="date" value={form.expiry} onChange={(e) => setForm({ ...form, expiry: e.target.value })} /></Field>
      </div>
      {error && <p className="mt-3 rounded-[10px] bg-negative-soft px-3 py-2 text-sm text-negative">{error}</p>}
    </Modal>
  )
}
