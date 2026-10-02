'use client'

import { useMemo, useState } from 'react'
import { Download, Printer } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Button, Card, CardHeader, EmptyState, PageHeader, Segmented, Stat } from '@/components/ui'
import { CategoryIcon } from '@/components/CategoryIcon'
import { MonthPicker } from '@/components/MonthPicker'
import { useHousehold } from '@/store/ledger'
import { categoryBreakdown, householdTrend, inMonth, spendByMember, summarize, toCSV } from '@/lib/finance'
import { addMonths, formatCompact, formatMoney, monthKey, monthLabel, sumMoney } from '@/lib/money'
import { saveFile } from '@/lib/download'

export default function ReportsPage() {
  const { data, currency, canSeeAnalytics, userId } = useHousehold()
  const [month, setMonth] = useState(monthKey(new Date()))
  const [span, setSpan] = useState<'6' | '12'>('12')

  const view = useMemo(() => {
    if (!data) return null
    const trend = householdTrend(data, month, Number(span))
    const shared = (key: string) => data.expenses.filter((e) => e.visibility === 'HOUSEHOLD' && inMonth(e.expense_date, key))
    const cur = categoryBreakdown(shared(month))
    const prev = categoryBreakdown(shared(addMonths(month, -1)))
    const prevBy = new Map(prev.map((p) => [p.category, p.amount]))
    const totals = summarize(sumMoney(trend, (p) => p.income), sumMoney(trend, (p) => p.spent), month)
    return {
      trend, totals,
      rows: cur.map((c) => ({ ...c, prev: prevBy.get(c.category) ?? 0 })),
      members: spendByMember(data, month),
      avgSpend: totals.spent / trend.length,
    }
  }, [data, month, span])

  if (!view) return null
  if (!canSeeAnalytics) return <Card><EmptyState title="Reports are turned off for you" body="Ask the household head to enable analytics for your account." /></Card>

  function exportSummary() {
    const csv = toCSV(view!.trend.map((p) => ({ Month: monthLabel(p.key, 'long'), Income: p.income, Spent: p.spent, Saved: p.saved, 'Savings rate %': p.income > 0 ? ((p.saved / p.income) * 100).toFixed(1) : '' })))
    saveFile(`kinfold-summary-${view!.trend[0].key}-to-${month}.csv`, csv)
  }

  return (
    <div>
      <PageHeader title="Reports" subtitle="Household trends, categories and who paid what."
        actions={<>
          <MonthPicker value={month} onChange={setMonth} />
          <Button variant="secondary" icon={<Download size={16} />} onClick={exportSummary}>CSV</Button>
          <Button variant="secondary" icon={<Printer size={16} />} onClick={() => window.print()}>Print / PDF</Button>
        </>} />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={`Income · ${span} months`} value={formatCompact(view.totals.income, currency)} />
        <Stat label={`Spent · ${span} months`} value={formatCompact(view.totals.spent, currency)} />
        <Stat label="Saved" value={formatCompact(view.totals.saved, currency)} tone={view.totals.saved >= 0 ? 'positive' : 'negative'} hint={`${view.totals.savingsRate.toFixed(0)}% savings rate`} />
        <Stat label="Average monthly spend" value={formatMoney(view.avgSpend, currency)} />
      </div>

      <Card className="mb-5">
        <CardHeader title="Income, spending & savings" action={<Segmented value={span} onChange={setSpan} options={[{ value: '6', label: '6 mo' }, { value: '12', label: '12 mo' }]} />} />
        <div className="h-72 px-2 pb-4">
          <ResponsiveContainer>
            <AreaChart data={view.trend} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="spent" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} /><stop offset="100%" stopColor="var(--primary)" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickFormatter={(v) => formatCompact(v, currency)} tickLine={false} axisLine={false} fontSize={12} width={60} />
              <Tooltip formatter={(v, n) => [formatMoney(Number(v), currency), String(n)]} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Area name="Income" dataKey="income" stroke="var(--saffron)" fill="none" strokeWidth={2.5} type="monotone" />
              <Area name="Spent" dataKey="spent" stroke="var(--primary)" fill="url(#spent)" strokeWidth={2.5} type="monotone" />
              <Area name="Saved" dataKey="saved" stroke="var(--positive)" fill="none" strokeWidth={2} strokeDasharray="5 4" type="monotone" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="overflow-x-auto lg:col-span-3">
          <CardHeader title={`Categories · ${monthLabel(month, 'long')}`} subtitle="Shared spending compared with the month before" />
          {view.rows.length ? (
            <table className="table min-w-[480px]">
              <thead><tr><th>Category</th><th className="text-right">Amount</th><th className="text-right">Share</th><th className="text-right">vs last month</th></tr></thead>
              <tbody>
                {view.rows.map((r) => {
                  const change = r.prev > 0 ? ((r.amount - r.prev) / r.prev) * 100 : null
                  return (
                    <tr key={r.category}>
                      <td><span className="inline-flex items-center gap-2"><CategoryIcon cat={r.category} size={26} />{r.label}<span className="text-[12px] text-ink-3">×{r.count}</span></span></td>
                      <td className="text-right tabular-nums font-semibold">{formatMoney(r.amount, currency)}</td>
                      <td className="text-right tabular-nums text-ink-2">{r.share.toFixed(1)}%</td>
                      <td className={`text-right tabular-nums ${change === null ? 'text-ink-3' : change > 0 ? 'text-negative' : 'text-positive'}`}>{change === null ? 'new' : `${change > 0 ? '+' : ''}${change.toFixed(0)}%`}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : <EmptyState title="No shared spending this month" />}
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Who paid" subtitle="Paid = money spent on shared costs. Share = their fair portion after splits." />
          <ul className="space-y-3 px-5 pb-5">
            {view.members.map((m) => {
              const max = Math.max(...view.members.map((x) => Math.max(x.paid, x.share)), 1)
              return (
                <li key={m.userId}>
                  <div className="mb-1 flex justify-between text-[13px]"><span className="font-medium">{m.name}{m.userId === userId && ' (you)'}</span><span className="tabular-nums">{formatMoney(m.paid, currency)}</span></div>
                  <div className="h-2 rounded-full bg-surface-3"><div className="h-2 rounded-full bg-primary" style={{ width: `${(m.paid / max) * 100}%` }} /></div>
                  <div className="mt-1 text-[12px] text-ink-3">Share {formatMoney(m.share, currency)}</div>
                </li>
              )
            })}
          </ul>
        </Card>
      </div>
    </div>
  )
}
