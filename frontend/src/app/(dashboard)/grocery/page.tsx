'use client'

import { useMemo, useState } from 'react'
import { Check, ChevronDown, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import { Badge, Button, Card, EmptyState, Field, IconButton, Modal, PageHeader, Progress, confirmAction, cx } from '@/components/ui'
import { useHousehold } from '@/store/ledger'
import { formatDate, formatMoney, parseMoney, sumMoney, today } from '@/lib/money'
import type { GroceryItem, GroceryList } from '@/lib/model'

export default function GroceryPage() {
  const { data, currency, firstName, mutate } = useHousehold()
  const [newList, setNewList] = useState('')
  const [checkout, setCheckout] = useState<GroceryList | null>(null)
  const [showDone, setShowDone] = useState(false)

  const lists = useMemo(() => {
    if (!data) return { active: [], done: [] }
    const withItems = data.groceryLists.map((l) => {
      const items = data.groceryItems.filter((i) => i.list_id === l.id).sort((a, b) => Number(a.is_checked) - Number(b.is_checked) || a.created_at.localeCompare(b.created_at))
      return { list: l, items, estimate: sumMoney(items, (i) => i.estimated_price), checked: items.filter((i) => i.is_checked).length }
    }).sort((a, b) => b.list.created_at.localeCompare(a.list.created_at))
    return { active: withItems.filter((x) => !x.list.completed_at), done: withItems.filter((x) => x.list.completed_at) }
  }, [data])

  if (!data) return null

  async function createList() {
    if (!newList.trim()) return
    const ok = await mutate((b) => b.insert('groceryLists', { name: newList.trim() }), 'List created')
    if (ok) setNewList('')
  }

  return (
    <div>
      <PageHeader title="Groceries" subtitle="Shared shopping lists. Tick items in the shop — everyone sees it live." />

      <form onSubmit={(e) => { e.preventDefault(); createList() }} className="mb-5 flex gap-2">
        <input className="field max-w-sm" placeholder="New list name, e.g. Weekend market" maxLength={80} value={newList} onChange={(e) => setNewList(e.target.value)} />
        <Button type="submit" icon={<Plus size={16} />} disabled={!newList.trim()}>Create</Button>
      </form>

      {lists.active.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {lists.active.map(({ list, items, estimate, checked }) => (
            <ListCard key={list.id} list={list} items={items} estimate={estimate} checked={checked} currency={currency} createdBy={firstName(list.created_by)}
              onCheckout={() => setCheckout(list)}
              onDelete={async () => {
                if (await confirmAction({ title: `Delete “${list.name}”?`, body: 'All items on the list will be removed.', confirmLabel: 'Delete', danger: true }))
                  mutate((b) => b.remove('groceryLists', list.id), 'List deleted')
              }} />
          ))}
        </div>
      ) : (
        <Card><EmptyState icon={<ShoppingCart size={20} />} title="No active lists" body="Create a list and add what the house needs." /></Card>
      )}

      {lists.done.length > 0 && (
        <div className="mt-6">
          <button onClick={() => setShowDone(!showDone)} className="flex items-center gap-1 text-sm font-semibold text-ink-2">
            <ChevronDown size={16} className={cx('transition', showDone && 'rotate-180')} /> Completed lists ({lists.done.length})
          </button>
          {showDone && (
            <Card className="mt-3 divide-y divide-line">
              {lists.done.map(({ list, items }) => {
                const expense = data.expenses.find((e) => e.id === list.expense_id)
                return (
                  <div key={list.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                    <Check size={16} className="text-positive" />
                    <span className="flex-1 font-medium">{list.name} <span className="text-ink-3">· {items.length} items · {formatDate(list.completed_at)}</span></span>
                    {expense && <span className="font-semibold tabular-nums">{formatMoney(expense.amount, currency)}</span>}
                  </div>
                )
              })}
            </Card>
          )}
        </div>
      )}

      <CheckoutModal list={checkout} onClose={() => setCheckout(null)}
        estimate={checkout ? sumMoney(data.groceryItems.filter((i) => i.list_id === checkout.id && i.is_checked), (i) => i.estimated_price) : 0} />
    </div>
  )
}

function ListCard({ list, items, estimate, checked, currency, createdBy, onCheckout, onDelete }: {
  list: GroceryList; items: GroceryItem[]; estimate: number; checked: number; currency: string; createdBy: string; onCheckout: () => void; onDelete: () => void
}) {
  const { mutate } = useHousehold()
  const [form, setForm] = useState({ name: '', qty: '1', unit: 'pcs', price: '' })

  async function addItem() {
    if (!form.name.trim()) return
    const quantity = Number(form.qty) > 0 ? Number(form.qty) : 1
    const price = form.price ? parseMoney(form.price) : 0
    const ok = await mutate((b) => b.insert('groceryItems', { list_id: list.id, name: form.name.trim(), quantity, unit: form.unit || 'pcs', estimated_price: Number.isFinite(price) ? price : 0 }))
    if (ok) setForm({ name: '', qty: '1', unit: 'pcs', price: '' })
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-start justify-between gap-2 px-4 pt-4">
        <div className="min-w-0">
          <h2 className="truncate font-semibold text-ink">{list.name}</h2>
          <p className="text-[12.5px] text-ink-3">by {createdBy} · {checked}/{items.length} in cart · est. {formatMoney(estimate, currency)}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button size="sm" variant="secondary" disabled={!checked} onClick={onCheckout}>Done shopping</Button>
          <IconButton label="Delete list" onClick={onDelete}><Trash2 size={16} /></IconButton>
        </div>
      </div>
      <Progress className="mx-4 mt-3 w-auto" value={items.length ? (checked / items.length) * 100 : 0} tone="positive" />
      <ul className="mt-2 divide-y divide-line">
        {items.map((i) => (
          <li key={i.id} className="group flex items-center gap-3 px-4 py-2">
            <button aria-label={i.is_checked ? `Uncheck ${i.name}` : `Check ${i.name}`} onClick={() => mutate((b) => b.update('groceryItems', i.id, { is_checked: !i.is_checked }))}
              className={cx('flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border-2 transition', i.is_checked ? 'border-positive bg-positive text-white' : 'border-line-strong')}>
              {i.is_checked && <Check size={13} strokeWidth={3} />}
            </button>
            <span className={cx('flex-1 text-sm', i.is_checked && 'text-ink-3 line-through')}>{i.name} <span className="text-ink-3">· {i.quantity} {i.unit}</span></span>
            {i.category && <Badge className="hidden sm:inline-flex">{i.category}</Badge>}
            {i.estimated_price > 0 && <span className="text-[13px] tabular-nums text-ink-2">{formatMoney(i.estimated_price, currency)}</span>}
            <IconButton label={`Remove ${i.name}`} className="h-7 w-7 opacity-60 hover:opacity-100" onClick={() => mutate((b) => b.remove('groceryItems', i.id))}><Trash2 size={14} /></IconButton>
          </li>
        ))}
      </ul>
      <form onSubmit={(e) => { e.preventDefault(); addItem() }} className="flex flex-wrap gap-2 border-t border-line bg-surface-2 p-3">
        <input className="field h-9 min-w-[120px] flex-1" placeholder="Add item" maxLength={80} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="field h-9 w-16" inputMode="decimal" aria-label="Quantity" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} />
        <input className="field h-9 w-16" aria-label="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
        <input className="field h-9 w-24" inputMode="decimal" placeholder="₹ est." aria-label="Estimated price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        <Button size="sm" type="submit" disabled={!form.name.trim()}>Add</Button>
      </form>
    </Card>
  )
}

