'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, Plane, Plus, Trash2 } from 'lucide-react'
import { Badge, Button, Card, EmptyState, Field, IconButton, Modal, PageHeader, Progress, confirmAction, cx } from '@/components/ui'
import { useHousehold } from '@/store/ledger'
import { CURRENCIES } from '@/lib/categories'
import { daysBetween, formatDate, formatMoney, fromMinor, parseMoney, toMinor, today } from '@/lib/money'
import { tripSpent } from '@/lib/finance'
import type { Trip } from '@/lib/model'

export default function TripsPage() {
  const { data, currency, firstName, mutate } = useHousehold()
  const [creating, setCreating] = useState(false)
  const [adding, setAdding] = useState<Trip | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const t = today()

  const trips = useMemo(() => {
    if (!data) return []
    return data.trips.map((trip) => {
      const expenses = data.tripExpenses.filter((e) => e.trip_id === trip.id).sort((a, b) => b.expense_date.localeCompare(a.expense_date))
      const spent = tripSpent(trip, data.tripExpenses)
      const days = daysBetween(trip.start_date, trip.end_date) + 1
      const status = t < trip.start_date ? 'upcoming' : t > trip.end_date ? 'past' : 'ongoing'
      const byPerson = new Map<string, number>()
      for (const e of expenses) byPerson.set(e.paid_by, (byPerson.get(e.paid_by) ?? 0) + toMinor(e.amount) * (e.currency_code === trip.base_currency ? 1 : e.exchange_rate))
      return { trip, expenses, spent, days, status, perDay: spent / days, byPerson: [...byPerson].map(([id, m]) => [id, fromMinor(Math.round(m))] as const) }
    }).sort((a, b) => ({ ongoing: 0, upcoming: 1, past: 2 }[a.status]! - { ongoing: 0, upcoming: 1, past: 2 }[b.status]!) || a.trip.start_date.localeCompare(b.trip.start_date))
  }, [data, t])

  if (!data) return null

  return (
    <div>
      <PageHeader title="Trips" subtitle="Plan a trip budget and track spending in any currency." actions={<Button icon={<Plus size={16} />} onClick={() => setCreating(true)}>Plan a trip</Button>} />

      {trips.length ? (
        <div className="space-y-4">
          {trips.map(({ trip, expenses, spent, days, status, perDay, byPerson }) => {
            const pct = (spent / trip.budget) * 100
            const open = openId === trip.id
            return (
              <Card key={trip.id} className="overflow-hidden">
                <div className="flex flex-wrap items-start gap-4 p-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-primary-soft text-primary"><Plane size={20} /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-lg font-bold">{trip.destination}</h2>
                      <Badge tone={status === 'ongoing' ? 'positive' : status === 'upcoming' ? 'primary' : 'neutral'}>{status}</Badge>
                      {pct > 100 && <Badge tone="negative">Over budget</Badge>}
                    </div>
                    <p className="text-[13px] text-ink-3">{formatDate(trip.start_date, 'long')} – {formatDate(trip.end_date, 'long')} · {days} day{days > 1 ? 's' : ''}{status === 'upcoming' && ` · starts in ${daysBetween(t, trip.start_date)} days`}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-xl font-bold">{formatMoney(spent, trip.base_currency)}</div>
                    <div className="text-[12.5px] text-ink-3">of {formatMoney(trip.budget, trip.base_currency)}</div>
                  </div>
                </div>
                <div className="px-5"><Progress value={pct} tone={pct > 100 ? 'negative' : pct > 85 ? 'warning' : 'primary'} /></div>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 px-5 pt-3 text-[12.5px] text-ink-3">
                  <span>{spent <= trip.budget ? `${formatMoney(trip.budget - spent, trip.base_currency)} left` : `${formatMoney(spent - trip.budget, trip.base_currency)} over`}</span>
                  <span>{status === 'upcoming' ? `Budget ≈ ${formatMoney(trip.budget / days, trip.base_currency)} per day` : `Spent ≈ ${formatMoney(perDay, trip.base_currency)} per day`}</span>
                  {byPerson.map(([id, amt]) => <span key={id}>{firstName(id)} paid {formatMoney(amt, trip.base_currency)}</span>)}
                </div>
                <div className="flex flex-wrap gap-2 px-5 py-4">
                  <Button size="sm" icon={<Plus size={15} />} onClick={() => setAdding(trip)}>Add expense</Button>
                  <Button size="sm" variant="ghost" icon={<ChevronDown size={15} className={cx('transition', open && 'rotate-180')} />} onClick={() => setOpenId(open ? null : trip.id)}>{expenses.length} expenses</Button>
                  <IconButton className="ml-auto" label="Delete trip" onClick={async () => {
                    if (await confirmAction({ title: `Delete the ${trip.destination} trip?`, body: 'All its expenses are deleted too.', confirmLabel: 'Delete', danger: true })) mutate((b) => b.remove('trips', trip.id), 'Trip deleted')
                  }}><Trash2 size={16} /></IconButton>
                </div>
                {open && (
                  <ul className="divide-y divide-line border-t border-line">
                    {expenses.map((e) => (
                      <li key={e.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                        <span className="min-w-0 flex-1 truncate">{e.description} <span className="text-ink-3">· {firstName(e.paid_by)} · {formatDate(e.expense_date)}</span></span>
                        <span className="text-right tabular-nums">
                          {formatMoney(e.amount, e.currency_code, { decimals: e.currency_code !== trip.base_currency })}
                          {e.currency_code !== trip.base_currency && <span className="block text-[11.5px] text-ink-3">≈ {formatMoney(e.amount * e.exchange_rate, trip.base_currency)} @ {e.exchange_rate}</span>}
                        </span>
                        <IconButton label="Delete expense" className="h-7 w-7" onClick={() => mutate((b) => b.remove('tripExpenses', e.id))}><Trash2 size={14} /></IconButton>
                      </li>
                    ))}
                    {!expenses.length && <li className="px-5 py-4 text-sm text-ink-3">No expenses yet.</li>}
                  </ul>
                )}
              </Card>
            )
          })}
        </div>
      ) : (
        <Card><EmptyState icon={<Plane size={20} />} title="No trips planned" body="Set a budget for your next holiday and log spending as you go — in any currency." action={<Button onClick={() => setCreating(true)}>Plan a trip</Button>} /></Card>
      )}

      <TripForm open={creating} onClose={() => setCreating(false)} defaultCurrency={currency} />
      <TripExpenseForm trip={adding} onClose={() => setAdding(null)} />
    </div>
  )
}

function TripForm({ open, onClose, defaultCurrency }: { open: boolean; onClose: () => void; defaultCurrency: string }) {
  const { mutate } = useHousehold()
  const [form, setForm] = useState({ destination: '', start: '', end: '', budget: '', currency: defaultCurrency })
  const [error, setError] = useState<string | null>(null)

  async function save() {
    const budget = parseMoney(form.budget)
    if (!form.destination.trim()) return setError('Where are you going?')
    if (!form.start || !form.end) return setError('Pick the travel dates.')
    if (form.end < form.start) return setError('The trip must end after it starts.')
    if (!Number.isFinite(budget) || budget <= 0) return setError('Enter a budget above zero.')
    const ok = await mutate((b) => b.insert('trips', { destination: form.destination.trim(), start_date: form.start, end_date: form.end, budget, base_currency: form.currency }), 'Trip planned')
    if (ok) { setForm({ destination: '', start: '', end: '', budget: '', currency: defaultCurrency }); setError(null); onClose() }
  }

  return (
    <Modal open={open} onClose={onClose} title="Plan a trip" footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save}>Create trip</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Destination" className="sm:col-span-2"><input className="field" maxLength={80} value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} /></Field>
        <Field label="From"><input className="field" type="date" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} /></Field>
        <Field label="To"><input className="field" type="date" min={form.start} value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} /></Field>
        <Field label="Budget"><input className="field" inputMode="decimal" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} /></Field>
        <Field label="Budget currency" hint="Foreign expenses are converted into this.">
          <select className="field" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select>
        </Field>
      </div>
      {error && <p className="mt-3 rounded-[10px] bg-negative-soft px-3 py-2 text-sm text-negative">{error}</p>}
    </Modal>
  )
}

