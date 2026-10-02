'use client'

import { useMemo, useState } from 'react'
import { Check, Plus, RefreshCcw, Undo2, X } from 'lucide-react'
import { Avatar, Badge, Button, Card, EmptyState, Field, Modal, PageHeader, Segmented, Stat, confirmAction } from '@/components/ui'
import { CategoryIcon } from '@/components/CategoryIcon'
import { useHousehold } from '@/store/ledger'
import { CATEGORIES, category } from '@/lib/categories'
import { formatDate, formatMoney, parseMoney, sumMoney, today } from '@/lib/money'
import type { ReimbursementStatus } from '@/lib/model'

const TONE: Record<ReimbursementStatus, 'warning' | 'primary' | 'positive' | 'negative'> = { PENDING: 'warning', APPROVED: 'primary', SETTLED: 'positive', REJECTED: 'negative' }
const LABEL: Record<ReimbursementStatus, string> = { PENDING: 'Waiting for approval', APPROVED: 'Approved — to be paid', SETTLED: 'Paid back', REJECTED: 'Declined' }

export default function ReimbursementsPage() {
  const { data, userId, currency, isManager, memberName, firstName, mutate } = useHousehold()
  const [filter, setFilter] = useState<'open' | 'SETTLED' | 'REJECTED' | 'all'>('open')
  const [mine, setMine] = useState(!isManager)
  const [open, setOpen] = useState(false)

  const view = useMemo(() => {
    if (!data) return null
    const list = data.reimbursements.filter((r) => (!mine || r.requested_by === userId)
      && (filter === 'all' || (filter === 'open' ? r.status === 'PENDING' || r.status === 'APPROVED' : r.status === filter)))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
    const year = today().slice(0, 4)
    return {
      list,
      pending: sumMoney(data.reimbursements.filter((r) => r.status === 'PENDING'), (r) => r.amount),
      approved: sumMoney(data.reimbursements.filter((r) => r.status === 'APPROVED'), (r) => r.amount),
      paidThisYear: sumMoney(data.reimbursements.filter((r) => r.status === 'SETTLED' && (r.settled_at ?? '').startsWith(year)), (r) => r.amount),
    }
  }, [data, filter, mine, userId])

  if (!view) return null

  return (
    <div>
      <PageHeader title="Reimbursements" subtitle="Paid for the household from your own pocket? Ask to be paid back."
        actions={<Button icon={<Plus size={16} />} onClick={() => setOpen(true)}>Request money back</Button>} />

      <div className="mb-5 grid grid-cols-3 gap-3">
        <Stat label="Waiting for approval" value={formatMoney(view.pending, currency)} tone={view.pending ? 'saffron' : undefined} />
        <Stat label="Approved, unpaid" value={formatMoney(view.approved, currency)} tone="primary" />
        <Stat label="Paid back this year" value={formatMoney(view.paidThisYear, currency)} tone="positive" />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Segmented value={filter} onChange={setFilter} options={[
          { value: 'open', label: 'Open' }, { value: 'SETTLED', label: 'Paid' }, { value: 'REJECTED', label: 'Declined' }, { value: 'all', label: 'All' },
        ]} />
        <Segmented value={mine ? 'mine' : 'everyone'} onChange={(v) => setMine(v === 'mine')} options={[{ value: 'everyone', label: 'Everyone' }, { value: 'mine', label: 'Mine' }]} />
      </div>

      <Card className="divide-y divide-line overflow-hidden">
        {view.list.length ? view.list.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3.5">
            <CategoryIcon cat={r.category} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{r.description}</span>
                <Badge tone={TONE[r.status]}>{LABEL[r.status]}</Badge>
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-ink-3">
                <Avatar name={memberName(r.requested_by)} size={18} /> {firstName(r.requested_by)} paid on {formatDate(r.paid_date, 'long')} · {category(r.category).label}
                {r.decided_by && <> · {r.status === 'REJECTED' ? 'declined' : 'approved'} by {firstName(r.decided_by)}</>}
              </div>
            </div>
            <span className="font-semibold tabular-nums">{formatMoney(r.amount, currency)}</span>
            <div className="flex w-full justify-end gap-1.5 sm:w-auto">
              {isManager && r.status === 'PENDING' && <>
                <Button size="sm" variant="secondary" icon={<X size={15} />} onClick={() => mutate((b) => b.decideReimbursement(r.id, 'REJECT'), 'Request declined')}>Decline</Button>
                <Button size="sm" icon={<Check size={15} />} onClick={() => mutate((b) => b.decideReimbursement(r.id, 'APPROVE'), 'Approved')}>Approve</Button>
              </>}
              {isManager && r.status === 'APPROVED' && (
                <Button size="sm" onClick={async () => {
                  if (await confirmAction({ title: `Mark ${formatMoney(r.amount, currency)} as paid to ${firstName(r.requested_by)}?`, body: 'Do this after you have sent the money by UPI, bank transfer or cash.', confirmLabel: 'Mark paid' }))
                    mutate((b) => b.decideReimbursement(r.id, 'SETTLE'), 'Marked as paid')
                }}>Mark paid</Button>
              )}
              {r.requested_by === userId && r.status === 'PENDING' && (
                <Button size="sm" variant="ghost" icon={<Undo2 size={15} />} onClick={() => mutate((b) => b.remove('reimbursements', r.id), 'Request withdrawn')}>Withdraw</Button>
              )}
            </div>
          </div>
        )) : <EmptyState icon={<RefreshCcw size={20} />} title="No requests here" body="When someone pays a household cost personally, they can request it back." />}
      </Card>

      <RequestForm open={open} onClose={() => setOpen(false)} />
    </div>
  )
}

function RequestForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { currency, mutate } = useHousehold()
  const [form, setForm] = useState({ amount: '', description: '', category: 'GROCERIES', date: today() })
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    const amount = parseMoney(form.amount)
    if (!Number.isFinite(amount) || amount <= 0) return setError('Enter the amount you paid.')
    if (!form.description.trim()) return setError('Say what it was for.')
    const ok = await mutate((b) => b.insert('reimbursements', { amount, description: form.description.trim(), category: form.category, paid_date: form.date }), 'Request sent')
    if (ok) { setForm({ amount: '', description: '', category: 'GROCERIES', date: today() }); setError(null); onClose() }
  }

  return (
    <Modal open={open} onClose={onClose} title="Request money back" description="The household head or a parent will approve it."
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit}>Send request</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={`Amount (${currency})`}><input className="field" inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Field>
        <Field label="Paid on"><input className="field" type="date" max={today()} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
        <Field label="What was it for?" className="sm:col-span-2"><input className="field" maxLength={200} placeholder="e.g. Paid the electricity bill" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        <Field label="Category" className="sm:col-span-2">
          <select className="field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </Field>
      </div>
      {error && <p className="mt-3 rounded-[10px] bg-negative-soft px-3 py-2 text-sm text-negative">{error}</p>}
    </Modal>
  )
}
