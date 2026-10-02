'use client'

import { useMemo, useState } from 'react'
import { CalendarClock, CheckCircle2, Pause, Pencil, Play, Plus, Trash2 } from 'lucide-react'
import { Badge, Button, Card, EmptyState, Field, IconButton, Modal, PageHeader, Stat, confirmAction, cx } from '@/components/ui'
import { CategoryIcon } from '@/components/CategoryIcon'
import { useHousehold } from '@/store/ledger'
import { CATEGORIES, category } from '@/lib/categories'
import { daysBetween, formatDate, formatMoney, parseMoney, sumMoney, today } from '@/lib/money'
import { billsDue, monthlyBillLoad } from '@/lib/finance'
import type { BillFrequency, RecurringBill } from '@/lib/model'

const FREQ: { value: BillFrequency; label: string }[] = [
  { value: 'WEEKLY', label: 'Weekly' }, { value: 'MONTHLY', label: 'Monthly' }, { value: 'QUARTERLY', label: 'Every 3 months' }, { value: 'YEARLY', label: 'Yearly' },
]

export default function BillsPage() {
  const { data, currency, firstName, mutate } = useHousehold()
  const [editing, setEditing] = useState<RecurringBill | 'new' | null>(null)
  const t = today()

  const view = useMemo(() => {
    if (!data) return null
    const due30 = billsDue(data.bills, t, 30)
    const sorted = [...data.bills].sort((a, b) => Number(b.is_active) - Number(a.is_active) || a.next_due_date.localeCompare(b.next_due_date))
    return {
      load: monthlyBillLoad(data.bills),
      due30: sumMoney(due30, (d) => d.bill.amount),
      overdue: due30.filter((d) => d.overdue).length,
      sorted,
      history: (id: string) => data.expenses.filter((e) => e.bill_id === id).slice(0, 3),
    }
  }, [data, t])

  if (!view) return null

  return (
    <div>
      <PageHeader title="Bills & subscriptions" subtitle="Rent, EMIs, fees and subscriptions with due-date reminders."
        actions={<Button icon={<Plus size={16} />} onClick={() => setEditing('new')}>Add bill</Button>} />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 [&>*:nth-child(3)]:col-span-2 sm:[&>*:nth-child(3)]:col-span-1">
        <Stat label="Monthly bill load" value={formatMoney(view.load, currency)} hint="All active bills, per month" />
        <Stat label="Due in 30 days" value={formatMoney(view.due30, currency)} />
        <Stat label="Overdue" value={String(view.overdue)} tone={view.overdue ? 'negative' : 'positive'} hint={view.overdue ? 'Pay or reschedule' : 'All on time'} />
      </div>

      {view.sorted.length ? (
        <Card className="divide-y divide-line overflow-hidden">
          {view.sorted.map((bill) => {
            const days = daysBetween(t, bill.next_due_date)
            const overdue = days < 0
            const history = view.history(bill.id)
            return (
              <div key={bill.id} className={cx('flex flex-wrap items-center gap-3 px-4 py-3.5', !bill.is_active && 'opacity-55')}>
                <CategoryIcon cat={bill.category} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-ink">{bill.name}</span>
                    <Badge>{FREQ.find((f) => f.value === bill.frequency)?.label}</Badge>
                    {!bill.is_active && <Badge>Paused</Badge>}
                  </div>
                  <div className="text-[12.5px] text-ink-3">
                    {category(bill.category).label}{bill.owner_id && <> · paid by {firstName(bill.owner_id)}</>}
                    {history.length > 0 && <> · last paid {formatDate(history[0].expense_date)}</>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold tabular-nums">{formatMoney(bill.amount, currency)}</div>
                  {bill.is_active && (
                    <div className={cx('text-[12px] font-semibold', overdue ? 'text-negative' : days <= 3 ? 'text-warning' : 'text-ink-3')}>
                      {overdue ? `Overdue ${-days}d` : days === 0 ? 'Due today' : `Due ${formatDate(bill.next_due_date)}`}
                    </div>
                  )}
                </div>
                <div className="flex w-full justify-end gap-1 sm:w-auto">
                  {bill.is_active && (
                    <Button size="sm" variant="secondary" icon={<CheckCircle2 size={15} />}
                      onClick={() => mutate((b) => b.payBill(bill.id), `${bill.name} recorded as paid`)}>Mark paid</Button>
                  )}
                  <IconButton label={bill.is_active ? 'Pause bill' : 'Resume bill'} onClick={() => mutate((b) => b.update('bills', bill.id, { is_active: !bill.is_active }), bill.is_active ? 'Bill paused' : 'Bill resumed')}>
                    {bill.is_active ? <Pause size={16} /> : <Play size={16} />}
                  </IconButton>
                  <IconButton label="Edit bill" onClick={() => setEditing(bill)}><Pencil size={16} /></IconButton>
                  <IconButton label="Delete bill" onClick={async () => {
                    if (await confirmAction({ title: `Delete “${bill.name}”?`, body: 'Past payments stay in your transactions.', confirmLabel: 'Delete', danger: true }))
                      mutate((b) => b.remove('bills', bill.id), 'Bill deleted')
                  }}><Trash2 size={16} /></IconButton>
                </div>
              </div>
            )
          })}
        </Card>
      ) : (
        <Card><EmptyState icon={<CalendarClock size={20} />} title="No bills yet" body="Add rent, loan EMIs, school fees, insurance premiums and subscriptions to see what’s coming up." action={<Button onClick={() => setEditing('new')}>Add your first bill</Button>} /></Card>
      )}

      <BillForm bill={editing} onClose={() => setEditing(null)} />
    </div>
  )
}

function BillForm({ bill, onClose }: { bill: RecurringBill | 'new' | null; onClose: () => void }) {
  const { members, userId, currency, mutate } = useHousehold()
  const editing = bill && bill !== 'new' ? bill : null
  const [form, setForm] = useState({ name: '', amount: '', category: 'RENT', frequency: 'MONTHLY' as BillFrequency, next: today(), owner: userId })
  const [error, setError] = useState<string | null>(null)
  const [key, setKey] = useState<string | null>(null)
  const formKey = bill === null ? null : editing?.id ?? 'new'
  if (formKey !== key) {
    setKey(formKey)
    setForm(editing
      ? { name: editing.name, amount: String(editing.amount), category: editing.category, frequency: editing.frequency, next: editing.next_due_date, owner: editing.owner_id ?? userId }
      : { name: '', amount: '', category: 'RENT', frequency: 'MONTHLY', next: today(), owner: userId })
    setError(null)
  }

  async function save() {
    const amount = parseMoney(form.amount)
    if (!form.name.trim()) return setError('Give the bill a name.')
    if (!Number.isFinite(amount) || amount <= 0) return setError('Enter an amount above zero.')
    const row = { name: form.name.trim(), amount, category: form.category, frequency: form.frequency, next_due_date: form.next, owner_id: form.owner || null }
    const ok = await mutate((b) => editing ? b.update('bills', editing.id, row) : b.insert('bills', { ...row, is_active: true }), editing ? 'Bill updated' : 'Bill added')
    if (ok) onClose()
  }

  return (
    <Modal open={bill !== null} onClose={onClose} title={editing ? 'Edit bill' : 'Add bill'}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save}>{editing ? 'Save' : 'Add bill'}</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" className="sm:col-span-2"><input className="field" placeholder="e.g. Home loan EMI" maxLength={80} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label={`Amount (${currency})`}><input className="field" inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Field>
        <Field label="Repeats">
          <select className="field" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value as BillFrequency })}>
            {FREQ.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </Field>
        <Field label="Category">
          <select className="field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </Field>
        <Field label="Next due date"><input className="field" type="date" value={form.next} onChange={(e) => setForm({ ...form, next: e.target.value })} /></Field>
        <Field label="Usually paid by" className="sm:col-span-2">
          <select className="field" value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })}>
            {members.map((m) => <option key={m.user_id} value={m.user_id}>{m.full_name}</option>)}
          </select>
        </Field>
      </div>
      {error && <p className="mt-3 rounded-[10px] bg-negative-soft px-3 py-2 text-sm text-negative">{error}</p>}
    </Modal>
  )
}
