'use client'

import { useMemo } from 'react'
import { Info, Lightbulb } from 'lucide-react'
import { Badge, Card, CardHeader, EmptyState, PageHeader, Progress } from '@/components/ui'
import { useHousehold } from '@/store/ledger'
import { forecastNextMonth, healthScore, householdIncome, inMonth, insights } from '@/lib/finance'
import { addMonths, formatMoney, monthKey, monthLabel, sumMoney, today } from '@/lib/money'
import { category } from '@/lib/categories'

export default function InsightsPage() {
  const { data, currency, canSeeAnalytics } = useHousehold()
  const t = today()

  const view = useMemo(() => {
    if (!data) return null
    const last = addMonths(monthKey(t), -1)
    const shared = data.expenses.filter((e) => e.visibility === 'HOUSEHOLD' && inMonth(e.expense_date, last))
    const income = householdIncome(data.members, data.incomes, last)
    const needs = sumMoney(shared.filter((e) => category(e.category).essential), (e) => e.amount)
    const wants = sumMoney(shared.filter((e) => !category(e.category).essential), (e) => e.amount)
    return {
      health: healthScore(data, t),
      forecast: forecastNextMonth(data.expenses, t),
      tips: insights(data, t),
      last, income, needs, wants, saved: income - needs - wants,
    }
  }, [data, t])

  if (!view) return null
  if (!canSeeAnalytics) return <Card><EmptyState title="Insights are turned off for you" body="Ask the household head to enable analytics for your account." /></Card>

  const h = view.health
  const ring = 2 * Math.PI * 52
  const pct = (n: number) => (view.income > 0 ? (n / view.income) * 100 : 0)

  return (
    <div>
      <PageHeader title="Insights" subtitle="What your numbers say — calculated from your household’s own data." />

      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-2" fold>
          <h2 className="font-semibold">Financial health score</h2>
          <div className="mt-4 flex items-center gap-5">
            <svg width="128" height="128" viewBox="0 0 128 128" className="shrink-0" role="img" aria-label={`Score ${h.score} out of 100`}>
              <circle cx="64" cy="64" r="52" fill="none" stroke="var(--surface-3)" strokeWidth="12" />
              <circle cx="64" cy="64" r="52" fill="none" stroke={h.score >= 70 ? 'var(--positive)' : h.score >= 55 ? 'var(--saffron)' : 'var(--negative)'} strokeWidth="12"
                strokeLinecap="round" strokeDasharray={ring} strokeDashoffset={ring * (1 - h.score / 100)} transform="rotate(-90 64 64)" />
              <text x="64" y="62" textAnchor="middle" className="font-display" fontSize="30" fontWeight="800" fill="var(--ink)">{h.score}</text>
              <text x="64" y="84" textAnchor="middle" fontSize="12" fill="var(--ink-3)">out of 100</text>
            </svg>
            <div>
              <div className="font-display text-3xl font-extrabold">{h.grade}</div>
              <div className="font-semibold text-ink-2">{h.label}</div>
              <p className="mt-1 text-[12.5px] text-ink-3">A weighted mix of five standard money habits.</p>
            </div>
          </div>
          <ul className="mt-5 space-y-3.5">
            {h.components.map((c) => (
              <li key={c.key}>
                <div className="mb-1 flex justify-between text-[13px]"><span className="font-medium">{c.label} <span className="text-ink-3">· {c.weight}%</span></span><span className="font-semibold">{c.score}</span></div>
                <Progress value={c.score} tone={c.score >= 70 ? 'positive' : c.score >= 45 ? 'warning' : 'negative'} />
                <p className="mt-1 text-[12px] text-ink-3">{c.detail}</p>
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-5 lg:col-span-3">
          <Card>
            <CardHeader title={`50 / 30 / 20 check · ${monthLabel(view.last, 'long')}`} subtitle="A popular guideline: about 50% of income on needs, 30% on wants, 20%+ saved." />
            {view.income > 0 ? (
              <div className="px-5 pb-5">
                <div className="flex h-4 overflow-hidden rounded-full bg-surface-3">
                  <div className="bg-primary" style={{ width: `${Math.min(100, pct(view.needs))}%` }} />
                  <div className="bg-saffron" style={{ width: `${Math.min(100, pct(view.wants))}%` }} />
                  <div className="bg-positive" style={{ width: `${Math.max(0, Math.min(100, pct(view.saved)))}%` }} />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3 text-[13px]">
                  {[['Needs', view.needs, 50, 'bg-primary'], ['Wants', view.wants, 30, 'bg-saffron'], ['Saved', view.saved, 20, 'bg-positive']].map(([label, amount, target, color]) => (
                    <div key={label as string}>
                      <div className="flex items-center gap-1.5 font-semibold"><span className={`h-2.5 w-2.5 rounded-full ${color}`} />{label as string}</div>
                      <div className="text-lg font-bold">{pct(amount as number).toFixed(0)}%</div>
                      <div className="text-[12px] text-ink-3">{formatMoney(amount as number, currency)} · target {label === 'Saved' ? '≥' : '≤'}{target as number}%</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : <p className="px-5 pb-5 text-sm text-ink-3">Add monthly income in Household to see this check.</p>}
          </Card>

          <Card>
            <CardHeader title="Next month forecast" subtitle="Weighted average of the last three months (recent months count more)." />
            {view.forecast.length ? (
              <table className="table">
                <thead><tr><th>Category</th><th className="text-right">Last month</th><th className="text-right">Forecast</th></tr></thead>
                <tbody>
                  {view.forecast.slice(0, 8).map((f) => (
                    <tr key={f.category}>
                      <td>{f.label}</td>
                      <td className="text-right tabular-nums text-ink-2">{formatMoney(f.lastMonth, currency)}</td>
                      <td className="text-right tabular-nums font-semibold">
                        {formatMoney(f.predicted, currency)}
                        {Math.abs(f.changePercent) >= 5 && <span className={`ml-2 text-[12px] ${f.changePercent > 0 ? 'text-negative' : 'text-positive'}`}>{f.changePercent > 0 ? '▲' : '▼'}{Math.abs(f.changePercent).toFixed(0)}%</span>}
                      </td>
                    </tr>
                  ))}
                  <tr><td className="font-semibold">Total</td><td className="text-right tabular-nums">{formatMoney(sumMoney(view.forecast, (f) => f.lastMonth), currency)}</td><td className="text-right font-bold tabular-nums">{formatMoney(sumMoney(view.forecast, (f) => f.predicted), currency)}</td></tr>
                </tbody>
              </table>
            ) : <p className="px-5 pb-5 text-sm text-ink-3">Needs at least one full month of shared expenses.</p>}
          </Card>
        </div>
      </div>

      <Card className="mt-5">
        <CardHeader title="Tips for you" action={<Lightbulb size={16} className="text-saffron" />} />
        {view.tips.length ? (
          <ul className="grid gap-3 px-5 pb-5 md:grid-cols-2">
            {view.tips.map((tip) => (
              <li key={tip.id} className="rounded-[12px] border border-line p-3.5">
                <div className="flex items-center gap-2 text-sm font-semibold"><Badge tone={tip.tone === 'good' ? 'positive' : tip.tone === 'warn' ? 'warning' : 'primary'}>{tip.tone === 'good' ? 'Nice' : tip.tone === 'warn' ? 'Heads up' : 'FYI'}</Badge>{tip.title}</div>
                <p className="mt-1 text-[13px] text-ink-3">{tip.body}</p>
              </li>
            ))}
          </ul>
        ) : <p className="px-5 pb-5 text-sm text-ink-3">No tips right now — you’re on track.</p>}
      </Card>

      <div className="mt-4 flex gap-2 text-[12.5px] text-ink-3"><Info size={15} className="mt-0.5 shrink-0" /><p>Insights are educational and based only on what your household records in ManaKhata. They are not financial, investment or tax advice.</p></div>
    </div>
  )
}
