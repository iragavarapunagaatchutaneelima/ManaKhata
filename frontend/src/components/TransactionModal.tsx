'use client'

import { useMemo, useState } from 'react'
import { create } from 'zustand'
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { Button, Field, Modal, Segmented, Toggle, confirmAction, cx } from './ui'
import { CategoryIcon } from './CategoryIcon'
import { CATEGORIES, INCOME_SOURCES, PAYMENT_METHODS } from '@/lib/categories'
import { formatMoney, parseMoney, splitEvenly, sumMoney, today, toMinor } from '@/lib/money'
import type { Expense, Income, PaymentMethod } from '@/lib/model'
import { useHousehold } from '@/store/ledger'

// Global open/close so any screen (or the + button) can start a new entry.
// `seq` changes on every open, which remounts the form with fresh state.
interface QuickAddState { open: boolean; seq: number; kind: 'expense' | 'income'; editExpense: Expense | null; editIncome: Income | null; preset: Partial<Expense> | null }
export const useQuickAdd = create<QuickAddState>(() => ({ open: false, seq: 0, kind: 'expense', editExpense: null, editIncome: null, preset: null }))
const openWith = (s: Omit<QuickAddState, 'open' | 'seq'>) => useQuickAdd.setState((cur) => ({ ...s, open: true, seq: cur.seq + 1 }))
export const openAddExpense = (preset: Partial<Expense> | null = null) => openWith({ kind: 'expense', editExpense: null, editIncome: null, preset })
export const openAddIncome = () => openWith({ kind: 'income', editExpense: null, editIncome: null, preset: null })
export const openEditExpense = (e: Expense) => openWith({ kind: 'expense', editExpense: e, editIncome: null, preset: null })
export const openEditIncome = (i: Income) => openWith({ kind: 'income', editExpense: null, editIncome: i, preset: null })
const close = () => useQuickAdd.setState({ open: false })

type SplitMode = 'none' | 'equal' | 'custom'

export default function TransactionModal() {
  const seq = useQuickAdd((s) => s.seq)
  return <TransactionForm key={seq} />
}

