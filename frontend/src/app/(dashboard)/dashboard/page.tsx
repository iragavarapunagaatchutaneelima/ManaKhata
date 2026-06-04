'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Activity, RefreshCcw, Sparkles, Zap } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'
import { formatCurrency } from '@/hooks/useUtils'
import type { PersonalAnalytics, AiInsight, FinancialHealthScore, Budget } from '@/types'
import HealthScoreRing from '@/components/ui/HealthScoreRing'
import StatCard from '@/components/ui/StatCard'
import RecentExpenses from '@/components/ui/RecentExpenses'
import BudgetMeter from '@/components/ui/BudgetMeter'
import AiInsightsPanel from '@/components/ui/AiInsightsPanel'
import HouseholdDashboard from '@/components/ui/HouseholdDashboard'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [analytics, setAnalytics] = useState<PersonalAnalytics | null>(null)
  const [insights, setInsights] = useState<AiInsight[]>([])
  const [healthScore, setHealthScore] = useState<FinancialHealthScore | null>(null)
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'personal' | 'household'>('personal')

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    setLoading(true)
    try {
      const [analyticsRes, insightsRes, healthRes, budgetsRes] = await Promise.allSettled([
        api.getPersonalAnalytics(),
        api.getAiInsights(),
        api.getHealthScore(),
        api.getMyBudgets(),
      ])

      if (analyticsRes.status === 'fulfilled' && analyticsRes.value.success) {
        setAnalytics(analyticsRes.value.data)
      }
      if (insightsRes.status === 'fulfilled' && insightsRes.value.success) {
        setInsights(insightsRes.value.data)
      }
      if (healthRes.status === 'fulfilled' && healthRes.value.success) {
        setHealthScore(healthRes.value.data)
      }
      if (budgetsRes.status === 'fulfilled' && budgetsRes.value.success) {
        setBudgets(budgetsRes.value.data)
      }
    } finally {
      setLoading(false)
    }
  }

  const savingsColor = (analytics?.savings ?? 0) >= 0 ? 'emerald' : 'rose'

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Welcome Banner */}
      <motion.div
        className="glass-card p-6 md:p-8 relative overflow-hidden reveal-rise"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.14),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(37,99,235,0.13),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.055),transparent)] pointer-events-none" />
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-sky-300/12 blur-2xl pointer-events-none" />
        <div className="absolute right-10 bottom-0 h-28 w-72 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />
        <div className="flow-line" />
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-5">
          <div>
            <div className="badge badge-brand mb-3 border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
              <Sparkles size={12} /> Live household command center
            </div>
            <h2 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>
              Good {getGreeting()}, {user?.fullName?.split(' ')[0]} 👋
            </h2>
            <p style={{ color: 'var(--text-secondary)' }} className="mt-1 text-sm">
              {user?.householdName} · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs text-slate-300">
              <Activity size={15} className="text-emerald-300" />
              Realtime demo stream
            </div>
            {user?.isHousehead && (
              <button onClick={() => setActiveTab(activeTab === 'personal' ? 'household' : 'personal')}
                id="toggle-view"
                className="btn-ghost flex items-center gap-2 text-sm">
                {activeTab === 'personal' ? '🏠 Household View' : '👤 Personal View'}
              </button>
            )}
            <button onClick={loadDashboard} className="btn-ghost p-2" title="Refresh">
              <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10 text-amber-200 shadow-glow-gold">
              <Zap size={17} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Household Dashboard (Househead toggle) */}
      {activeTab === 'household' && user?.isHousehead && (
        <HouseholdDashboard />
      )}

      {activeTab === 'personal' && (
        <>
          {/* Stat Cards Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              id="stat-wallet"
              icon="💳"
              label="Wallet Balance"
              value={formatCurrency(analytics?.walletBalance ?? user?.walletBalance ?? 0)}
              sub={`Available funds`}
              gradient="gradient-brand"
              loading={loading}
              delay={0}
            />
            <StatCard
              id="stat-spent"
              icon="📤"
              label="This Month Spent"
              value={formatCurrency(analytics?.currentMonthSpend ?? 0)}
              sub={`of ${formatCurrency(analytics?.monthlyIncome ?? 0)} income`}
              gradient="gradient-rose"
              loading={loading}
              delay={0.05}
            />
            <StatCard
              id="stat-savings"
              icon="💰"
              label="Monthly Savings"
              value={formatCurrency(analytics?.savings ?? 0)}
              sub={(analytics?.savings ?? 0) >= 0 ? 'Great job! 🎯' : 'Over budget ⚠️'}
              gradient={`gradient-${savingsColor}`}
              loading={loading}
              delay={0.1}
            />
            <StatCard
              id="stat-reimburse"
              icon="🔄"
              label="Pending Reimburse"
              value={formatCurrency(analytics?.pendingReimbursements ?? 0)}
              sub="Awaiting settlement"
              gradient="gradient-gold"
              loading={loading}
              delay={0.15}
            />
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Health Score + Budgets */}
            <div className="space-y-6">
              <HealthScoreRing score={healthScore} loading={loading} />
              <BudgetMeter budgets={budgets} loading={loading} />
            </div>

            {/* Center: Recent Expenses */}
            <div className="lg:col-span-2">
              <RecentExpenses />
            </div>
          </div>

          {/* AI Insights */}
          <AiInsightsPanel insights={insights} loading={loading} />
        </>
      )}
    </div>
  )
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
