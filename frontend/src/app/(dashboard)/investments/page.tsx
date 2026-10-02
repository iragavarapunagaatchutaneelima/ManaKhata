'use client'

import { useMemo, useState } from 'react'
import { Pencil, Plus, Trash2, TrendingUp } from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardHeader, EmptyState, Field, IconButton, Modal, PageHeader, Stat, Button, confirmAction } from '@/components/ui'
import { useHousehold } from '@/store/ledger'
import { formatMoney, formatPercent, parseMoney, today } from '@/lib/money'
import { cagr, portfolio } from '@/lib/finance'
import type { AssetType, Investment } from '@/lib/model'

const ASSETS: { value: AssetType; label: string; color: string }[] = [
  { value: 'MUTUAL_FUND', label: 'Mutual funds', color: '#3B4BC8' }, { value: 'STOCK', label: 'Stocks', color: '#6C5BD4' },
  { value: 'FIXED_DEPOSIT', label: 'Fixed deposits', color: '#2F8F83' }, { value: 'RECURRING_DEPOSIT', label: 'Recurring deposits', color: '#2E7BC4' },
  { value: 'PPF', label: 'PPF', color: '#16855A' }, { value: 'EPF', label: 'EPF', color: '#5E7A2E' }, { value: 'NPS', label: 'NPS', color: '#8A6A3B' },
  { value: 'GOLD', label: 'Gold', color: '#E59A1C' }, { value: 'REAL_ESTATE', label: 'Real estate', color: '#C2562E' },
  { value: 'BOND', label: 'Bonds', color: '#1F9BB4' }, { value: 'CRYPTO', label: 'Crypto', color: '#B4519E' }, { value: 'OTHER', label: 'Other', color: '#8A90A6' },
]
const asset = (v: string) => ASSETS.find((a) => a.value === v) ?? ASSETS[ASSETS.length - 1]

