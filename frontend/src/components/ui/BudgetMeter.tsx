'use client'

import { motion } from 'framer-motion'
import type { Budget } from '@/types'
import { useCategoryIcon } from '@/hooks/useUtils'

interface BudgetMeterProps {
  budgets: Budget[]
  loading?: boolean
}

export default function BudgetMeter({ budgets, loading }: BudgetMeterProps) {
  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="skeleton h-5 w-28 mb-4" />
        {[1,2,3].map(i => <div key={i} className="skeleton h-12 mb-3 rounded-xl" />)}
      </div>
    )
  }

  return (
    <div className="glass-card p-6">
      <h3 className="font-display font-semibold text-base mb-4" style={{ color: 'var(--text-primary)' }}>
        Budget Status
      </h3>

      {budgets.length === 0 && (
        <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>
          No budgets set. <a href="/budget" className="text-brand-500 hover:underline">Create one →</a>
        </p>
      )}

      <div className="space-y-4">
        {budgets.slice(0, 5).map((budget, i) => {
          const pct = Math.min(100, (budget.currentSpent / budget.monthlyLimit) * 100)
          const overBudget = pct >= 100
          const nearLimit = pct >= budget.alertAtPercent
          const barColor = overBudget ? '#f43f5e' : nearLimit ? '#f59e0b' : '#10b981'

          return (
            <motion.div
              key={budget.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span>{useCategoryIcon(budget.category)}</span>
                  <span className="text-sm font-medium capitalize" style={{ color: 'var(--text-primary)' }}>
                    {budget.category.replace('_', ' ').toLowerCase()}
                  </span>
                  {overBudget && <span className="badge badge-rose">Over</span>}
                  {nearLimit && !overBudget && <span className="badge badge-gold">Near</span>}
                </div>
                <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  ₹{budget.currentSpent.toLocaleString('en-IN')} / ₹{budget.monthlyLimit.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="progress-bar">
                <motion.div
                  className="progress-fill"
                  style={{ background: barColor, width: `${pct}%` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                />
              </div>
              <div className="text-right text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {pct.toFixed(0)}% used
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
