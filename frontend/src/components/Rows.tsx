'use client'

import { Lock, Split } from 'lucide-react'
import { CategoryIcon } from './CategoryIcon'
import { Badge, Money } from './ui'
import { category } from '@/lib/categories'
import { formatDate } from '@/lib/money'
import type { Expense, Income } from '@/lib/model'
import { useHousehold } from '@/store/ledger'
import { openEditExpense, openEditIncome } from './TransactionModal'

export function ExpenseRow({ e, showDate = true }: { e: Expense; showDate?: boolean }) {
  const { currency, firstName, data, userId } = useHousehold()
  const split = data?.splits.some((s) => s.expense_id === e.id)
  const canEdit = e.created_by === userId || e.paid_by === userId
  return (
    <button type="button" onClick={() => canEdit && openEditExpense(e)} disabled={!canEdit}
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition enabled:hover:bg-surface-2">
      <CategoryIcon cat={e.category} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 truncate text-[14px] font-medium text-ink">
          <span className="truncate">{e.description}</span>
          {e.visibility === 'PERSONAL' && <Lock size={12} className="shrink-0 text-ink-3" aria-label="Private" />}
          {split && <Split size={12} className="shrink-0 text-primary" aria-label="Split" />}
        </div>
        <div className="truncate text-[12.5px] text-ink-3">
          {category(e.category).label} · {firstName(e.paid_by)}{showDate && <> · {formatDate(e.expense_date)}</>}
          {e.is_reimbursable && <Badge tone="saffron" className="ml-1.5 align-middle">reimburse</Badge>}
        </div>
      </div>
      <Money amount={e.amount} currency={currency} tone="out" className="text-[15px] font-semibold" />
    </button>
  )
}

export function IncomeRow({ i }: { i: Income }) {
  const { currency, firstName } = useHousehold()
  return (
    <button type="button" onClick={() => openEditIncome(i)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-surface-2">
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-positive-soft text-[15px] font-bold text-positive">+</span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-medium text-ink">{i.source}{i.notes ? ` — ${i.notes}` : ''}</div>
        <div className="truncate text-[12.5px] text-ink-3">Income · {firstName(i.user_id)} · {formatDate(i.income_date)}</div>
      </div>
      <Money amount={i.amount} currency={currency} tone="in" className="text-[15px] font-semibold" />
    </button>
  )
}