export default function InvestmentsPage() {
  const { data, currency, firstName, mutate } = useHousehold()
  const [editing, setEditing] = useState<Investment | 'new' | null>(null)
  const t = today()
  const summary = useMemo(() => portfolio(data?.investments ?? []), [data])
  if (!data) return null
  const holdings = [...data.investments].sort((a, b) => b.current_value - a.current_value)

  return (
    <div>
      <PageHeader title="Investments" subtitle="Your family’s savings and investments in one view. Update values from your statements every month or so."
        actions={<Button icon={<Plus size={16} />} onClick={() => setEditing('new')}>Add holding</Button>} />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Current value" value={formatMoney(summary.current, currency)} />
        <Stat label="Invested" value={formatMoney(summary.invested, currency)} />
        <Stat label="Gain" value={formatMoney(summary.gain, currency, { sign: true })} tone={summary.gain >= 0 ? 'positive' : 'negative'} hint={formatPercent(summary.gainPercent, 1)} />
        <Stat label="Liquid assets" value={formatMoney(summary.liquid, currency)} hint="FDs, RDs, mutual funds, bonds" />
      </div>

      {holdings.length ? (
        <div className="grid gap-5 lg:grid-cols-3">
          <Card>
            <CardHeader title="Allocation" />
            <div className="h-48"><ResponsiveContainer><PieChart>
              <Pie data={summary.allocation} dataKey="value" nameKey="type" innerRadius={50} outerRadius={80} paddingAngle={2} stroke="none">
                {summary.allocation.map((a) => <Cell key={a.type} fill={asset(a.type).color} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [formatMoney(Number(v), currency), asset(String(n)).label]} />
            </PieChart></ResponsiveContainer></div>
            <ul className="space-y-1.5 px-5 pb-5 text-[13px]">
              {summary.allocation.map((a) => (
                <li key={a.type} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: asset(a.type).color }} /><span className="flex-1 text-ink-2">{asset(a.type).label}</span><span className="font-semibold">{a.share.toFixed(0)}%</span></li>
              ))}
            </ul>
          </Card>

          <Card className="overflow-x-auto lg:col-span-2">
            <table className="table min-w-[640px]">
              <thead><tr><th>Holding</th><th className="text-right">Invested</th><th className="text-right">Current</th><th className="text-right">Return</th><th /></tr></thead>
              <tbody>
                {holdings.map((h) => {
                  const gain = h.current_value - h.invested_amount
                  const pct = h.invested_amount > 0 ? (gain / h.invested_amount) * 100 : 0
                  const annual = cagr(h, t)
                  return (
                    <tr key={h.id}>
                      <td><div className="font-medium">{h.name}</div><div className="text-[12px] text-ink-3">{asset(h.asset_type).label}{h.owner_id && ` · ${firstName(h.owner_id)}`}{h.platform && ` · ${h.platform}`}</div></td>
                      <td className="text-right tabular-nums">{formatMoney(h.invested_amount, currency)}</td>
                      <td className="text-right tabular-nums font-semibold">{formatMoney(h.current_value, currency)}</td>
                      <td className="text-right tabular-nums">
                        <span className={gain >= 0 ? 'text-positive' : 'text-negative'}>{gain >= 0 ? '+' : ''}{pct.toFixed(1)}%</span>
                        {annual !== null && <div className="text-[11.5px] text-ink-3">{annual.toFixed(1)}% / yr</div>}
                      </td>
                      <td className="whitespace-nowrap text-right">
                        <IconButton label="Update value" onClick={() => setEditing(h)}><Pencil size={15} /></IconButton>
                        <IconButton label="Delete holding" onClick={async () => { if (await confirmAction({ title: `Delete ${h.name}?`, confirmLabel: 'Delete', danger: true })) mutate((b) => b.remove('investments', h.id), 'Holding deleted') }}><Trash2 size={15} /></IconButton>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Card>
        </div>
      ) : (
        <Card><EmptyState icon={<TrendingUp size={20} />} title="No holdings yet" body="Add mutual funds, PPF, FDs, stocks or gold to see your family’s net investments." action={<Button onClick={() => setEditing('new')}>Add holding</Button>} /></Card>
      )}

      <p className="mt-4 text-[12px] text-ink-3">Kinfold does not fetch live prices or give investment advice. Returns are calculated from the values you enter.</p>
      <HoldingForm holding={editing} onClose={() => setEditing(null)} />
    </div>
  )
}

function HoldingForm({ holding, onClose }: { holding: Investment | 'new' | null; onClose: () => void }) {
  const { members, userId, currency, mutate } = useHousehold()
  const editing = holding && holding !== 'new' ? holding : null
  const [form, setForm] = useState({ name: '', type: 'MUTUAL_FUND' as AssetType, invested: '', current: '', date: '', platform: '', owner: userId })
  const [error, setError] = useState<string | null>(null)
  const [key, setKey] = useState<string | null>(null)
  const formKey = holding === null ? null : editing?.id ?? 'new'
  if (formKey !== key) {
    setKey(formKey)
    setForm(editing ? { name: editing.name, type: editing.asset_type, invested: String(editing.invested_amount), current: String(editing.current_value), date: editing.investment_date ?? '', platform: editing.platform ?? '', owner: editing.owner_id ?? userId }
      : { name: '', type: 'MUTUAL_FUND', invested: '', current: '', date: '', platform: '', owner: userId })
    setError(null)
  }

  async function save() {
    const invested = parseMoney(form.invested)
    const current = form.current ? parseMoney(form.current) : invested
    if (!form.name.trim()) return setError('Name the holding.')
    if (!Number.isFinite(invested) || invested < 0) return setError('Enter how much was invested.')
    if (!Number.isFinite(current) || current < 0) return setError('Enter the current value.')
    const row = { name: form.name.trim(), asset_type: form.type, invested_amount: invested, current_value: current, investment_date: form.date || null, platform: form.platform || null, owner_id: form.owner || null }
    const ok = await mutate((b) => editing ? b.update('investments', editing.id, row) : b.insert('investments', row), editing ? 'Holding updated' : 'Holding added')
    if (ok) onClose()
  }

  return (
    <Modal open={holding !== null} onClose={onClose} title={editing ? 'Update holding' : 'Add holding'} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save}>Save</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" className="sm:col-span-2"><input className="field" maxLength={80} placeholder="e.g. Nifty 50 index fund" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Type"><select className="field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as AssetType })}>{ASSETS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}</select></Field>
        <Field label="Owner"><select className="field" value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })}>{members.map((m) => <option key={m.user_id} value={m.user_id}>{m.full_name}</option>)}</select></Field>
        <Field label={`Amount invested (${currency})`}><input className="field" inputMode="decimal" value={form.invested} onChange={(e) => setForm({ ...form, invested: e.target.value })} /></Field>
        <Field label={`Current value (${currency})`}><input className="field" inputMode="decimal" value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} /></Field>
        <Field label="Invested on" hint="Used for yearly return"><input className="field" type="date" max={today()} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
        <Field label="Platform / bank"><input className="field" value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} /></Field>
      </div>
      {error && <p className="mt-3 rounded-[10px] bg-negative-soft px-3 py-2 text-sm text-negative">{error}</p>}
    </Modal>
  )
}
