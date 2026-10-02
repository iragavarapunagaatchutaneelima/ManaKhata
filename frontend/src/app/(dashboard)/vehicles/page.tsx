'use client'

import { useMemo, useState } from 'react'
import { Bike, Car, ChevronDown, Fuel, Plus, Trash2, Wrench } from 'lucide-react'
import { Badge, Button, Card, EmptyState, Field, IconButton, Modal, PageHeader, confirmAction, cx } from '@/components/ui'
import { useHousehold } from '@/store/ledger'
import { formatDate, formatMoney, parseMoney, today } from '@/lib/money'
import { vehicleStats } from '@/lib/finance'
import type { Vehicle, VehicleExpenseType, VehicleType } from '@/lib/model'

const TYPES: VehicleType[] = ['CAR', 'BIKE', 'SCOOTER', 'EV', 'CYCLE', 'OTHER']
const EXPENSE_TYPES: { value: VehicleExpenseType; label: string }[] = [
  { value: 'FUEL', label: 'Fuel / charging' }, { value: 'SERVICE', label: 'Service' }, { value: 'REPAIR', label: 'Repair' },
  { value: 'INSURANCE', label: 'Insurance' }, { value: 'TYRES', label: 'Tyres' }, { value: 'PUC', label: 'PUC' },
  { value: 'PARKING_TOLL', label: 'Parking / toll' }, { value: 'WASH', label: 'Wash' }, { value: 'OTHER', label: 'Other' },
]

export default function VehiclesPage() {
  const { data, currency, firstName, mutate } = useHousehold()
  const [creating, setCreating] = useState(false)
  const [logging, setLogging] = useState<Vehicle | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  const vehicles = useMemo(() => (data?.vehicles ?? []).map((v) => {
    const expenses = (data?.vehicleExpenses ?? []).filter((e) => e.vehicle_id === v.id).sort((a, b) => b.expense_date.localeCompare(a.expense_date))
    return { v, expenses, stats: vehicleStats(expenses) }
  }), [data])

  if (!data) return null

  return (
    <div>
      <PageHeader title="Vehicles" subtitle="Fuel, service and running costs — with real mileage from your odometer readings."
        actions={<Button icon={<Plus size={16} />} onClick={() => setCreating(true)}>Add vehicle</Button>} />

      {vehicles.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {vehicles.map(({ v, expenses, stats }) => {
            const Icon = v.vehicle_type === 'CAR' || v.vehicle_type === 'EV' ? Car : Bike
            const open = openId === v.id
            return (
              <Card key={v.id} className="overflow-hidden">
                <div className="flex items-start gap-3 p-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-primary-soft text-primary"><Icon size={22} /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{v.name}</h2><Badge>{v.vehicle_type.toLowerCase()}</Badge>{v.is_shared && <Badge tone="primary">shared</Badge>}</div>
                    <p className="text-[13px] text-ink-3">{[v.make, v.model, v.year].filter(Boolean).join(' · ')}{v.registration_number && ` · ${v.registration_number}`}{v.owner_id && ` · ${firstName(v.owner_id)}`}</p>
                  </div>
                  <IconButton label="Delete vehicle" onClick={async () => {
                    if (await confirmAction({ title: `Remove ${v.name}?`, body: 'Its fuel and service log is deleted too.', confirmLabel: 'Remove', danger: true })) mutate((b) => b.remove('vehicles', v.id), 'Vehicle removed')
                  }}><Trash2 size={16} /></IconButton>
                </div>
                <div className="grid grid-cols-2 gap-2 px-5 sm:grid-cols-4">
                  {[
                    ['Total spent', formatMoney(stats.total, currency)],
                    ['Fuel', formatMoney(stats.fuel, currency)],
                    ['Mileage', stats.kmPerLitre ? `${stats.kmPerLitre.toFixed(1)} km/l` : '—'],
                    ['Cost per km', stats.costPerKm ? formatMoney(stats.costPerKm, currency, { decimals: true }) : '—'],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-[10px] bg-surface-2 px-3 py-2"><div className="text-[11.5px] text-ink-3">{label}</div><div className="font-semibold tabular-nums">{value}</div></div>
                  ))}
                </div>
                <p className="px-5 pt-2 text-[12px] text-ink-3">
                  {stats.lastOdometer ? `Odometer ${stats.lastOdometer.toLocaleString('en-IN')} km. ` : ''}Mileage needs two fuel fills with odometer and litres.
                </p>
                <div className="flex gap-2 px-5 py-4">
                  <Button size="sm" icon={<Fuel size={15} />} onClick={() => setLogging(v)}>Log expense</Button>
                  <Button size="sm" variant="ghost" icon={<ChevronDown size={15} className={cx('transition', open && 'rotate-180')} />} onClick={() => setOpenId(open ? null : v.id)}>{expenses.length} entries</Button>
                </div>
                {open && (
                  <ul className="divide-y divide-line border-t border-line">
                    {expenses.map((e) => (
                      <li key={e.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                        {e.expense_type === 'FUEL' ? <Fuel size={15} className="text-ink-3" /> : <Wrench size={15} className="text-ink-3" />}
                        <span className="min-w-0 flex-1 truncate">
                          {EXPENSE_TYPES.find((t) => t.value === e.expense_type)?.label}
                          <span className="text-ink-3"> · {formatDate(e.expense_date)}{e.odometer_km != null && ` · ${e.odometer_km.toLocaleString('en-IN')} km`}{e.litres && ` · ${e.litres} L`}</span>
                        </span>
                        <span className="tabular-nums">{formatMoney(e.amount, currency)}</span>
                        <IconButton label="Delete entry" className="h-7 w-7" onClick={() => mutate((b) => b.remove('vehicleExpenses', e.id))}><Trash2 size={14} /></IconButton>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            )
          })}
        </div>
      ) : (
        <Card><EmptyState icon={<Car size={20} />} title="No vehicles yet" body="Add your car or two-wheeler to track fuel, service costs and mileage." action={<Button onClick={() => setCreating(true)}>Add vehicle</Button>} /></Card>
      )}

      <VehicleForm open={creating} onClose={() => setCreating(false)} />
      <VehicleExpenseForm vehicle={logging} onClose={() => setLogging(null)} />
    </div>
  )
}

function VehicleForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { members, userId, mutate } = useHousehold()
  const blank = { name: '', type: 'CAR' as VehicleType, make: '', model: '', year: '', reg: '', fuel: 'Petrol', owner: userId, shared: true }
  const [form, setForm] = useState(blank)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    if (!form.name.trim()) return setError('Give it a name, e.g. “Family car”.')
    const year = form.year ? Number(form.year) : null
    if (year !== null && !(year >= 1950 && year <= 2100)) return setError('Enter a valid year.')
    const ok = await mutate((b) => b.insert('vehicles', {
      name: form.name.trim(), vehicle_type: form.type, make: form.make || null, model: form.model || null, year,
      registration_number: form.reg.toUpperCase() || null, fuel_type: form.fuel || null, owner_id: form.owner || null, is_shared: form.shared,
    }), 'Vehicle added')
    if (ok) { setForm(blank); setError(null); onClose() }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add vehicle" footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save}>Add</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name"><input className="field" maxLength={80} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Type"><select className="field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as VehicleType })}>{TYPES.map((t) => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>)}</select></Field>
        <Field label="Make"><input className="field" placeholder="Hyundai" value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} /></Field>
        <Field label="Model"><input className="field" placeholder="Creta" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} /></Field>
        <Field label="Year"><input className="field" inputMode="numeric" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} /></Field>
        <Field label="Registration no."><input className="field uppercase" value={form.reg} onChange={(e) => setForm({ ...form, reg: e.target.value })} /></Field>
        <Field label="Fuel"><select className="field" value={form.fuel} onChange={(e) => setForm({ ...form, fuel: e.target.value })}>{['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'].map((f) => <option key={f}>{f}</option>)}</select></Field>
        <Field label="Main user"><select className="field" value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })}>{members.map((m) => <option key={m.user_id} value={m.user_id}>{m.full_name}</option>)}</select></Field>
        <label className="flex items-center gap-2 text-sm text-ink-2 sm:col-span-2"><input type="checkbox" className="h-4 w-4 accent-[var(--primary)]" checked={form.shared} onChange={(e) => setForm({ ...form, shared: e.target.checked })} />Shared by the family</label>
      </div>
      {error && <p className="mt-3 rounded-[10px] bg-negative-soft px-3 py-2 text-sm text-negative">{error}</p>}
    </Modal>
  )
}