function TripExpenseForm({ trip, onClose }: { trip: Trip | null; onClose: () => void }) {
  const { members, userId, mutate } = useHousehold()
  const [form, setForm] = useState({ description: '', amount: '', currency: '', rate: '1', paidBy: '', date: today() })
  const [error, setError] = useState<string | null>(null)
  const [key, setKey] = useState<string | null>(null)
  if ((trip?.id ?? null) !== key) { setKey(trip?.id ?? null); setForm({ description: '', amount: '', currency: trip?.base_currency ?? 'INR', rate: '1', paidBy: userId, date: today() }); setError(null) }
  if (!trip) return null
  const foreign = form.currency !== trip.base_currency

  async function save() {
    if (!trip) return
    const amount = parseMoney(form.amount)
    const rate = foreign ? Number(form.rate) : 1
    if (!form.description.trim()) return setError('What was it for?')
    if (!Number.isFinite(amount) || amount <= 0) return setError('Enter an amount above zero.')
    if (!(rate > 0)) return setError('Enter the exchange rate.')
    const ok = await mutate((b) => b.insert('tripExpenses', { trip_id: trip.id, description: form.description.trim(), amount, currency_code: form.currency, exchange_rate: rate, paid_by: form.paidBy || userId, expense_date: form.date }), 'Trip expense added')
    if (ok) onClose()
  }

  return (
    <Modal open onClose={onClose} title={`Add expense · ${trip.destination}`} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save}>Add</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Description" className="sm:col-span-2"><input className="field" maxLength={120} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        <Field label="Amount"><input className="field" inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Field>
        <Field label="Currency">
          <select className="field" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select>
        </Field>
        {foreign && (
          <Field label={`1 ${form.currency} = ? ${trip.base_currency}`} hint="Use the rate on your card statement or forex receipt." className="sm:col-span-2">
            <input className="field" inputMode="decimal" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} />
          </Field>
        )}
        <Field label="Paid by">
          <select className="field" value={form.paidBy} onChange={(e) => setForm({ ...form, paidBy: e.target.value })}>{members.map((m) => <option key={m.user_id} value={m.user_id}>{m.full_name}</option>)}</select>
        </Field>
        <Field label="Date"><input className="field" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
      </div>
      {error && <p className="mt-3 rounded-[10px] bg-negative-soft px-3 py-2 text-sm text-negative">{error}</p>}
    </Modal>
  )
}
