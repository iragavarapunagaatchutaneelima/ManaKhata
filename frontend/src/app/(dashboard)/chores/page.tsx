'use client'

import { useMemo, useState } from 'react'
import { CheckCircle2, ClipboardCheck, Plus, RotateCcw, ThumbsDown, ThumbsUp, Trash2 } from 'lucide-react'
import { Avatar, Badge, Button, Card, EmptyState, Field, IconButton, Modal, PageHeader, confirmAction, cx } from '@/components/ui'
import { useHousehold } from '@/store/ledger'
import { daysBetween, formatDate, formatMoney, parseMoney, sumMoney, today } from '@/lib/money'
import type { Chore } from '@/lib/model'

const COLUMNS = [
  { key: 'todo', title: 'To do', match: (c: Chore) => c.status === 'PENDING' || c.status === 'REJECTED' },
  { key: 'review', title: 'Waiting for review', match: (c: Chore) => c.status === 'COMPLETED' },
  { key: 'done', title: 'Done & paid', match: (c: Chore) => c.status === 'APPROVED' },
]

export default function ChoresPage() {
  const { data, userId, isManager, currency, memberName, firstName, mutate } = useHousehold()
  const [open, setOpen] = useState(false)
  const t = today()

  const view = useMemo(() => {
    if (!data) return null
    const chores = [...data.chores].sort((a, b) => (a.due_date ?? '9').localeCompare(b.due_date ?? '9'))
    const month = t.slice(0, 7)
    const earned = sumMoney(data.chores.filter((c) => c.status === 'APPROVED' && c.assigned_to === userId && (c.decided_at ?? '').startsWith(month)), (c) => c.reward_amount)
    return { chores, earned }
  }, [data, t, userId])

  if (!view) return null

  return (
    <div>
      <PageHeader title="Chores" subtitle={isManager ? 'Assign chores with a reward. Approving one pays the reward from your wallet.' : `You’ve earned ${formatMoney(view.earned, currency)} from chores this month.`}
        actions={isManager && <Button icon={<Plus size={16} />} onClick={() => setOpen(true)}>New chore</Button>} />

      {view.chores.length ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {COLUMNS.map((col) => {
            const items = view.chores.filter(col.match)
            return (
              <div key={col.key}>
                <div className="mb-2 flex items-center gap-2 px-1 text-[13px] font-bold uppercase tracking-wide text-ink-3">{col.title}<Badge>{items.length}</Badge></div>
                <div className="space-y-2.5">
                  {items.map((c) => {
                    const overdue = c.due_date && c.status === 'PENDING' && daysBetween(t, c.due_date) < 0
                    return (
                      <Card key={c.id} className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar name={memberName(c.assigned_to)} size={32} />
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-ink">{c.title}</div>
                            {c.description && <p className="mt-0.5 text-[13px] text-ink-2">{c.description}</p>}
                            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[12px] text-ink-3">
                              <span>{firstName(c.assigned_to)}</span>
                              {c.due_date && <span className={cx(overdue && 'font-semibold text-negative')}>· due {formatDate(c.due_date)}</span>}
                              {c.status === 'REJECTED' && <Badge tone="negative">Try again</Badge>}
                            </div>
                          </div>
                          <Badge tone="saffron">{formatMoney(c.reward_amount, currency)}</Badge>
                        </div>
                        <div className="mt-3 flex flex-wrap justify-end gap-1.5">
                          {(c.status === 'PENDING' || c.status === 'REJECTED') && (c.assigned_to === userId || isManager) && (
                            <Button size="sm" icon={<CheckCircle2 size={15} />} onClick={() => mutate((b) => b.setChoreStatus(c.id, 'COMPLETED'), 'Marked as done — waiting for review')}>Mark done</Button>
                          )}
                          {c.status === 'COMPLETED' && isManager && <>
                            <Button size="sm" variant="secondary" icon={<ThumbsDown size={15} />} onClick={() => mutate((b) => b.setChoreStatus(c.id, 'REJECTED'), 'Sent back')}>Not yet</Button>
                            <Button size="sm" icon={<ThumbsUp size={15} />} onClick={() => mutate((b) => b.setChoreStatus(c.id, 'APPROVED'), `Approved — ${formatMoney(c.reward_amount, currency)} paid to ${firstName(c.assigned_to)}`)}>Approve & pay</Button>
                          </>}
                          {c.status === 'COMPLETED' && !isManager && <span className="text-[12.5px] text-ink-3">A parent will review this soon.</span>}
                          {isManager && c.status !== 'APPROVED' && c.status !== 'COMPLETED' && (
                            <IconButton label="Delete chore" onClick={async () => {
                              if (await confirmAction({ title: `Delete “${c.title}”?`, confirmLabel: 'Delete', danger: true })) mutate((b) => b.remove('chores', c.id), 'Chore deleted')
                            }}><Trash2 size={15} /></IconButton>
                          )}
                          {isManager && c.status === 'REJECTED' && (
                            <IconButton label="Reset to to-do" onClick={() => mutate((b) => b.setChoreStatus(c.id, 'PENDING'))}><RotateCcw size={15} /></IconButton>
                          )}
                        </div>
                      </Card>
                    )
                  })}
                  {!items.length && <div className="rounded-[14px] border border-dashed border-line px-4 py-6 text-center text-[13px] text-ink-3">Nothing here</div>}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <Card><EmptyState icon={<ClipboardCheck size={20} />} title="No chores yet" body={isManager ? 'Create chores with small rewards to build good habits.' : 'Chores assigned to you will appear here.'}
          action={isManager && <Button onClick={() => setOpen(true)}>Create a chore</Button>} /></Card>
      )}

      <ChoreForm open={open} onClose={() => setOpen(false)} />
    </div>
  )
}

function ChoreForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { members, userId, currency, mutate } = useHousehold()
  const candidates = members.filter((m) => m.user_id !== userId)
  const [form, setForm] = useState({ title: '', description: '', reward: '', assignee: '', due: '' })
  const [error, setError] = useState<string | null>(null)

  async function save() {
    const reward = form.reward ? parseMoney(form.reward) : 0
    const assigned_to = form.assignee || candidates[0]?.user_id || userId
    if (!form.title.trim()) return setError('What needs doing?')
    if (!Number.isFinite(reward) || reward < 0) return setError('Reward must be zero or more.')
    const ok = await mutate((b) => b.insert('chores', { title: form.title.trim(), description: form.description.trim() || null, reward_amount: reward, assigned_to, due_date: form.due || null }), 'Chore created')
    if (ok) { setForm({ title: '', description: '', reward: '', assignee: '', due: '' }); setError(null); onClose() }
  }

  return (
    <Modal open={open} onClose={onClose} title="New chore"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save}>Create</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Chore" className="sm:col-span-2"><input className="field" maxLength={80} placeholder="e.g. Water the plants" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
        <Field label="Details (optional)" className="sm:col-span-2"><input className="field" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        <Field label="Assign to">
          <select className="field" value={form.assignee || candidates[0]?.user_id || userId} onChange={(e) => setForm({ ...form, assignee: e.target.value })}>
            {(candidates.length ? candidates : members).map((m) => <option key={m.user_id} value={m.user_id}>{m.full_name}</option>)}
          </select>
        </Field>
        <Field label={`Reward (${currency})`}><input className="field" inputMode="decimal" placeholder="0" value={form.reward} onChange={(e) => setForm({ ...form, reward: e.target.value })} /></Field>
        <Field label="Due date (optional)"><input className="field" type="date" min={today()} value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} /></Field>
      </div>
      {error && <p className="mt-3 rounded-[10px] bg-negative-soft px-3 py-2 text-sm text-negative">{error}</p>}
    </Modal>
  )
}