function VehicleExpenseForm({ vehicle, onClose }: { vehicle: Vehicle | null; onClose: () => void }) {
  const { currency, mutate } = useHousehold()
  const [form, setForm] = useState({ type: 'FUEL' as VehicleExpenseType, amount: '', odometer: '', litres: '', date: today(), notes: '' })
  const [error, setError] = useState<string | null>(null)
  const [key, setKey] = useState<string | null>(null)
  if ((vehicle?.id ?? null) !== key) { setKey(vehicle?.id ?? null); setForm({ type: 'FUEL', amount: '', odometer: '', litres: '', date: today(), notes: '' }); setError(null) }

  async function save() {
    if (!vehicle) return
    const amount = parseMoney(form.amount)
    if (!Number.isFinite(amount) || amount <= 0) return setError('Enter an amount above zero.')
    const odometer = form.odometer ? Number(form.odometer) : null
    const litres = form.litres ? Number(form.litres) : null
    if (odometer !== null && !(odometer >= 0)) return setError('Odometer must be a positive number.')
    if (litres !== null && !(litres > 0)) return setError('Litres must be above zero.')
    const ok = await mutate((b) => b.insert('vehicleExpenses', { vehicle_id: vehicle.id, expense_type: form.type, amount, odometer_km: odometer, litres, expense_date: form.date, notes: form.notes || null }), 'Logged')
    if (ok) onClose()
  }

  return (
    <Modal open={!!vehicle} onClose={onClose} title={`Log expense · ${vehicle?.name ?? ''}`} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save}>Save</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Type"><select className="field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as VehicleExpenseType })}>{EXPENSE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></Field>
        <Field label={`Amount (${currency})`}><input className="field" inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Field>
        <Field label="Odometer (km)" hint="Optional, but needed for mileage"><input className="field" inputMode="numeric" value={form.odometer} onChange={(e) => setForm({ ...form, odometer: e.target.value })} /></Field>
        {form.type === 'FUEL' && <Field label="Litres" hint="Fill the tank fully for accurate km/l"><input className="field" inputMode="decimal" value={form.litres} onChange={(e) => setForm({ ...form, litres: e.target.value })} /></Field>}
        <Field label="Date"><input className="field" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
        <Field label="Notes" className="sm:col-span-2"><input className="field" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
      </div>
      {error && <p className="mt-3 rounded-[10px] bg-negative-soft px-3 py-2 text-sm text-negative">{error}</p>}
    </Modal>
  )
}
