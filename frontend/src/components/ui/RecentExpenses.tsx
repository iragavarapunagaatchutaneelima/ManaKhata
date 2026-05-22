'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2 } from 'lucide-react'
import api from '@/lib/api'
import { formatCurrency, formatDate, useCategoryIcon } from '@/hooks/useUtils'
import type { Expense } from '@/types'
import AddExpenseModal from './AddExpenseModal'
import toast from 'react-hot-toast'

export default function RecentExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => { loadExpenses() }, [])

  const loadExpenses = async () => {
    setLoading(true)
    try {
      const res = await api.getMyExpenses(0, 10)
      if (res.success) setExpenses(res.data.content || [])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.deleteExpense(id)
      toast.success('Expense deleted')
      setExpenses(prev => prev.filter(e => e.id !== id))
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <div className="glass-card">
      <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <h3 className="font-display font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
          Recent Expenses
        </h3>
        <button
          id="add-expense-btn"
          onClick={() => setShowModal(true)}
          className="btn-primary py-1.5 px-3 text-sm"
        >
          <Plus size={14} /> Add
        </button>
      </div>

      {loading ? (
        <div className="p-5 space-y-3">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className="skeleton w-10 h-10 rounded-xl" />
              <div className="flex-1">
                <div className="skeleton h-4 w-40 mb-1" />
                <div className="skeleton h-3 w-24" />
              </div>
              <div className="skeleton h-4 w-16" />
            </div>
          ))}
        </div>
      ) : expenses.length === 0 ? (
        <div className="p-10 text-center">
          <div className="text-4xl mb-2">🧾</div>
          <p style={{ color: 'var(--text-muted)' }} className="text-sm">No expenses yet</p>
          <button onClick={() => setShowModal(true)} className="btn-primary mt-4 text-sm">
            Add your first expense
          </button>
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
          {expenses.map((expense, i) => (
            <motion.div
              key={expense.id}
              className="flex items-center gap-3 p-4 group hover:bg-brand-500/5 transition-colors"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                style={{ background: 'var(--bg-primary)' }}>
                {useCategoryIcon(expense.category)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                  {expense.description}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>
                    {expense.category.replace('_', ' ').toLowerCase()}
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>·</span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {formatDate(expense.expenseDate)}
                  </span>
                  {expense.paidForHousehold && (
                    <span className="badge badge-brand">Household</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-rose-500">
                  -{formatCurrency(expense.amount)}
                </span>
                <button
                  onClick={() => handleDelete(expense.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-rose-400 hover:text-rose-300 transition-all"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {showModal && (
        <AddExpenseModal
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); loadExpenses() }}
        />
      )}
    </div>
  )
}
