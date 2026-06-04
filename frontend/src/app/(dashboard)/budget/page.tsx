'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2 } from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, getMonthName, getCategoryIcon } from '@/hooks/useUtils'
import type { Budget, ExpenseCategory } from '@/types'
import toast from 'react-hot-toast'

const categories: ExpenseCategory[] = [
  'FOOD','GROCERIES','PETROL','TRAVEL','RENT','ELECTRICITY','INTERNET',
  'MEDICAL','SHOPPING','EDUCATION','ENTERTAINMENT','INVESTMENT','SAVINGS',
  'REPAIRS','MAINTENANCE','EMERGENCY','VEHICLE','UTILITIES','OTHER'
]

export default function BudgetPage() {
  const { user } = useAuthStore()
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [householdBudgets, setHouseholdBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    category: 'GROCERIES' as ExpenseCategory,
    monthlyLimit: '',
    budgetType: 'PERSONAL',
    alertAtPercent: '80',
  })

  const now = new Date()

  useEffect(() => { loadBudgets() }, [])

  const loadBudgets = async () => {
    setLoading(true)
    const [p, h] = await Promise.all([api.getMyBudgets(), api.getHouseholdBudgets()])
    if (p.success) setBudgets(p.data || [])
    if (h.success) setHouseholdBudgets(h.data || [])
    setLoading(false)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.createBudget({ ...form, monthlyLimit: parseFloat(form.monthlyLimit), alertAtPercent: parseInt(form.alertAtPercent) })
      toast.success('Budget created! 📊')
      setShowForm(false)
      setForm({ category: 'GROCERIES', monthlyLimit: '', budgetType: 'PERSONAL', alertAtPercent: '80' })
      loadBudgets()
    } catch { toast.error('Failed to create budget') }
  }

  const BudgetCard = ({ budget }: { budget: Budget }) => {
    const pct = Math.min(100, (budget.currentSpent / budget.monthlyLimit) * 100)
    const overBudget = pct >= 100
    const nearLimit = pct >= budget.alertAtPercent
    const barColor = overBudget ? '#f43f5e' : nearLimit ? '#f59e0b' : '#10b981'
    const remaining = Math.max(0, budget.monthlyLimit - budget.currentSpent)

    return (
      <div className="glass-card p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getCategoryIcon(budget.category)}</span>
            <div>
              <div className="font-semibold text-sm capitalize" style={{ color: 'var(--text-primary)' }}>
                {budget.category.replace('_', ' ').toLowerCase()}
              </div>
              <span className={`badge ${budget.budgetType === 'HOUSEHOLD' ? 'badge-brand' : 'badge-muted'}`}>
                {budget.budgetType.toLowerCase()}
              </span>
            </div>
          </div>
          {overBudget && <span className="badge badge-rose">Over Budget!</span>}
        </div>

        <div className="flex justify-between text-sm mb-2">
          <span style={{ color: 'var(--text-muted)' }}>Spent</span>
          <span className="font-semibold" style={{ color: overBudget ? '#f43f5e' : 'var(--text-primary)' }}>
            {formatCurrency(budget.currentSpent)} / {formatCurrency(budget.monthlyLimit)}
          </span>
        </div>

        <div className="progress-bar mb-2">
          <motion.div
            className="progress-fill"
            style={{ background: barColor, width: `${pct}%` }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>

        <div className="flex justify-between text-xs">
          <span style={{ color: 'var(--text-muted)' }}>{pct.toFixed(0)}% used</span>
          <span className="font-semibold text-emerald-400">
            {formatCurrency(remaining)} left
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>Budget Planner</h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {getMonthName(now.getMonth() + 1)} {now.getFullYear()} · Track your spending limits
          </p>
        </div>
        <button id="add-budget-btn" onClick={() => setShowForm(!showForm)} className="btn-primary">
          <Plus size={16} /> New Budget
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <motion.form onSubmit={handleCreate} className="glass-card p-6"
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Create Budget</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Category</label>
              <select id="budget-cat" value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value as ExpenseCategory}))} className="input-field">
                {categories.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Monthly Limit (₹)</label>
              <input id="budget-limit" type="number" value={form.monthlyLimit} onChange={e => setForm(f => ({...f, monthlyLimit: e.target.value}))}
                className="input-field" placeholder="10000" required />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Type</label>
              <select id="budget-type" value={form.budgetType} onChange={e => setForm(f => ({...f, budgetType: e.target.value}))} className="input-field">
                <option value="PERSONAL">Personal</option>
                <option value="HOUSEHOLD">Household</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Alert at %</label>
              <input id="budget-alert" type="number" value={form.alertAtPercent} onChange={e => setForm(f => ({...f, alertAtPercent: e.target.value}))}
                className="input-field" placeholder="80" min="10" max="100" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="btn-ghost flex-1">Cancel</button>
            <button id="budget-submit" type="submit" className="btn-primary flex-1">Create Budget 📊</button>
          </div>
        </motion.form>
      )}

      {/* My Budgets */}
      <div>
        <h3 className="font-display font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>My Budgets</h3>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="skeleton h-36 rounded-2xl" />)}
          </div>
        ) : budgets.length === 0 ? (
          <div className="glass-card py-16 text-center">
            <div className="text-4xl mb-2">📊</div>
            <p style={{ color: 'var(--text-muted)' }}>No personal budgets set</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgets.map((b, i) => (
              <motion.div key={b.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
                <BudgetCard budget={b} />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Household Budgets */}
      {householdBudgets.length > 0 && (
        <div>
          <h3 className="font-display font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Household Budgets</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {householdBudgets.map((b, i) => (
              <motion.div key={b.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
                <BudgetCard budget={b} />
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
