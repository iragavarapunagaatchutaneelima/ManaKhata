'use client'

import { useMemo, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Gift, Minus, Plus, Send, Wallet } from 'lucide-react'
import { Avatar, Badge, Button, Card, CardHeader, EmptyState, Field, Modal, PageHeader } from '@/components/ui'
import { useHousehold } from '@/store/ledger'
import { formatDate, formatMoney, parseMoney } from '@/lib/money'
import { walletBalance, walletBalances } from '@/lib/finance'
import { ROLE_LABELS } from '@/lib/categories'
import type { WalletKind } from '@/lib/model'

const KIND_LABEL: Record<WalletKind, string> = { TOP_UP: 'Added money', ALLOCATION: 'Pocket money', TRANSFER: 'Transfer', CHORE_REWARD: 'Chore reward', WITHDRAWAL: 'Spent' }

type Action = 'topup' | 'give' | 'spend' | null

export default function WalletPage() {
  const { data, userId, members, currency, isManager, memberName, firstName } = useHousehold()
  const [action, setAction] = useState<Action>(null)

  const view = useMemo(() => {
    if (!data) return null
    return {
      mine: walletBalance(data.wallet, userId),
      balances: walletBalances(data.wallet, members),
      history: data.wallet.filter((t) => isManager || t.from_user === userId || t.to_user === userId).slice(0, 40),
    }
  }, [data, userId, members, isManager])

  if (!view) return null

  return (
    <div>
      <PageHeader title="Pocket money" subtitle="A family wallet for allowances, chore rewards and small transfers. It tracks cash you hand over — no bank link." />

      <div className="grid gap-5 lg:grid-cols-3">
        <Card fold className="p-6 lg:col-span-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink-3"><Wallet size={16} /> Your wallet</div>
          <div className="mt-2 font-display text-4xl font-bold text-ink">{formatMoney(view.mine, currency, { decimals: true })}</div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            <Button variant="secondary" size="sm" icon={<Plus size={15} />} onClick={() => setAction('topup')}>Add</Button>
            <Button size="sm" icon={<Send size={15} />} onClick={() => setAction('give')}>{isManager ? 'Give' : 'Send'}</Button>
            <Button variant="secondary" size="sm" icon={<Minus size={15} />} onClick={() => setAction('spend')}>Spent</Button>
          </div>
          <p className="mt-4 text-[12.5px] text-ink-3">
            {isManager ? 'Add money to your wallet, then give pocket money or pay chore rewards from it.' : 'Your pocket money and chore rewards land here. Record what you spend to keep it accurate.'}
          </p>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Family balances" />
          <ul className="divide-y divide-line">
            {members.map((m) => (
              <li key={m.user_id} className="flex items-center gap-3 px-5 py-3">
                <Avatar name={m.full_name} size={34} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{m.full_name}{m.user_id === userId && <span className="text-ink-3"> (you)</span>}</div>
                  <div className="text-[12px] text-ink-3">{ROLE_LABELS[m.role]}</div>
                </div>
                <span className="font-semibold tabular-nums">{formatMoney(view.balances.get(m.user_id) ?? 0, currency, { decimals: true })}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader title="History" subtitle={isManager ? 'All wallet activity in the household' : 'Your wallet activity'} />
        {view.history.length ? (
          <ul className="divide-y divide-line">
            {view.history.map((t) => {
              const incoming = t.to_user === userId
              const outgoing = t.from_user === userId
              const sign = incoming && !outgoing ? 1 : outgoing && !incoming ? -1 : 0
              return (
                <li key={t.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                  <span className={`inline-flex h-9 w-9 items-center justify-center rounded-[10px] ${t.kind === 'CHORE_REWARD' ? 'bg-saffron-soft text-saffron-ink' : sign >= 0 ? 'bg-positive-soft text-positive' : 'bg-surface-3 text-ink-2'}`}>
                    {t.kind === 'CHORE_REWARD' ? <Gift size={16} /> : sign >= 0 ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 font-medium"><span className="truncate">{t.note || KIND_LABEL[t.kind]}</span><Badge>{KIND_LABEL[t.kind]}</Badge></div>
                    <div className="text-[12px] text-ink-3">
                      {t.from_user ? firstName(t.from_user) : 'Cash in'} → {t.to_user ? firstName(t.to_user) : 'Spent'} · {formatDate(t.created_at)}
                    </div>
                  </div>
                  <span className={`font-semibold tabular-nums ${sign > 0 ? 'text-positive' : ''}`}>
                    {sign > 0 ? '+' : sign < 0 ? '−' : ''}{formatMoney(t.amount, currency, { decimals: true })}
                  </span>
                </li>
              )
            })}
          </ul>
        ) : <EmptyState icon={<Wallet size={20} />} title="No wallet activity yet" body="Add money to start giving pocket money and chore rewards." />}
      </Card>

      <WalletAction action={action} onClose={() => setAction(null)} balance={view.mine} memberName={memberName} />
    </div>
  )
}

function WalletAction({ action, onClose, balance, memberName }: { action: Action; onClose: () => void; balance: number; memberName: (id: string) => string }) {
  const { members, userId, currency, isManager, mutate } = useHousehold()
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [to, setTo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const others = members.filter((m) => m.user_id !== userId)

  const titles = { topup: 'Add money to your wallet', give: isManager ? 'Give pocket money' : 'Send to family', spend: 'Record spending' }

  async function submit() {
    const value = parseMoney(amount)
    if (!Number.isFinite(value) || value <= 0) return setError('Enter an amount above zero.')
    if (action !== 'topup' && value > balance) return setError(`You only have ${formatMoney(balance, currency, { decimals: true })} in your wallet.`)
    const target = to || others[0]?.user_id
    if (action === 'give' && !target) return setError('Pick who to send money to.')
    const ok = await mutate(async (b) => {
      if (action === 'topup') await b.walletTopUp(value, note || undefined)
      if (action === 'spend') await b.walletWithdraw(value, note || undefined)
      if (action === 'give') await b.walletTransfer(target!, value, note || undefined)
      return true
    }, action === 'give' ? `Sent to ${memberName(target!)}` : 'Wallet updated')
    if (ok) { setAmount(''); setNote(''); setError(null); onClose() }
  }

  return (
    <Modal open={action !== null} onClose={onClose} title={action ? titles[action] : ''}
      description={action === 'topup' ? 'Record cash you are putting into the family wallet.' : `Available: ${formatMoney(balance, currency, { decimals: true })}`}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit}>Confirm</Button></>}>
      <div className="space-y-4">
        {action === 'give' && (
          <Field label="To">
            <select className="field" value={to || others[0]?.user_id || ''} onChange={(e) => setTo(e.target.value)}>
              {others.map((m) => <option key={m.user_id} value={m.user_id}>{m.full_name}</option>)}
            </select>
          </Field>
        )}
        <Field label={`Amount (${currency})`}><input className="field" inputMode="decimal" autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
        <Field label="Note (optional)"><input className="field" maxLength={200} placeholder={action === 'give' ? 'e.g. October pocket money' : ''} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        {error && <p className="rounded-[10px] bg-negative-soft px-3 py-2 text-sm text-negative">{error}</p>}
      </div>
    </Modal>
  )
}
