'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { ArrowRight, CalendarClock, Lightbulb, Plus, Wallet } from 'lucide-react'
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, Pie, PieChart, Cell } from 'recharts'
import { Badge, Button, Card, CardHeader, EmptyState, Money, Progress, Stat } from '@/components/ui'
import { ExpenseRow } from '@/components/Rows'
import { CategoryIcon } from '@/components/CategoryIcon'
import { openAddExpense, openAddIncome } from '@/components/TransactionModal'
import { useHousehold } from '@/store/ledger'
import {
  billsDue, budgetProgress, categoryBreakdown, householdIncome, householdSpend, householdTrend, insights, inMonth,
  memberIncome, memberShare, netBalances, summarize, walletBalance,
} from '@/lib/finance'
import { addMonths, formatCompact, formatMoney, monthKey, monthLabel, parseISODate, today, daysInMonth, sumMoney } from '@/lib/money'
import { category } from '@/lib/categories'

export default function HomePage() {
  const { data, me, userId, currency, firstName, mutate, canSeeAnalytics } = useHousehold()
  const t = today()
  const key = monthKey(t)

  const view = useMemo(() => {
    if (!data) return null
    const prev = addMonths(key, -1)
    const spent = householdSpend(data.expenses, key)
    const income = householdIncome(data.members, data.incomes, key)
    // Same point last month, for a fair "pace" comparison.
    const day = parseISODate(t).getDate()
    const lastAtSamePoint = sumMoney(data.expenses.filter((e) =>
      e.visibility === 'HOUSEHOLD' && inMonth(e.expense_date, prev) && parseISODate(e.expense_date).getDate() <= Math.min(day, daysInMonth(prev))), (e) => e.amount)
    return {
      month: summarize(income, spent, key),
      last: summarize(householdIncome(data.members, data.incomes, prev), householdSpend(data.expenses, prev), prev),
      pace: lastAtSamePoint > 0 ? ((spent - lastAtSamePoint) / lastAtSamePoint) * 100 : null,
      myShare: memberShare(data.expenses, data.splits, userId, key),
      myIncome: memberIncome(data.members, data.incomes, userId, key),
      myWallet: walletBalance(data.wallet, userId),
      myNet: netBalances(data.splits).get(userId) ?? 0,
      trend: householdTrend(data, key, 6),
      categories: categoryBreakdown(data.expenses.filter((e) => e.visibility === 'HOUSEHOLD' && inMonth(e.expense_date, key))),
      bills: billsDue(data.bills, t, 14),
      budgets: data.budgets.filter((b) => !b.user_id || b.user_id === userId).map((b) => budgetProgress(b, data.expenses, key, t)).sort((a, b) => b.percent - a.percent).slice(0, 4),
      tips: insights(data, t).slice(0, 4),
      recent: data.expenses.slice(0, 7),
    }
  }, [data, key, t, userId])

  if (!data || !view || !me) return null
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const noData = data.expenses.length === 0 && data.incomes.length === 0

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-ink-3">{monthLabel(key, 'long')}</p>
          <h1 className="font-display text-[26px] font-bold text-ink">{greeting}, {me.full_name.split(' ')[0]}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={<Plus size={16} />} onClick={openAddIncome}>Income</Button>
          <Button icon={<Plus size={16} />} onClick={() => openAddExpense()}>Expense</Button>
        </div>
      </div>

      {noData && (
        <Card fold className="p-6">
          <h2 className="font-display text-lg font-bold">Welcome to {data.household.name} 👋</h2>
          <p className="mt-1 max-w-2xl text-sm text-ink-2">
            Start by adding today’s spending, set your monthly income in <Link className="font-semibold text-primary" href="/household">Household</Link>,
            and invite your family with code <span className="rounded bg-surface-3 px-1.5 py-0.5 font-mono font-semibold">{data.household.invite_code}</span>.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => openAddExpense()} icon={<Plus size={16} />}>Add first expense</Button>
            <Link href="/budget"><Button variant="secondary">Set a budget</Button></Link>
            <Link href="/bills"><Button variant="secondary">Add a bill</Button></Link>
          </div>
        </Card>
      )}

      {canSeeAnalytics ? (
        <>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Household spent" value={formatMoney(view.month.spent, currency)}
            hint={view.pace === null ? 'This month so far' : <span className={view.pace > 0 ? 'text-negative' : 'text-positive'}>{view.pace > 0 ? '▲' : '▼'} {Math.abs(view.pace).toFixed(0)}% vs same point last month</span>} />
          <Stat label="Household income" value={formatMoney(view.month.income, currency)} hint="Salaries + extra income" />
          <Stat label="Left this month" value={formatMoney(view.month.saved, currency)} tone={view.month.saved >= 0 ? 'positive' : 'negative'}
            hint={view.last.income > 0 ? `Saved ${view.last.savingsRate.toFixed(0)}% in ${monthLabel(view.last.key, 'long').split(' ')[0]}` : 'Income minus spending so far'} />
          {view.myIncome > 0 || me.role !== 'STUDENT'
            ? <Stat label="Your share" value={formatMoney(view.myShare, currency)} hint="What you paid, net of splits" tone="primary" />
            : <Stat label="Your pocket money" value={formatMoney(view.myWallet, currency)} hint={<Link className="text-primary" href="/wallet">Open wallet →</Link>} icon={<Wallet size={16} />} tone="primary" />}
        </div>

        <div className="grid gap-5 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardHeader title="Income vs spending" subtitle="Last 6 months, whole household" action={<Link href="/reports" className="text-[13px] font-semibold text-primary">Reports</Link>} />
            <div className="h-64 px-2 pb-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={view.trend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickFormatter={(v) => formatCompact(v, currency)} tickLine={false} axisLine={false} fontSize={12} width={56} />
                  <Tooltip formatter={(v, n) => [formatMoney(Number(v), currency), n === 'spent' ? 'Spent' : 'Income']} cursor={{ fill: 'var(--surface-2)' }} />
                  <Bar dataKey="spent" fill="var(--primary)" radius={[6, 6, 0, 0]} maxBarSize={36} />
                  <Line dataKey="income" stroke="var(--saffron)" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--saffron)' }} type="monotone" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader title="Where it went" subtitle={`${monthLabel(key, 'long')} · shared spending`} />
            {view.categories.length ? (
              <div className="flex items-center gap-4 px-5 pb-5">
                <div className="h-36 w-36 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={view.categories} dataKey="amount" nameKey="label" innerRadius={42} outerRadius={66} paddingAngle={2} stroke="none">
                        {view.categories.map((c) => <Cell key={c.category} fill={c.color} />)}
                      </Pie>
                      <Tooltip formatter={(v) => formatMoney(Number(v), currency)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="min-w-0 flex-1 space-y-2">
                  {view.categories.slice(0, 5).map((c) => (
                    <li key={c.category} className="flex items-center gap-2 text-[13px]">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.color }} />
                      <span className="flex-1 truncate text-ink-2">{c.label}</span>
                      <span className="font-semibold tabular-nums text-ink">{formatCompact(c.amount, currency)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : <EmptyState title="No shared spending yet" body="Expenses you add this month appear here." />}
          </Card>
        </div>
        </>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Your pocket money" value={formatMoney(view.myWallet, currency)} tone="primary" icon={<Wallet size={16} />} hint={<Link className="text-primary" href="/wallet">Open wallet →</Link>} />
          <Stat label="You spent this month" value={formatMoney(view.myShare, currency)} hint="Your share, net of splits" />
          <Stat label="Chores to do" value={String(data.chores.filter((c) => c.assigned_to === userId && (c.status === 'PENDING' || c.status === 'REJECTED')).length)} hint={<Link className="text-primary" href="/chores">See chores →</Link>} />
          <Stat label={view.myNet >= 0 ? 'Owed to you' : 'You owe'} value={formatMoney(Math.abs(view.myNet), currency)} tone={view.myNet < 0 ? 'negative' : 'positive'} hint={<Link className="text-primary" href="/splits">Split & settle →</Link>} />
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader title="Upcoming bills" subtitle="Next 14 days" action={<Link href="/bills" className="text-[13px] font-semibold text-primary">All bills</Link>} />
          {view.bills.length ? (
            <ul className="divide-y divide-line">
              {view.bills.slice(0, 5).map(({ bill, daysLeft, overdue }) => (
                <li key={bill.id} className="flex items-center gap-3 px-5 py-3">
                  <CategoryIcon cat={bill.category} size={32} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink">{bill.name}</div>
                    <div className={overdue ? 'text-[12px] font-semibold text-negative' : 'text-[12px] text-ink-3'}>
                      {overdue ? `Overdue by ${-daysLeft} day${daysLeft === -1 ? '' : 's'}` : daysLeft === 0 ? 'Due today' : `Due in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold tabular-nums">{formatMoney(bill.amount, currency)}</div>
                    <button className="text-[12px] font-semibold text-primary" onClick={() => mutate((b) => b.payBill(bill.id), `${bill.name} marked paid`)}>Mark paid</button>
                  </div>
                </li>
              ))}
            </ul>
          ) : <EmptyState icon={<CalendarClock size={20} />} title="Nothing due soon" body="Add rent, EMIs and subscriptions to get reminders." />}
        </Card>

        <Card>
          <CardHeader title="Budgets" subtitle="This month" action={<Link href="/budget" className="text-[13px] font-semibold text-primary">Manage</Link>} />
          {view.budgets.length ? (
            <ul className="space-y-4 px-5 pb-5">
              {view.budgets.map((p) => (
                <li key={p.budget.id}>
                  <div className="mb-1.5 flex items-center justify-between text-[13px]">
                    <span className="font-medium text-ink">{category(p.budget.category).label}{p.budget.user_id && <span className="text-ink-3"> · personal</span>}</span>
                    <span className="tabular-nums text-ink-3">{formatCompact(p.spent, currency)} / {formatCompact(p.budget.monthly_limit, currency)}</span>
                  </div>
                  <Progress value={p.percent} tone={p.status === 'over' ? 'negative' : p.status === 'warn' ? 'warning' : 'positive'} />
                </li>
              ))}
            </ul>
          ) : <EmptyState title="No budgets yet" body="Set monthly limits for the categories you care about." action={<Link href="/budget"><Button size="sm" variant="secondary">Create budget</Button></Link>} />}
        </Card>

        <Card>
          <CardHeader title="Worth a look" action={<Lightbulb size={16} className="text-saffron" />} />
          <ul className="space-y-2 px-5 pb-5">
            {view.myNet !== 0 && (
              <li className="rounded-[12px] bg-primary-soft p-3 text-[13px]">
                <div className="font-semibold text-ink">{view.myNet > 0 ? 'Family owes you' : 'You owe family'} <Money amount={Math.abs(view.myNet)} currency={currency} /></div>
                <Link href="/splits" className="font-semibold text-primary">Settle up →</Link>
              </li>
            )}
            {view.tips.map((tip) => (
              <li key={tip.id} className="rounded-[12px] border border-line p-3">
                <div className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                  <Badge tone={tip.tone === 'good' ? 'positive' : tip.tone === 'warn' ? 'warning' : 'primary'}>{tip.tone === 'good' ? 'Nice' : tip.tone === 'warn' ? 'Heads up' : 'FYI'}</Badge>
                  <span className="truncate">{tip.title}</span>
                </div>
                <p className="mt-1 text-[12.5px] text-ink-3">{tip.body}</p>
              </li>
            ))}
            {!view.tips.length && view.myNet === 0 && <p className="py-6 text-center text-sm text-ink-3">All caught up. Insights appear as you add data.</p>}
          </ul>
        </Card>
      </div>

      <Card>
        <CardHeader title="Recent activity" action={<Link href="/expenses" className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary">All transactions <ArrowRight size={14} /></Link>} />
        {view.recent.length ? <div className="divide-y divide-line">{view.recent.map((e) => <ExpenseRow key={e.id} e={e} />)}</div>
          : <EmptyState title="No transactions yet" body={`Tap + to record what ${firstName(userId)} spent today.`} />}
      </Card>
    </div>
  )
}
