'use client'

import { useMemo, useState } from 'react'
import { Info, Landmark, Plus, Trash2 } from 'lucide-react'
import { Badge, Button, Card, CardHeader, EmptyState, Field, IconButton, Modal, PageHeader, Progress, Stat, confirmAction } from '@/components/ui'
import { useHousehold } from '@/store/ledger'
import { financialYear, formatMoney, parseMoney } from '@/lib/money'
import { TAX_LIMITS, taxSummary } from '@/lib/finance'
import type { TaxSection } from '@/lib/model'

export default function TaxPage() {
  const { data, userId, currency, firstName, mutate } = useHousehold()
  const thisFY = financialYear()
  const years = [thisFY, financialYear(new Date(new Date().getFullYear() - 1, new Date().getMonth(), 1)), financialYear(new Date(new Date().getFullYear() - 2, new Date().getMonth(), 1))]
  const [fy, setFy] = useState(thisFY)
  const [person, setPerson] = useState(userId)
  const [adding, setAdding] = useState(false)

  const view = useMemo(() => {
    if (!data) return null
    const docs = data.taxDocs.filter((d) => d.owner_id === person)
    const summary = taxSummary(docs, fy)
    const cess = 1.04
    return { docs: docs.filter((d) => d.financial_year === fy), ...summary, at30: summary.totalEligible * 0.3 * cess, at20: summary.totalEligible * 0.2 * cess }
  }, [data, fy, person])

  if (!view || !data) return null

  return (
    <div>
      <PageHeader title="Tax saver" subtitle="Track deductions under the old tax regime against their legal limits."
        actions={<>
          <select className="field h-10 w-auto" value={person} onChange={(e) => setPerson(e.target.value)} aria-label="Person">{data.members.map((m) => <option key={m.user_id} value={m.user_id}>{m.full_name}</option>)}</select>
          <select className="field h-10 w-auto" value={fy} onChange={(e) => setFy(e.target.value)} aria-label="Financial year">{years.map((y) => <option key={y} value={y}>FY {y}</option>)}</select>
          {person === userId && <Button icon={<Plus size={16} />} onClick={() => setAdding(true)}>Add proof</Button>}
        </>} />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 [&>*:nth-child(3)]:col-span-2 sm:[&>*:nth-child(3)]:col-span-1">
        <Stat label="Eligible deductions" value={formatMoney(view.totalEligible, currency)} tone="primary" />
        <Stat label="Tax saved at 30% slab" value={formatMoney(view.at30, currency)} tone="positive" hint="incl. 4% cess" />
        <Stat label="Tax saved at 20% slab" value={formatMoney(view.at20, currency)} hint="incl. 4% cess" />
      </div>

      <Card className="mb-5">
        <CardHeader title={`Sections · FY ${fy}`} subtitle={`${firstName(person)}’s claims vs the limits`} />
        <ul className="divide-y divide-line">
          {view.lines.filter((l) => l.claimed > 0 || l.limit !== null).map((l) => (
            <li key={l.section} className="px-5 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-medium">{l.label}</span>
                <span className="tabular-nums text-ink-2">
                  {formatMoney(l.claimed, currency)}{l.limit !== null && <span className="text-ink-3"> / {formatMoney(l.limit, currency)}</span>}
                  {l.limit !== null && l.claimed > l.limit && <Badge tone="warning" className="ml-2">capped</Badge>}
                </span>
              </div>
              {l.limit !== null && <Progress className="mt-2" value={(l.claimed / l.limit) * 100} tone={l.claimed >= l.limit ? 'positive' : 'primary'} />}
              <div className="mt-1 text-[12px] text-ink-3">
                {l.headroom !== null && l.headroom > 0 ? `You can still claim ${formatMoney(l.headroom, currency)}. ` : ''}{l.note}
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardHeader title="Proofs & receipts" subtitle="Keep a record of what you’ll declare to your employer or in your return." />
        {view.docs.length ? (
          <ul className="divide-y divide-line">
            {view.docs.map((d) => (
              <li key={d.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                <Landmark size={16} className="text-primary" />
                <span className="min-w-0 flex-1 truncate font-medium">{d.document_name}</span>
                <Badge>{d.section.replace('_', ' ')}</Badge>
                <span className="tabular-nums font-semibold">{formatMoney(d.amount, currency)}</span>
                {d.owner_id === userId && <IconButton label="Delete" onClick={async () => { if (await confirmAction({ title: `Delete ${d.document_name}?`, confirmLabel: 'Delete', danger: true })) mutate((b) => b.remove('taxDocs', d.id), 'Deleted') }}><Trash2 size={15} /></IconButton>}
              </li>
            ))}
          </ul>
        ) : <EmptyState icon={<Landmark size={20} />} title="Nothing recorded for this year" body="Add PPF, ELSS, insurance premiums, NPS and other proofs as you pay them." />}
      </Card>

      <div className="mt-4 flex gap-2 rounded-[12px] border border-line bg-surface p-3 text-[12.5px] text-ink-3">
        <Info size={16} className="mt-0.5 shrink-0" />
        <p>Limits shown are for the old tax regime and individual taxpayers below 60. The new regime (the default since FY 2023-24) allows very few of these deductions. This is a record-keeping aid, not tax advice — confirm with a chartered accountant or the Income Tax Department.</p>
      </div>

      <TaxForm open={adding} fy={fy} onClose={() => setAdding(false)} />
    </div>
  )
}

function TaxForm({ open, fy, onClose }: { open: boolean; fy: string; onClose: () => void }) {
  const { currency, mutate } = useHousehold()
  const [form, setForm] = useState({ name: '', section: '80C' as TaxSection, amount: '' })
  const [error, setError] = useState<string | null>(null)

  async function save() {
    const amount = parseMoney(form.amount)
    if (!form.name.trim()) return setError('Describe the proof, e.g. “PPF deposit”.')
    if (!Number.isFinite(amount) || amount <= 0) return setError('Enter an amount above zero.')
    const ok = await mutate((b) => b.insert('taxDocs', { document_name: form.name.trim(), section: form.section, amount, financial_year: fy }), 'Saved')
    if (ok) { setForm({ name: '', section: '80C', amount: '' }); setError(null); onClose() }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Add proof · FY ${fy}`} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save}>Save</Button></>}>
      <div className="grid gap-4">
        <Field label="What is it?"><input className="field" maxLength={120} placeholder="e.g. ELSS SIP statement" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Section">
          <select className="field" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value as TaxSection })}>
            {(Object.keys(TAX_LIMITS) as TaxSection[]).map((s) => <option key={s} value={s}>{TAX_LIMITS[s].label}</option>)}
          </select>
        </Field>
        <Field label={`Amount (${currency})`}><input className="field" inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Field>
      </div>
      {error && <p className="mt-3 rounded-[10px] bg-negative-soft px-3 py-2 text-sm text-negative">{error}</p>}
    </Modal>
  )
}
