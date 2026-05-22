'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import api from '@/lib/api'
import { formatCurrency } from '@/hooks/useUtils'
import type { HouseholdAnalytics } from '@/types'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#6366f1','#f59e0b','#10b981','#f43f5e','#06b6d4','#7c3aed','#84cc16','#ec4899']

export default function HouseholdDashboard() {
  const [data, setData] = useState<HouseholdAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getHouseholdAnalytics()
      .then(res => { if (res.success) setData(res.data) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1,2,3].map(i => <div key={i} className="skeleton h-48 rounded-2xl" />)}
    </div>
  )

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Household Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: '🏠', label: 'Total Income',     value: formatCurrency(data.totalMonthlyIncome), gradient: 'gradient-emerald' },
          { icon: '📤', label: 'Total Spent',      value: formatCurrency(data.currentMonthTotal),  gradient: 'gradient-rose' },
          { icon: '💰', label: 'Net Savings',      value: formatCurrency(data.netSavings),          gradient: 'gradient-brand' },
          { icon: '🔄', label: 'Pending Reimb.',   value: formatCurrency(data.pendingReimbursements), gradient: 'gradient-gold' },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            className="glass-card p-5 stat-card"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div className={`w-10 h-10 rounded-xl ${item.gradient} flex items-center justify-center text-xl mb-3 shadow-lg`}>
              {item.icon}
            </div>
            <div className="font-display font-bold text-xl mb-0.5" style={{ color: 'var(--text-primary)' }}>
              {item.value}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <div className="glass-card p-6">
          <h3 className="font-display font-semibold text-base mb-4" style={{ color: 'var(--text-primary)' }}>
            Monthly Spending Trend
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data.monthlyTrend}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                formatter={(v: any) => [formatCurrency(Number(v)), 'Spent']}
                contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-primary)' }}
              />
              <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} fill="url(#colorTotal)" dot={{ r: 4, fill: '#6366f1' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown Pie */}
        <div className="glass-card p-6">
          <h3 className="font-display font-semibold text-base mb-4" style={{ color: 'var(--text-primary)' }}>
            Category Breakdown
          </h3>
          {data.categoryBreakdown.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={data.categoryBreakdown} dataKey="amount" nameKey="category"
                    cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3}>
                    {data.categoryBreakdown.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2 max-h-40 overflow-y-auto">
                {data.categoryBreakdown.map((item, i) => (
                  <div key={item.category} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="capitalize" style={{ color: 'var(--text-secondary)' }}>
                        {item.category.replace('_', ' ').toLowerCase()}
                      </span>
                    </div>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>No data this month</p>
          )}
        </div>
      </div>

      {/* Member Spending */}
      <div className="glass-card p-6">
        <h3 className="font-display font-semibold text-base mb-4" style={{ color: 'var(--text-primary)' }}>
          Member Spending This Month
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.memberSpending.map((member, i) => {
            const maxSpent = Math.max(...data.memberSpending.map(m => m.spent))
            const pct = maxSpent > 0 ? (member.spent / maxSpent) * 100 : 0
            return (
              <motion.div
                key={member.memberId}
                className="p-4 rounded-xl border"
                style={{ borderColor: 'var(--border-color)', background: 'var(--bg-primary)' }}
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full gradient-brand flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{member.name}</div>
                    <div className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>{member.role.replace('_', ' ').toLowerCase()}</div>
                  </div>
                </div>
                <div className="flex justify-between text-xs mb-2">
                  <span style={{ color: 'var(--text-muted)' }}>Spent</span>
                  <span className="font-semibold text-rose-400">{formatCurrency(member.spent)}</span>
                </div>
                <div className="progress-bar">
                  <motion.div
                    className="progress-fill gradient-brand"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                  />
                </div>
                <div className="flex justify-between text-xs mt-2">
                  <span style={{ color: 'var(--text-muted)' }}>Wallet</span>
                  <span className="font-semibold text-emerald-400">{formatCurrency(member.walletBalance)}</span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
