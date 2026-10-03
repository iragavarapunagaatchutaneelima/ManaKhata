'use client'

import { useMemo, useState } from 'react'
import { Download, Plus, Receipt, Search } from 'lucide-react'
import { Button, Card, EmptyState, PageHeader, Segmented, Stat } from '@/components/ui'
import { ExpenseRow, IncomeRow } from '@/components/Rows'
import { MonthPicker } from '@/components/MonthPicker'
import { openAddExpense, openAddIncome } from '@/components/TransactionModal'
import { useHousehold } from '@/store/ledger'
import { CATEGORIES, category } from '@/lib/categories'
import { formatMoney, monthKey, relativeDay, sumMoney, fromMinor, toMinor } from '@/lib/money'
import { inMonth, toCSV } from '@/lib/finance'
import { saveFile } from '@/lib/download'
import type { Expense, Income } from '@/lib/model'

type Kind = 'all' | 'expense' | 'income'
type Row = { kind: 'expense'; date: string; e: Expense } | { kind: 'income'; date: string; i: Income }

export default function TransactionsPage() {
  const { data, currency, members, memberName } = useHousehold()
  const [month, setMonth] = useState(monthKey(new Date()))
  const [kind, setKind] = useState<Kind>('all')
  const [cat, setCat] = useState('')
  const [who, setWho] = useState('')
  const [q, setQ] = useState('')

  const { rows, spent, income } = useMemo(() => {
    if (!data) return { rows: [] as Row[], spent: 0, income: 0 }
    const query = q.trim().toLowerCase()
    const expenses = data.expenses.filter((e) => inMonth(e.expense_date, month)
      && (!cat || e.category === cat) && (!who || e.paid_by === who)
      && (!query || e.description.toLowerCase().includes(query) || (e.notes ?? '').toLowerCase().includes(query)))
    const incomes = data.incomes.filter((i) => inMonth(i.income_date, month) && !cat && (!who || i.user_id === who)
      && (!query || i.source.toLowerCase().includes(query) || (i.notes ?? '').toLowerCase().includes(query)))
    const rows: Row[] = [
      ...(kind !== 'income' ? expenses.map((e) => ({ kind: 'expense' as const, date: e.expense_date, e })) : []),
      ...(kind !== 'expense' ? incomes.map((i) => ({ kind: 'income' as const, date: i.income_date, i })) : []),
    ].sort((a, b) => b.date.localeCompare(a.date))
    return { rows, spent: sumMoney(expenses, (e) => e.amount), income: sumMoney(incomes, (i) => i.amount) }
  }, [data, month, kind, cat, who, q])

  const groups = useMemo(() => {
    const map = new Map<string, Row[]>()
    for (const r of rows) map.set(r.date, [...(map.get(r.date) ?? []), r])
    return [...map.entries()]
  }, [rows])

  function exportCSV() {
    const csv = toCSV(rows.map((r) => r.kind === 'expense'
      ? { Date: r.e.expense_date, Type: 'Expense', Description: r.e.description, Category: category(r.e.category).label, Person: memberName(r.e.paid_by), Method: r.e.payment_method, Visibility: r.e.visibility, Amount: -r.e.amount, Notes: r.e.notes ?? '' }
      : { Date: r.i.income_date, Type: 'Income', Description: r.i.source, Category: 'Income', Person: memberName(r.i.user_id), Method: '', Visibility: 'HOUSEHOLD', Amount: r.i.amount, Notes: r.i.notes ?? '' }))
    if (csv) saveFile(`manakhata-transactions-${month}.csv`, csv)
  }

  return (
    <div>
      <PageHeader title="Transactions" subtitle="Everything spent and earned. Tap an entry you added to edit it."
        actions={<>
          <Button variant="secondary" icon={<Download size={16} />} onClick={exportCSV} disabled={!rows.length}>Export CSV</Button>
          <Button variant="secondary" icon={<Plus size={16} />} onClick={openAddIncome}>Income</Button>
          <Button icon={<Plus size={16} />} onClick={() => openAddExpense()}>Expense</Button>
        </>} />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <MonthPicker value={month} onChange={setMonth} />
        <Segmented value={kind} onChange={setKind} options={[{ value: 'all', label: 'All' }, { value: 'expense', label: 'Spent' }, { value: 'income', label: 'Income' }]} />
        <select className="field h-10 w-auto" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
        <select className="field h-10 w-auto" value={who} onChange={(e) => setWho(e.target.value)} aria-label="Person">
          <option value="">Everyone</option>
          {members.map((m) => <option key={m.user_id} value={m.user_id}>{m.full_name}</option>)}
        </select>
        <div className="relative min-w-[180px] flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
          <input className="field h-10 pl-9" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 [&>*:nth-child(3)]:col-span-2 sm:[&>*:nth-child(3)]:col-span-1">
        <Stat label="Spent" value={formatMoney(spent, currency)} />
        <Stat label="Income" value={formatMoney(income, currency)} tone="positive" />
        <Stat label="Net" value={formatMoney(fromMinor(toMinor(income) - toMinor(spent)), currency)} tone={income - spent >= 0 ? 'positive' : 'negative'} />
      </div>

      <Card className="overflow-hidden">
        {groups.length ? groups.map(([date, items]) => (
          <section key={date}>
            <div className="flex items-center justify-between bg-surface-2 px-4 py-2 text-[12px] font-semibold uppercase tracking-wide text-ink-3">
              <span>{relativeDay(date)}</span>
              <span className="tabular-nums">{formatMoney(sumMoney(items.filter((r) => r.kind === 'expense'), (r) => (r as { e: Expense }).e.amount), currency)}</span>
            </div>
            <div className="divide-y divide-line">
              {items.map((r) => r.kind === 'expense' ? <ExpenseRow key={r.e.id} e={r.e} showDate={false} /> : <IncomeRow key={r.i.id} i={r.i} />)}
            </div>
          </section>
        )) : (
          <EmptyState icon={<Receipt size={20} />} title="Nothing here" body="No transactions match this month and filter."
            action={<Button size="sm" onClick={() => openAddExpense()}>Add expense</Button>} />
        )}
      </Card>
    </div>
  )
}
