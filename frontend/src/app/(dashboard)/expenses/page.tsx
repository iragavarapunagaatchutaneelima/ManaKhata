'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import api from '@/lib/api'
import { formatCurrency, formatDate } from '@/hooks/useUtils'
import type { Expense, ExpensePrediction } from '@/types'
import toast from 'react-hot-toast'
import AddExpenseModal from '@/components/ui/AddExpenseModal'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [predictions, setPredictions] = useState<ExpensePrediction[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  useEffect(() => { loadData() }, [page])

  const loadData = async () => {
    setLoading(true)
    try {
      const [eRes, sRes, pRes] = await Promise.all([
        api.getMyExpenses(page, 15),
        api.getExpenseSummary(),
        api.getPredictions(),
      ])
      if (eRes.success) {
        setExpenses(eRes.data.content || [])
        setTotalPages(eRes.data.totalPages || 0)
      }
      if (sRes.success) setSummary(sRes.data)
      if (pRes.success) setPredictions(pRes.data || [])
    } finally { setLoading(false) }
  }

  const trendIcon = (trend: string) => {
    if (trend === 'UP') return <TrendingUp size={14} className="text-rose-400" />
    if (trend === 'DOWN') return <TrendingDown size={14} className="text-emerald-400" />
    return <Minus size={14} className="text-yellow-400" />
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="glass-card p-5">
            <div className="w-10 h-10 gradient-rose rounded-xl flex items-center justify-center text-xl mb-3">📤</div>
            <div className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
              {formatCurrency(summary.personalTotal ?? summary.total ?? 0)}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>My Spending This Month</div>
          </div>
          {(summary.householdTotal ?? 0) > 0 && (
            <div className="glass-card p-5">
              <div className="w-10 h-10 gradient-brand rounded-xl flex items-center justify-center text-xl mb-3">🏠</div>
              <div className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
                {formatCurrency(summary.householdTotal)}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Household Total</div>
            </div>
          )}
          <div className="glass-card p-5">
            <div className="w-10 h-10 gradient-gold rounded-xl flex items-center justify-center text-xl mb-3">📋</div>
            <div className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
              {expenses.length}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Transactions</div>
          </div>
        </div>
      )}

      {/* Bar Chart */}
      {summary?.categoryBreakdown?.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="font-display font-semibold text-base mb-4" style={{ color: 'var(--text-primary)' }}>
            Category Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={summary.categoryBreakdown.map((r: any) => ({
              category: typeof r === 'object' && !Array.isArray(r) ? r.category : r[0],
              amount:   typeof r === 'object' && !Array.isArray(r) ? r.amount   : r[1],
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.10)" />
              <XAxis dataKey="category" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false}
                tickFormatter={(v: string) => v.slice(0,6)} />
              <YAxis hide />
              <Tooltip formatter={(v: any) => formatCurrency(Number(v))}
                contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-primary)' }} />
              <Bar dataKey="amount" fill="#6366f1" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Predictions */}
      {predictions.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="font-display font-semibold text-base mb-4" style={{ color: 'var(--text-primary)' }}>
            🤖 Next Month Predictions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {predictions.slice(0, 6).map((pred, i) => (
              <div key={pred.category} className="p-3 rounded-xl border"
                style={{ borderColor: 'var(--border-color)', background: 'var(--bg-primary)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium capitalize" style={{ color: 'var(--text-secondary)' }}>
                    {pred.category.replace('_', ' ').toLowerCase()}
                  </span>
                  <div className="flex items-center gap-1">
                    {trendIcon(pred.trend)}
                    <span className={`text-xs font-bold ${pred.trend === 'UP' ? 'text-rose-400' : pred.trend === 'DOWN' ? 'text-emerald-400' : 'text-yellow-400'}`}>
                      {pred.changePercent > 0 ? '+' : ''}{pred.changePercent.toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="font-display font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                  {formatCurrency(pred.predictedAmount)}
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{pred.reason}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expense List */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h3 className="font-display font-semibold" style={{ color: 'var(--text-primary)' }}>All Expenses</h3>
          <button id="add-expense-page-btn" onClick={() => setShowModal(true)} className="btn-primary">
            <Plus size={16} /> Add Expense
          </button>
        </div>

        {loading ? (
          <div className="p-5 space-y-2">{[1,2,3,4].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
        ) : expenses.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-4xl mb-2">🧾</div>
            <p style={{ color: 'var(--text-muted)' }}>No expenses yet</p>
          </div>
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp, i) => (
                  <motion.tr key={exp.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}>
                    <td>
                      <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{exp.description}</div>
                      {exp.paidForHousehold && <span className="badge badge-brand text-[10px]">Household</span>}
                    </td>
                    <td>
                      <span className="text-sm capitalize" style={{ color: 'var(--text-secondary)' }}>
                        {exp.category.replace('_', ' ').toLowerCase()}
                      </span>
                    </td>
                    <td className="text-sm" style={{ color: 'var(--text-muted)' }}>{formatDate(exp.expenseDate)}</td>
                    <td>
                      <span className="badge badge-muted">{exp.expenseType.toLowerCase()}</span>
                    </td>
                    <td className="text-right font-semibold text-rose-500">{formatCurrency(exp.amount)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <button onClick={() => setPage(p => Math.max(0, p-1))} disabled={page === 0} className="btn-ghost disabled:opacity-40">← Prev</button>
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Page {page+1} of {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages-1, p+1))} disabled={page >= totalPages-1} className="btn-ghost disabled:opacity-40">Next →</button>
              </div>
            )}
          </>
        )}
      </div>

      {showModal && (
        <AddExpenseModal onClose={() => setShowModal(false)} onSuccess={() => { setShowModal(false); loadData() }} />
      )}
    </div>
  )
}
