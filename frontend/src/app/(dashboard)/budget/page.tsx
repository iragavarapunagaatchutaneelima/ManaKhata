'use client'

import { useMemo, useState } from 'react'
import { PiggyBank, Plus, Sparkles, Trash2 } from 'lucide-react'
import { Badge, Button, Card, CardHeader, EmptyState, Field, IconButton, Modal, PageHeader, Progress, Segmented, Stat, confirmAction } from '@/components/ui'
import { CategoryIcon } from '@/components/CategoryIcon'
import { MonthPicker } from '@/components/MonthPicker'
import { useHousehold } from '@/store/ledger'
import { CATEGORIES, category } from '@/lib/categories'
import { addMonths, formatMoney, monthKey, parseMoney, sumMoney, today } from '@/lib/money'
import { budgetProgress, householdSpend, inMonth } from '@/lib/finance'
import type { Budget } from '@/lib/model'

export default function BudgetsPage() {
  const { data, currency, userId, isManager, memberName, mutate } = useHousehold()
  const [month, setMonth] = useState(monthKey(new Date()))
  const [editing, setEditing] = useState<Budget | 'new' | null>(null)

  const view = useMemo(() => {
    if (!data) return null
    const t = today()
    const mine = data.budgets.filter((b) => !b.user_id || b.user_id === userId)
    const progress = mine.map((b) => budgetProgress(b, data.expenses, month, t)).sort((a, b) => b.percent - a.percent)
    const household = progress.filter((p) => !p.budget.user_id)
    const budgetedCats = new Set(household.map((p) => p.budget.category))
    const unbudgeted = sumMoney(data.expenses.filter((e) => e.visibility === 'HOUSEHOLD' && inMonth(e.expense_date, month) && !budgetedCats.has(e.category)), (e) => e.amount)
    // Suggest limits from the last 3 complete months for categories without a budget.
    const current = monthKey(t)
    const months = [1, 2, 3].map((i) => addMonths(current, -i))
    const suggestions = CATEGORIES
      .filter((c) => !budgetedCats.has(c.key))
      .map((c) => {
        const avg = months.reduce((s, k) => s + sumMoney(data.expenses.filter((e) => e.visibility === 'HOUSEHOLD' && e.category === c.key && inMonth(e.expense_date, k)), (e) => e.amount), 0) / 3
        return { category: c.key, avg, limit: Math.ceil((avg * 1.05) / 500) * 500 }
      })
      .filter((s) => s.avg >= 500)
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 4)
    return {
      progress,
      totalLimit: sumMoney(household, (p) => p.budget.monthly_limit),
      totalSpent: sumMoney(household, (p) => p.spent),
      unbudgeted,
      overall: householdSpend(data.expenses, month),
      suggestions,
    }
  }, [data, month, userId])

  if (!view) return null

  return (
    <div>
      <PageHeader title="Budgets" subtitle="Monthly limits per category. ManaKhata warns you when you cross your alert level."
        actions={<><MonthPicker value={month} onChange={setMonth} /><Button icon={<Plus size={16} />} onClick={() => setEditing('new')}>New budget</Button></>} />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Household budgets" value={formatMoney(view.totalLimit, currency)} hint={`${view.progress.filter((p) => !p.budget.user_id).length} categories`} />
        <Stat label="Spent against them" value={formatMoney(view.totalSpent, currency)} tone={view.totalSpent > view.totalLimit ? 'negative' : undefined}
          hint={view.totalLimit > 0 ? `${((view.totalSpent / view.totalLimit) * 100).toFixed(0)}% used` : undefined} />
        <Stat label="Left to spend" value={formatMoney(Math.max(0, view.totalLimit - view.totalSpent), currency)} tone="positive" />
        <Stat label="Outside budgets" value={formatMoney(view.unbudgeted, currency)} hint={`of ${formatMoney(view.overall, currency)} total spending`} />
      </div>

      {view.suggestions.length > 0 && month === monthKey(new Date()) && (
        <Card className="mb-5" fold>
          <CardHeader title={<span className="inline-flex items-center gap-2"><Sparkles size={16} className="text-saffron" /> Suggested budgets</span>}
            subtitle="Based on your average over the last 3 months, plus 5% headroom." />
          <div className="grid gap-2 px-5 pb-5 sm:grid-cols-2 lg:grid-cols-4">
            {view.suggestions.map((s) => (
              <div key={s.category} className="flex items-center gap-3 rounded-[12px] border border-line p-3">
                <CategoryIcon cat={s.category} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{category(s.category).label}</div>
                  <div className="text-[12px] text-ink-3">avg {formatMoney(s.avg, currency)}</div>
                </div>
                <Button size="sm" variant="secondary" disabled={!isManager} title={isManager ? undefined : 'Only the household head or a parent can add household budgets'}
                  onClick={() => mutate((b) => b.insert('budgets', { category: s.category, monthly_limit: s.limit, alert_at_percent: 80, user_id: null }), 'Budget added')}>
                  {formatMoney(s.limit, currency)}
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {view.progress.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {view.progress.map((p) => (
            <Card key={p.budget.id} className="p-4">
              <div className="flex items-start gap-3">
                <CategoryIcon cat={p.budget.category} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-ink">{category(p.budget.category).label}</span>
                    <Badge tone={p.budget.user_id ? 'primary' : 'neutral'}>{p.budget.user_id ? `Personal · ${memberName(p.budget.user_id).split(' ')[0]}` : 'Household'}</Badge>
                    {p.status === 'over' && <Badge tone="negative">Over budget</Badge>}
                    {p.status === 'warn' && <Badge tone="warning">Near limit</Badge>}
                  </div>
                  <div className="mt-1 text-[13px] text-ink-3">
                    <span className="font-semibold text-ink">{formatMoney(p.spent, currency)}</span> of {formatMoney(p.budget.monthly_limit, currency)}
                  </div>
                </div>
                <div className="flex">
                  <IconButton label="Edit budget" onClick={() => setEditing(p.budget)}><PiggyBank size={16} /></IconButton>
                  <IconButton label="Delete budget" onClick={async () => {
                    if (await confirmAction({ title: 'Delete this budget?', body: 'Your expenses stay; only the limit is removed.', confirmLabel: 'Delete', danger: true }))
                      mutate((b) => b.remove('budgets', p.budget.id), 'Budget deleted')
                  }}><Trash2 size={16} /></IconButton>
                </div>
              </div>
              <Progress className="mt-3" value={p.percent} tone={p.status === 'over' ? 'negative' : p.status === 'warn' ? 'warning' : 'positive'} />
              <div className="mt-2 flex justify-between text-[12.5px] text-ink-3">
                <span>{p.remaining >= 0 ? `${formatMoney(p.remaining, currency)} left` : `${formatMoney(-p.remaining, currency)} over`}</span>
                {p.projected !== null && <span className={p.projected > p.budget.monthly_limit ? 'font-semibold text-warning' : ''}>On pace for {formatMoney(p.projected, currency)}</span>}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card><EmptyState icon={<PiggyBank size={20} />} title="No budgets yet" body="Budgets keep spending honest. Start with groceries and dining out." action={<Button onClick={() => setEditing('new')}>Create a budget</Button>} /></Card>
      )}

      <BudgetForm budget={editing} onClose={() => setEditing(null)} />
    </div>
  )
}

function BudgetForm({ budget, onClose }: { budget: Budget | 'new' | null; onClose: () => void }) {
  const { data, userId, isManager, currency, mutate } = useHousehold()
  const editing = budget && budget !== 'new' ? budget : null
  const [cat, setCat] = useState('GROCERIES')
  const [scope, setScope] = useState<'household' | 'me'>('household')
  const [limit, setLimit] = useState('')
  const [alert, setAlert] = useState('80')
  const [error, setError] = useState<string | null>(null)
  const [key, setKey] = useState<string | null>(null)

  const formKey = budget === null ? null : editing?.id ?? 'new'
  if (formKey !== key) {
    setKey(formKey)
    setCat(editing?.category ?? 'GROCERIES')
    setScope(editing ? (editing.user_id ? 'me' : 'household') : isManager ? 'household' : 'me')
    setLimit(editing ? String(editing.monthly_limit) : '')
    setAlert(String(editing?.alert_at_percent ?? 80))
    setError(null)
  }

  async function save() {
    const value = parseMoney(limit)
    const pct = Number(alert)
    if (!Number.isFinite(value) || value <= 0) return setError('Enter a monthly limit above zero.')
    if (!(pct >= 1 && pct <= 100)) return setError('Alert level must be between 1 and 100%.')
    const user_id = scope === 'me' ? userId : null
    if (!editing && data?.budgets.some((b) => b.category === cat && (b.user_id ?? null) === user_id)) return setError('You already have this budget. Edit it instead.')
    const ok = await mutate((b) => editing
      ? b.update('budgets', editing.id, { monthly_limit: value, alert_at_percent: pct })
      : b.insert('budgets', { category: cat, monthly_limit: value, alert_at_percent: pct, user_id }), editing ? 'Budget updated' : 'Budget created')
    if (ok) onClose()
  }

  return (
    <Modal open={budget !== null} onClose={onClose} title={editing ? 'Edit budget' : 'New budget'}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save}>{editing ? 'Save' : 'Create budget'}</Button></>}>
      <div className="space-y-4">
        <Field label="Category">
          <select className="field" value={cat} disabled={!!editing} onChange={(e) => setCat(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </Field>
        {!editing && (
          <Field label="Applies to" hint={scope === 'household' ? 'Counts every shared expense in this category.' : 'Counts only what you pay in this category, including private entries.'}>
            <Segmented value={scope} onChange={setScope} options={[
              ...(isManager ? [{ value: 'household' as const, label: 'Whole household' }] : []),
              { value: 'me' as const, label: 'Just me' },
            ]} />
          </Field>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label={`Monthly limit (${currency})`}><input className="field" inputMode="decimal" value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="10000" /></Field>
          <Field label="Warn me at (%)"><input className="field" inputMode="numeric" value={alert} onChange={(e) => setAlert(e.target.value)} /></Field>
        </div>
        {error && <p className="rounded-[10px] bg-negative-soft px-3 py-2 text-sm text-negative">{error}</p>}
      </div>
    </Modal>
  )
}