function CheckoutModal({ list, estimate, onClose }: { list: GroceryList | null; estimate: number; onClose: () => void }) {
  const { userId, currency, mutate } = useHousehold()
  const [amount, setAmount] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [key, setKey] = useState<string | null>(null)
  if ((list?.id ?? null) !== key) { setKey(list?.id ?? null); setAmount(estimate ? String(estimate) : ''); setError(null) }

  async function finish() {
    if (!list) return
    const value = parseMoney(amount)
    if (!Number.isFinite(value) || value <= 0) return setError('Enter what you actually paid.')
    const ok = await mutate(async (b) => {
      const expense = await b.insert('expenses', { amount: value, description: list.name, category: 'GROCERIES', expense_date: today(), paid_by: userId, visibility: 'HOUSEHOLD', payment_method: 'UPI' })
      await b.update('groceryLists', list.id, { completed_at: new Date().toISOString(), expense_id: expense.id })
      return true
    }, 'Shopping recorded as an expense')
    if (ok) onClose()
  }

  return (
    <Modal open={!!list} onClose={onClose} title="Done shopping" description="We’ll record what you paid as a grocery expense."
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={finish}>Record expense</Button></>}>
      <Field label={`Amount paid (${currency})`} hint={estimate ? `Estimated from ticked items: ${formatMoney(estimate, currency)}` : undefined}>
        <input className="field" inputMode="decimal" autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} />
      </Field>
      {error && <p className="mt-3 rounded-[10px] bg-negative-soft px-3 py-2 text-sm text-negative">{error}</p>}
    </Modal>
  )
}
