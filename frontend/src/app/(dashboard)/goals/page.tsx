'use client'

import { useMemo, useState } from 'react'
import { Goal as GoalIcon, Pencil, Plus, Trash2, Trophy } from 'lucide-react'
import { Avatar, Badge, Button, Card, EmptyState, Field, IconButton, Modal, PageHeader, Progress, Stat, confirmAction } from '@/components/ui'
import { useHousehold } from '@/store/ledger'
import { formatDate, formatMoney, parseMoney, sumMoney, today } from '@/lib/money'
import { goalProgress } from '@/lib/finance'
import type { Goal } from '@/lib/model'

export default function GoalsPage() {
  const { data, currency, firstName, mutate } = useHousehold()
  const [editing, setEditing] = useState<Goal | 'new' | null>(null)
  const [contributing, setContributing] = useState<Goal | null>(null)
  const t = today()

  const view = useMemo(() => {
    if (!data) return null
    const goals = data.goals.map((g) => {
      const p = goalProgress(g, data.contributions, t)
      const byPerson = new Map<string, number>()
      for (const c of data.contributions.filter((c) => c.goal_id === g.id)) byPerson.set(c.user_id, (byPerson.get(c.user_id) ?? 0) + c.amount)
      return { ...p, byPerson: [...byPerson].sort((a, b) => b[1] - a[1]) }
    }).sort((a, b) => Number(a.done) - Number(b.done) || (a.goal.target_date ?? '9').localeCompare(b.goal.target_date ?? '9'))
    return {
      goals,
      saved: sumMoney(goals, (g) => g.saved),
      target: sumMoney(goals, (g) => g.goal.target_amount),
      monthly: sumMoney(goals.filter((g) => !g.done), (g) => g.requiredMonthly ?? 0),
    }
  }, [data, t])

  if (!view) return null

  return (
    <div>
      <PageHeader title="Savings goals" subtitle="Save together for the things that matter. Kinfold tells you how much to set aside each month."
        actions={<Button icon={<Plus size={16} />} onClick={() => setEditing('new')}>New goal</Button>} />

      <div className="mb-5 grid grid-cols-3 gap-3">
        <Stat label="Saved so far" value={formatMoney(view.saved, currency)} tone="positive" />
        <Stat label="Across all goals" value={formatMoney(view.target, currency)} hint={view.target ? `${((view.saved / view.target) * 100).toFixed(0)}% of the way` : undefined} />
        <Stat label="Needed each month" value={formatMoney(view.monthly, currency)} tone="primary" hint="To hit every target date" />
      </div>

      {view.goals.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {view.goals.map((g) => (
            <Card key={g.goal.id} className="p-5" fold={g.done}>
              <div className="flex items-start gap-3">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] ${g.done ? 'bg-saffron-soft text-saffron-ink' : 'bg-primary-soft text-primary'}`}>
                  {g.done ? <Trophy size={20} /> : <GoalIcon size={20} />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-ink">{g.goal.name}</span>
                    {g.done && <Badge tone="positive">Reached</Badge>}
                    {!g.done && g.monthsLeft === 0 && g.goal.target_date && <Badge tone="warning">Target date passed</Badge>}
                  </div>
                  {g.goal.description && <p className="text-[13px] text-ink-3">{g.goal.description}</p>}
                </div>
                <IconButton label="Edit goal" onClick={() => setEditing(g.goal)}><Pencil size={15} /></IconButton>
                <IconButton label="Delete goal" onClick={async () => {
                  if (await confirmAction({ title: `Delete “${g.goal.name}”?`, body: 'Its contribution history is deleted too.', confirmLabel: 'Delete', danger: true })) mutate((b) => b.remove('goals', g.goal.id), 'Goal deleted')
                }}><Trash2 size={15} /></IconButton>
              </div>

              <div className="mt-4 flex items-end justify-between">
                <div><span className="font-display text-2xl font-bold">{formatMoney(g.saved, currency)}</span><span className="text-sm text-ink-3"> of {formatMoney(g.goal.target_amount, currency)}</span></div>
                <span className="text-sm font-semibold text-primary">{g.percent.toFixed(0)}%</span>
              </div>
              <Progress className="mt-2" value={g.percent} tone={g.done ? 'saffron' : 'primary'} />

              <div className="mt-3 grid grid-cols-2 gap-2 text-[12.5px]">
                <div className="rounded-[10px] bg-surface-2 px-3 py-2"><div className="text-ink-3">Target date</div><div className="font-semibold">{g.goal.target_date ? formatDate(g.goal.target_date, 'long') : 'Not set'}</div></div>
                <div className="rounded-[10px] bg-surface-2 px-3 py-2"><div className="text-ink-3">Save each month</div><div className="font-semibold">{g.done ? '—' : g.requiredMonthly !== null ? formatMoney(g.requiredMonthly, currency) : 'Set a date'}</div></div>
              </div>

              {g.byPerson.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-ink-3">
                  {g.byPerson.map(([uid, amt]) => <span key={uid} className="inline-flex items-center gap-1"><Avatar name={firstName(uid)} size={18} />{firstName(uid)} {formatMoney(amt, currency)}</span>)}
                </div>
              )}

              {!g.done && <Button className="mt-4 w-full" variant="secondary" icon={<Plus size={16} />} onClick={() => setContributing(g.goal)}>Add money</Button>}
            </Card>
          ))}
        </div>
      ) : (
        <Card><EmptyState icon={<GoalIcon size={20} />} title="No goals yet" body="An emergency fund, a family holiday, a new laptop — give it a target and a date." action={<Button onClick={() => setEditing('new')}>Create a goal</Button>} /></Card>
      )}

      <GoalForm goal={editing} onClose={() => setEditing(null)} />
      <ContributionForm goal={contributing} onClose={() => setContributing(null)} />
    </div>
  )
}

function GoalForm({ goal, onClose }: { goal: Goal | 'new' | null; onClose: () => void }) {
  const { currency, mutate } = useHousehold()
  const editing = goal && goal !== 'new' ? goal : null
  const [form, setForm] = useState({ name: '', description: '', target: '', date: '' })
  const [error, setError] = useState<string | null>(null)
  const [key, setKey] = useState<string | null>(null)
  const formKey = goal === null ? null : editing?.id ?? 'new'
  if (formKey !== key) {
    setKey(formKey)
    setForm(editing ? { name: editing.name, description: editing.description ?? '', target: String(editing.target_amount), date: editing.target_date ?? '' } : { name: '', description: '', target: '', date: '' })
    setError(null)
  }

  async function save() {
    const target = parseMoney(form.target)
    if (!form.name.trim()) return setError('Name your goal.')
    if (!Number.isFinite(target) || target <= 0) return setError('Enter a target amount above zero.')
    const row = { name: form.name.trim(), description: form.description.trim() || null, target_amount: target, target_date: form.date || null }
    const ok = await mutate((b) => editing ? b.update('goals', editing.id, row) : b.insert('goals', row), editing ? 'Goal updated' : 'Goal created')
    if (ok) onClose()
  }

  return (
    <Modal open={goal !== null} onClose={onClose} title={editing ? 'Edit goal' : 'New savings goal'}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save}>{editing ? 'Save' : 'Create goal'}</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Goal" className="sm:col-span-2"><input className="field" maxLength={80} placeholder="e.g. Emergency fund" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Why (optional)" className="sm:col-span-2"><input className="field" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        <Field label={`Target (${currency})`}><input className="field" inputMode="decimal" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} /></Field>
        <Field label="Target date"><input className="field" type="date" min={today()} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
      </div>
      {error && <p className="mt-3 rounded-[10px] bg-negative-soft px-3 py-2 text-sm text-negative">{error}</p>}
    </Modal>
  )
}

function ContributionForm({ goal, onClose }: { goal: Goal | null; onClose: () => void }) {
  const { currency, mutate } = useHousehold()
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function save() {
    const value = parseMoney(amount)
    if (!goal) return
    if (!Number.isFinite(value) || value <= 0) return setError('Enter an amount above zero.')
    const ok = await mutate((b) => b.insert('contributions', { goal_id: goal.id, amount: value, note: note.trim() || null }), `Added to ${goal.name}`)
    if (ok) { setAmount(''); setNote(''); setError(null); onClose() }
  }

  return (
    <Modal open={!!goal} onClose={onClose} title={`Add to ${goal?.name ?? ''}`} description="Record money you have moved into savings for this goal."
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save}>Add</Button></>}>
      <div className="space-y-4">
        <Field label={`Amount (${currency})`}><input className="field" inputMode="decimal" autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
        <Field label="Note (optional)"><input className="field" value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        {error && <p className="rounded-[10px] bg-negative-soft px-3 py-2 text-sm text-negative">{error}</p>}
      </div>
    </Modal>
  )
}
