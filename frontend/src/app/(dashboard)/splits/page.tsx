'use client'

import { useMemo } from 'react'
import { ArrowRight, Handshake, Plus, Split } from 'lucide-react'
import { Avatar, Badge, Button, Card, CardHeader, EmptyState, Money, PageHeader, Stat, confirmAction } from '@/components/ui'
import { openAddExpense } from '@/components/TransactionModal'
import { useHousehold } from '@/store/ledger'
import { formatDate, formatMoney, sumMoney } from '@/lib/money'
import { netBalances, pairwiseDebts, simplifyDebts } from '@/lib/finance'

export default function SplitsPage() {
  const { data, userId, currency, memberName, firstName, isManager, mutate } = useHousehold()

  const view = useMemo(() => {
    if (!data) return null
    const net = netBalances(data.splits)
    const pairs = pairwiseDebts(data.splits)
    const plan = simplifyDebts(net)
    const open = data.splits.filter((s) => !s.settled_at)
    const expenseById = new Map(data.expenses.map((e) => [e.id, e]))
    return {
      net,
      mine: net.get(userId) ?? 0,
      owedToMe: sumMoney(pairs.filter((p) => p.creditor === userId), (p) => p.amount),
      iOwe: sumMoney(pairs.filter((p) => p.debtor === userId), (p) => p.amount),
      pairs,
      plan,
      saved: Math.max(0, pairs.length - plan.length),
      open: open.map((s) => ({ s, e: expenseById.get(s.expense_id) })).sort((a, b) => (b.e?.expense_date ?? '').localeCompare(a.e?.expense_date ?? '')),
      history: data.settlements.slice(0, 15),
    }
  }, [data, userId])

  if (!view) return null

  async function settle(debtor: string, creditor: string, amount: number) {
    const who = debtor === userId ? `you paid ${firstName(creditor)}` : `${firstName(debtor)} paid ${creditor === userId ? 'you' : firstName(creditor)}`
    const ok = await confirmAction({ title: `Record that ${who} ${formatMoney(amount, currency, { decimals: true })}?`, body: 'This marks every open split between the two of you as settled. Make the payment by UPI or cash first.', confirmLabel: 'Mark settled' })
    if (!ok) return
    await mutate(async (b) => {
      await b.settleUp(debtor, creditor)
      await b.settleUp(creditor, debtor) // clear the opposite direction too, so the pair nets to zero
    }, 'Balance settled')
  }

  return (
    <div>
      <PageHeader title="Split & settle" subtitle="Shared costs between family members, netted out fairly."
        actions={<Button icon={<Plus size={16} />} onClick={() => openAddExpense()}>Split an expense</Button>} />

      <div className="mb-5 grid grid-cols-3 gap-3">
        <Stat label="Owed to you" value={formatMoney(view.owedToMe, currency, { decimals: true })} tone="positive" />
        <Stat label="You owe" value={formatMoney(view.iOwe, currency, { decimals: true })} tone={view.iOwe > 0 ? 'negative' : undefined} />
        <Stat label="Your net" value={<Money amount={view.mine} currency={currency} tone="auto" decimals sign />} hint={view.mine === 0 ? 'All square' : view.mine > 0 ? 'Family owes you' : 'You owe family'} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Balances" subtitle="Who owes whom, after netting both ways" />
          {view.pairs.length ? (
            <ul className="divide-y divide-line">
              {view.pairs.map((p) => {
                const involved = p.debtor === userId || p.creditor === userId
                return (
                  <li key={`${p.debtor}-${p.creditor}`} className="flex flex-wrap items-center gap-3 px-5 py-3">
                    <Avatar name={memberName(p.debtor)} size={30} />
                    <div className="min-w-0 flex-1 text-sm">
                      <span className="font-semibold">{p.debtor === userId ? 'You' : firstName(p.debtor)}</span>
                      <span className="text-ink-3"> owe{p.debtor === userId ? '' : 's'} </span>
                      <span className="font-semibold">{p.creditor === userId ? 'you' : firstName(p.creditor)}</span>
                    </div>
                    <span className="font-semibold tabular-nums">{formatMoney(p.amount, currency, { decimals: true })}</span>
                    {(involved || isManager) && <Button size="sm" variant="secondary" onClick={() => settle(p.debtor, p.creditor, p.amount)}>Settle</Button>}
                  </li>
                )
              })}
            </ul>
          ) : <EmptyState icon={<Handshake size={20} />} title="Everyone is square" body="When someone pays for a shared expense, split it and it shows up here." />}
        </Card>

        <Card fold>
          <CardHeader title="Fewest payments to settle everyone" subtitle={view.saved > 0 ? `Saves ${view.saved} payment${view.saved > 1 ? 's' : ''} compared with paying back one by one` : 'Based on everyone’s net balance'} />
          {view.plan.length ? (
            <ul className="space-y-2 px-5 pb-5">
              {view.plan.map((p, i) => (
                <li key={i} className="flex items-center gap-3 rounded-[12px] border border-line p-3 text-sm">
                  <Avatar name={memberName(p.debtor)} size={28} />
                  <span className="font-semibold">{firstName(p.debtor)}</span>
                  <ArrowRight size={16} className="text-ink-3" />
                  <Avatar name={memberName(p.creditor)} size={28} />
                  <span className="font-semibold">{firstName(p.creditor)}</span>
                  <span className="ml-auto font-semibold text-primary tabular-nums">{formatMoney(p.amount, currency, { decimals: true })}</span>
                </li>
              ))}
              <p className="pt-1 text-[12.5px] text-ink-3">Pay these amounts outside Kinfold (UPI or cash), then use <b>Settle</b> on the matching balances.</p>
            </ul>
          ) : <p className="px-5 pb-6 text-sm text-ink-3">Nothing to settle right now.</p>}
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Open splits" subtitle="Each shared expense that isn’t settled yet" />
          {view.open.length ? (
            <ul className="divide-y divide-line">
              {view.open.slice(0, 20).map(({ s, e }) => (
                <li key={s.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                  <Split size={16} className="shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{e?.description ?? 'Shared expense'}</div>
                    <div className="text-[12px] text-ink-3">{firstName(s.owed_by)} owes {firstName(s.owed_to)} · {formatDate(e?.expense_date)}</div>
                  </div>
                  <span className="tabular-nums">{formatMoney(s.amount, currency, { decimals: true })}</span>
                </li>
              ))}
            </ul>
          ) : <p className="px-5 pb-6 text-sm text-ink-3">No open splits.</p>}
        </Card>

        <Card>
          <CardHeader title="Settlement history" />
          {view.history.length ? (
            <ul className="divide-y divide-line">
              {view.history.map((h) => (
                <li key={h.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                  <Badge tone="positive">Settled</Badge>
                  <span className="min-w-0 flex-1 truncate">{firstName(h.from_user)} → {firstName(h.to_user)}</span>
                  <span className="text-[12px] text-ink-3">{formatDate(h.created_at)}</span>
                  <span className="tabular-nums font-semibold">{formatMoney(h.amount, currency, { decimals: true })}</span>
                </li>
              ))}
            </ul>
          ) : <p className="px-5 pb-6 text-sm text-ink-3">Settled balances will be listed here.</p>}
        </Card>
      </div>
    </div>
  )
}
