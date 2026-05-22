'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import api from '@/lib/api'
import { formatCurrency } from '@/hooks/useUtils'
import type { HouseholdAnalytics, PersonalAnalytics } from '@/types'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, CartesianGrid } from 'recharts'
import { useAuthStore } from '@/store/authStore'

const COLORS = ['#6366f1','#f59e0b','#10b981','#f43f5e','#06b6d4','#7c3aed','#84cc16','#ec4899','#f97316']

export default function AnalyticsPage() {
  const { user } = useAuthStore()
  const [household, setHousehold] = useState<HouseholdAnalytics | null>(null)
  const [personal, setPersonal] = useState<PersonalAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'personal'|'household'>('personal')

  useEffect(() => {
    Promise.all([
      api.getPersonalAnalytics(),
      user?.isHousehead ? api.getHouseholdAnalytics() : Promise.resolve(null),
    ]).then(([pRes, hRes]) => {
      if (pRes?.success) setPersonal(pRes.data)
      if (hRes?.success) setHousehold(hRes.data)
    }).finally(() => setLoading(false))
  }, [])

  const tooltipStyle = { background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-primary)' }

  const trendData = view === 'household' ? household?.monthlyTrend : personal?.monthlyTrend
  const catData = view === 'household' ? household?.categoryBreakdown : []

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* View Toggle */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>Analytics Dashboard</h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Visual insights into your financial patterns</p>
        </div>
        {user?.isHousehead && (
          <div className="flex gap-2 p-1 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            {['personal','household'].map(v => (
              <button key={v} id={`analytics-${v}`}
                onClick={() => setView(v as any)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${view === v ? 'gradient-brand text-white' : ''}`}
                style={view !== v ? { color: 'var(--text-muted)' } : {}}>
                {v === 'personal' ? '👤 Personal' : '🏠 Household'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {view === 'personal' && personal ? [
          { icon:'📤', label:'This Month', value: formatCurrency(personal.currentMonthSpend), color:'gradient-rose' },
          { icon:'💰', label:'Savings', value: formatCurrency(personal.savings), color: personal.savings >= 0 ? 'gradient-emerald' : 'gradient-rose' },
          { icon:'💳', label:'Wallet', value: formatCurrency(personal.walletBalance), color:'gradient-brand' },
          { icon:'🔄', label:'Pending Reimb.', value: formatCurrency(personal.pendingReimbursements), color:'gradient-gold' },
        ].map((s,i) => (
          <motion.div key={s.label} className="glass-card p-5"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center text-xl mb-3`}>{s.icon}</div>
            <div className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>{s.value}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
          </motion.div>
        )) : household ? [
          { icon:'🏠', label:'Total Income', value: formatCurrency(household.totalMonthlyIncome), color:'gradient-emerald' },
          { icon:'📤', label:'Total Spent', value: formatCurrency(household.currentMonthTotal), color:'gradient-rose' },
          { icon:'💰', label:'Net Savings', value: formatCurrency(household.netSavings), color:'gradient-brand' },
          { icon:'🔄', label:'Pending Reimb.', value: formatCurrency(household.pendingReimbursements), color:'gradient-gold' },
        ].map((s,i) => (
          <motion.div key={s.label} className="glass-card p-5"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center text-xl mb-3`}>{s.icon}</div>
            <div className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>{s.value}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
          </motion.div>
        )) : null}
      </div>

      {/* Monthly Trend */}
      <div className="glass-card p-6">
        <h3 className="font-display font-semibold text-base mb-5" style={{ color: 'var(--text-primary)' }}>
          6-Month Spending Trend
        </h3>
        {loading ? <div className="skeleton h-52" /> : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData || []}>
              <defs>
                <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false}
                tickFormatter={(v: number) => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => [formatCurrency(Number(v)), 'Spent']} contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2.5} fill="url(#grad1)"
                dot={{ r: 5, fill: '#6366f1', strokeWidth: 2, stroke: 'white' }}
                activeDot={{ r: 7, fill: '#6366f1' }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Category + Member row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        {catData && catData.length > 0 && (
          <div className="glass-card p-6">
            <h3 className="font-display font-semibold text-base mb-5" style={{ color: 'var(--text-primary)' }}>
              Category Breakdown
            </h3>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={catData} dataKey="amount" nameKey="category"
                    cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3}>
                    {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => formatCurrency(Number(v))} contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2 max-h-40 overflow-y-auto">
                {catData.map((item, i) => (
                  <div key={item.category} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="capitalize" style={{ color: 'var(--text-secondary)' }}>
                        {item.category.replace('_', ' ').toLowerCase()}
                      </span>
                    </div>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Member Spending Bar */}
        {view === 'household' && (household?.memberSpending?.length ?? 0) > 0 && (
          <div className="glass-card p-6">
            <h3 className="font-display font-semibold text-base mb-5" style={{ color: 'var(--text-primary)' }}>
              Member Spending
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={(household?.memberSpending ?? []).map(m => ({ name: m.name.split(' ')[0], spent: m.spent }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip formatter={(v: any) => formatCurrency(Number(v))} contentStyle={tooltipStyle} />
                <Bar dataKey="spent" fill="#6366f1" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