function TransactionForm() {
  const { open, kind, editExpense, editIncome, preset } = useQuickAdd()
  const { data, userId, members, currency, mutate, firstName } = useHousehold()

  const existingSplits = useMemo(() => (editExpense ? (data?.splits ?? []).filter((s) => s.expense_id === editExpense.id) : []), [editExpense, data])
  const splitsLocked = existingSplits.some((s) => s.settled_at)

  // Initial values come from what was opened (new entry, preset, or an entry being edited).
  const e0 = editExpense
  const p0 = preset ?? {}
  const i0 = editIncome
  const [tab, setTab] = useState<'expense' | 'income'>(kind)
  const [amount, setAmount] = useState(i0 ? String(i0.amount) : e0 ? String(e0.amount) : p0.amount ? String(p0.amount) : '')
  const [description, setDescription] = useState(e0?.description ?? p0.description ?? '')
  const [cat, setCat] = useState(e0?.category ?? p0.category ?? 'GROCERIES')
  const [date, setDate] = useState(i0?.income_date ?? e0?.expense_date ?? p0.expense_date ?? today())
  const [paidBy, setPaidBy] = useState(e0?.paid_by ?? userId)
  const [method, setMethod] = useState<PaymentMethod>(e0?.payment_method ?? 'UPI')
  const [personal, setPersonal] = useState((e0?.visibility ?? p0.visibility) === 'PERSONAL')
  const [reimbursable, setReimbursable] = useState(e0?.is_reimbursable ?? false)
  const [notes, setNotes] = useState(i0?.notes ?? e0?.notes ?? '')
  const [splitMode, setSplitMode] = useState<SplitMode>(e0 && existingSplits.length ? 'custom' : 'none')
  const [participants, setParticipants] = useState<string[]>(e0 && existingSplits.length ? [e0.paid_by, ...existingSplits.map((s) => s.owed_by)] : members.map((m) => m.user_id))
  const [custom, setCustom] = useState<Record<string, string>>(Object.fromEntries(existingSplits.map((s) => [s.owed_by, String(s.amount)])))
  const [source, setSource] = useState(i0?.source ?? 'Salary')
  const [earner, setEarner] = useState(i0?.user_id ?? userId)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const value = parseMoney(amount)
  const others = participants.filter((p) => p !== paidBy)
  const shares = useMemo(() => {
    if (splitMode === 'equal') {
      const parts = splitEvenly(Number.isFinite(value) ? value : 0, participants.length || 1)
      return Object.fromEntries(participants.map((p, i) => [p, parts[i] ?? 0]))
    }
    if (splitMode === 'custom') return Object.fromEntries(others.map((p) => [p, parseMoney(custom[p] ?? '') || 0]))
    return {}
  }, [splitMode, value, participants, others, custom])
  const owedTotal = sumMoney(others, (p) => shares[p] ?? 0)

  async function save() {
    setError(null)
    if (!Number.isFinite(value) || value <= 0) return setError('Enter an amount greater than zero.')
    if (tab === 'expense') {
      if (!description.trim()) return setError('Add a short description.')
      if (splitMode !== 'none' && !personal) {
        if (!others.length) return setError('Pick at least one other person to split with.')
        if (toMinor(owedTotal) >= toMinor(value)) return setError("Others' shares must be less than the total.")
        if (others.some((p) => !(shares[p] > 0))) return setError('Each person in the split needs a share above zero.')
      }
      setSaving(true)
      const row = {
        amount: value, description: description.trim(), category: cat, expense_date: date, paid_by: paidBy,
        payment_method: method, visibility: personal ? 'PERSONAL' as const : 'HOUSEHOLD' as const, is_reimbursable: reimbursable, notes: notes.trim() || null,
      }
      const ok = await mutate(async (b) => {
        const saved = editExpense ? await b.update('expenses', editExpense.id, row) : await b.insert('expenses', { ...row, bill_id: preset?.bill_id ?? null })
        if (!splitsLocked) {
          for (const s of existingSplits) await b.remove('splits', s.id)
          if (splitMode !== 'none' && !personal) {
            await b.insertMany('splits', others.map((p) => ({ expense_id: saved.id, owed_by: p, owed_to: paidBy, amount: shares[p] })))
          }
        }
        return true
      }, editExpense ? 'Expense updated' : 'Expense added')
      setSaving(false)
      if (ok) close()
    } else {
      setSaving(true)
      const row = { amount: value, source, income_date: date, user_id: earner, notes: notes.trim() || null }
      const ok = await mutate((b) => (editIncome ? b.update('incomes', editIncome.id, row) : b.insert('incomes', row)), editIncome ? 'Income updated' : 'Income added')
      setSaving(false)
      if (ok) close()
    }
  }

  const editing = !!(editExpense || editIncome)

  async function remove() {
    const ok = await confirmAction({
      title: editExpense ? 'Delete this expense?' : 'Delete this income?',
      body: existingSplits.length ? 'Its split balances will be removed too. This cannot be undone.' : 'This cannot be undone.',
      confirmLabel: 'Delete', danger: true,
    })
    if (!ok) return
    const done = await mutate(async (b) => {
      await (editExpense ? b.remove('expenses', editExpense.id) : b.remove('incomes', editIncome!.id))
      return true
    }, 'Deleted')
    if (done) close()
  }

  return (
    <Modal open={open} onClose={close} title={editing ? (tab === 'expense' ? 'Edit expense' : 'Edit income') : 'New entry'} wide
      footer={<>
        {editing && <Button variant="ghost" className="mr-auto text-negative" onClick={remove}>Delete</Button>}
        <Button variant="secondary" onClick={close}>Cancel</Button>
        <Button onClick={save} loading={saving}>{editing ? 'Save changes' : tab === 'expense' ? 'Add expense' : 'Add income'}</Button>
      </>}>
      {!editing && (
        <Segmented className="mb-4" value={tab} onChange={setTab} options={[
          { value: 'expense', label: <span className="inline-flex items-center gap-1.5"><ArrowUpRight size={14} /> Expense</span> },
          { value: 'income', label: <span className="inline-flex items-center gap-1.5"><ArrowDownLeft size={14} /> Income</span> },
        ]} />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={`Amount (${currency})`}>
          <input className="field text-lg font-semibold" inputMode="decimal" autoFocus placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label="Date">
          <input className="field" type="date" value={date} max={tab === 'income' ? undefined : undefined} onChange={(e) => setDate(e.target.value)} />
        </Field>

        {tab === 'expense' ? (
          <>
            <Field label="Description" className="sm:col-span-2">
              <input className="field" placeholder="e.g. Weekly vegetables" maxLength={200} value={description} onChange={(e) => setDescription(e.target.value)} />
            </Field>
            <div className="sm:col-span-2">
              <span className="mb-1.5 block text-[13px] font-semibold text-ink-2">Category</span>
              <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5">
                {CATEGORIES.map((c) => (
                  <button key={c.key} type="button" onClick={() => setCat(c.key)}
                    className={cx('flex flex-col items-center gap-1 rounded-[10px] border p-2 text-[11.5px] font-medium transition',
                      cat === c.key ? 'border-primary bg-primary-soft text-ink' : 'border-line text-ink-2 hover:bg-surface-2')}>
                    <CategoryIcon cat={c.key} size={28} />
                    <span className="line-clamp-1">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <Field label="Paid by">
              <select className="field" value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
                {members.map((m) => <option key={m.user_id} value={m.user_id}>{m.user_id === userId ? `${m.full_name} (me)` : m.full_name}</option>)}
              </select>
            </Field>
            <Field label="Paid with">
              <select className="field" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
                {PAYMENT_METHODS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
              </select>
            </Field>

            <div className="flex items-center justify-between gap-3 rounded-[12px] border border-line p-3 sm:col-span-2">
              <div>
                <div className="text-sm font-semibold text-ink">Keep private</div>
                <div className="text-[12.5px] text-ink-3">Only you will see this expense. It won’t count in household totals.</div>
              </div>
              <Toggle label="Keep private" checked={personal} onChange={(v) => { setPersonal(v); if (v) setSplitMode('none') }} />
            </div>

            {!personal && members.length > 1 && (
              <div className="rounded-[12px] border border-line p-3 sm:col-span-2">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-ink">Split with family</div>
                  <Segmented value={splitMode} onChange={(v) => !splitsLocked && setSplitMode(v)} options={[
                    { value: 'none', label: 'No split' }, { value: 'equal', label: 'Equally' }, { value: 'custom', label: 'Custom' },
                  ]} />
                </div>
                {splitsLocked && <p className="text-[12.5px] text-warning">Part of this split is already settled, so the split can’t be changed.</p>}
                {splitMode !== 'none' && (
                  <div className="space-y-1.5">
                    {members.map((m) => {
                      const inSplit = participants.includes(m.user_id)
                      const isPayer = m.user_id === paidBy
                      return (
                        <div key={m.user_id} className="flex items-center gap-3 rounded-[10px] px-2 py-1.5 hover:bg-surface-2">
                          <input type="checkbox" className="h-4 w-4 accent-[var(--primary)]" checked={inSplit} disabled={isPayer || splitsLocked}
                            onChange={(e) => setParticipants((ps) => e.target.checked ? [...ps, m.user_id] : ps.filter((p) => p !== m.user_id))} />
                          <span className="flex-1 text-sm text-ink">{m.full_name}{isPayer && <span className="text-ink-3"> · paid</span>}</span>
                          {splitMode === 'equal' && inSplit && <span className="text-sm tabular-nums text-ink-2">{formatMoney(shares[m.user_id] ?? 0, currency, { decimals: true })}</span>}
                          {splitMode === 'custom' && inSplit && !isPayer && (
                            <input className="field h-9 w-28 text-right" inputMode="decimal" placeholder="0" value={custom[m.user_id] ?? ''} disabled={splitsLocked}
                              onChange={(e) => setCustom((c) => ({ ...c, [m.user_id]: e.target.value }))} />
                          )}
                        </div>
                      )
                    })}
                    <p className="pt-1 text-[12.5px] text-ink-3">
                      {others.length ? <>{others.map((p) => firstName(p)).join(', ')} will owe {firstName(paidBy)} {formatMoney(owedTotal, currency, { decimals: true })} in total.</> : 'Tick who shared this expense.'}
                    </p>
                  </div>
                )}
              </div>
            )}

            <label className="flex items-center gap-2 text-sm text-ink-2 sm:col-span-2">
              <input type="checkbox" className="h-4 w-4 accent-[var(--primary)]" checked={reimbursable} onChange={(e) => setReimbursable(e.target.checked)} />
              I paid this for the household and want it reimbursed
            </label>
          </>
        ) : (
          <>
            <Field label="Source">
              <select className="field" value={source} onChange={(e) => setSource(e.target.value)}>
                {INCOME_SOURCES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Received by">
              <select className="field" value={earner} onChange={(e) => setEarner(e.target.value)}>
                {members.map((m) => <option key={m.user_id} value={m.user_id}>{m.user_id === userId ? `${m.full_name} (me)` : m.full_name}</option>)}
              </select>
            </Field>
            <p className="text-[12.5px] text-ink-3 sm:col-span-2">Regular salaries are set once as “monthly income” in Household. Use this for anything extra — bonuses, freelance, interest, refunds.</p>
          </>
        )}

        <Field label="Notes (optional)" className="sm:col-span-2">
          <textarea className="field" maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </div>
      {error && <p className="mt-3 rounded-[10px] bg-negative-soft px-3 py-2 text-sm text-negative">{error}</p>}
    </Modal>
  )
}
