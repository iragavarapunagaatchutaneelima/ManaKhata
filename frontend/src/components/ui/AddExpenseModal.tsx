'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import type { ExpenseCategory, ExpenseType } from '@/types'

const categories: ExpenseCategory[] = [
  'FOOD','GROCERIES','PETROL','TRAVEL','RENT','ELECTRICITY','INTERNET',
  'MEDICAL','SHOPPING','EDUCATION','ENTERTAINMENT','INVESTMENT','SAVINGS',
  'REPAIRS','MAINTENANCE','EMERGENCY','VEHICLE','UTILITIES','OTHER'
]

const categoryIcons: Partial<Record<ExpenseCategory, string>> = {
  FOOD:'🍽️', GROCERIES:'🛒', PETROL:'⛽', TRAVEL:'✈️', RENT:'🏠',
  ELECTRICITY:'⚡', INTERNET:'🌐', MEDICAL:'🏥', SHOPPING:'🛍️',
  EDUCATION:'📚', ENTERTAINMENT:'🎬', INVESTMENT:'📈', SAVINGS:'💰',
  REPAIRS:'🔧', MAINTENANCE:'⚙️', EMERGENCY:'🚨', VEHICLE:'🚗',
  UTILITIES:'💡', OTHER:'📦',
}

interface Props {
  onClose: () => void
  onSuccess: () => void
}

export default function AddExpenseModal({ onClose, onSuccess }: Props) {
  const [form, setForm] = useState({
    amount: '',
    description: '',
    category: 'FOOD' as ExpenseCategory,
    expenseType: 'VARIABLE' as ExpenseType,
    expenseDate: new Date().toISOString().split('T')[0],
    notes: '',
    paidForHousehold: false,
    isReimbursable: false,
  })
  const [loading, setLoading] = useState(false)

  const update = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.createExpense({
        ...form,
        amount: parseFloat(form.amount),
      })
      toast.success('Expense added! 💸')
      onSuccess()
    } catch (err: any) {
      toast.error(err.message || 'Failed to add expense')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          className="glass-card w-full max-w-md p-6"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
          initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
              Add Expense
            </h2>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-red-500/10 transition-colors">
              <X size={18} style={{ color: 'var(--text-muted)' }} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Amount */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Amount (₹)</label>
              <input id="expense-amount" type="number" min="1" step="0.01" value={form.amount}
                onChange={e => update('amount', e.target.value)}
                className="input-field text-lg font-bold"
                placeholder="0.00" required />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Description</label>
              <input id="expense-desc" type="text" value={form.description}
                onChange={e => update('description', e.target.value)}
                className="input-field" placeholder="What did you spend on?" required />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Category</label>
              <div className="grid grid-cols-5 gap-1.5 max-h-36 overflow-y-auto pr-1">
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => update('category', cat)}
                    id={`cat-${cat}`}
                    className={`flex flex-col items-center p-2 rounded-xl text-center transition-all ${
                      form.category === cat
                        ? 'bg-brand-500/20 border border-brand-500/40'
                        : 'border border-transparent hover:bg-brand-500/8'
                    }`}
                  >
                    <span className="text-lg">{categoryIcons[cat]}</span>
                    <span className="text-[9px] mt-0.5 capitalize" style={{ color: 'var(--text-muted)' }}>
                      {cat.replace('_', ' ').toLowerCase().slice(0, 7)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Date & Type */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Date</label>
                <input id="expense-date" type="date" value={form.expenseDate}
                  onChange={e => update('expenseDate', e.target.value)}
                  className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Type</label>
                <select id="expense-type" value={form.expenseType}
                  onChange={e => update('expenseType', e.target.value)}
                  className="input-field">
                  <option value="VARIABLE">Variable</option>
                  <option value="FIXED">Fixed</option>
                  <option value="EMERGENCY">Emergency</option>
                  <option value="SHARED">Shared</option>
                </select>
              </div>
            </div>

            {/* Toggles */}
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input id="exp-household" type="checkbox" checked={form.paidForHousehold}
                  onChange={e => update('paidForHousehold', e.target.checked)}
                  className="w-4 h-4 accent-indigo-500 rounded" />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Paid for household</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input id="exp-reimb" type="checkbox" checked={form.isReimbursable}
                  onChange={e => update('isReimbursable', e.target.checked)}
                  className="w-4 h-4 accent-indigo-500 rounded" />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Reimbursable</span>
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
              <button id="expense-submit" type="submit" disabled={loading} className="btn-primary flex-1 disabled:opacity-50">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : 'Add Expense 💸'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
