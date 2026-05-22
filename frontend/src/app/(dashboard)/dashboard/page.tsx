'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, Calculator, RefreshCcw } from 'lucide-react'
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
        className="glass-card p-6 relative overflow-hidden"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="absolute inset-0 gradient-brand opacity-[0.07] pointer-events-none" />
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-brand-500/10 pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>
              Good {getGreeting()}, {user?.fullName?.split(' ')[0]} 👋
            </h2>
            <p style={{ color: 'var(--text-secondary)' }} className="mt-1 text-sm">
              {user?.householdName} · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
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
