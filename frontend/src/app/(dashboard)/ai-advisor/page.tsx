'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import api from '@/lib/api'
import { formatCurrency } from '@/hooks/useUtils'
import type { InvestmentAdvice, FinancialHealthScore, AiInsight, ExpensePrediction } from '@/types'
import HealthScoreRing from '@/components/ui/HealthScoreRing'
import AiInsightsPanel from '@/components/ui/AiInsightsPanel'

const riskColors: Record<string, string> = {
  'Conservative':    'gradient-emerald',
  'Moderate':        'gradient-brand',
  'Balanced':        'gradient-brand',
  'Moderate-High':   'gradient-gold',
  'Aggressive':      'gradient-rose',
}
const riskLevelColor: Record<string, string> = {
  'VERY_LOW': 'badge-emerald',
  'LOW':      'badge-emerald',
  'MEDIUM':   'badge-gold',
  'HIGH':     'badge-rose',
  'VERY_HIGH':'badge-rose',
}

/** Normalize risk level string to badge class — handles 'Low', 'LOW', 'low' etc. */
function getRiskBadge(riskLevel: string): string {
  return riskLevelColor[riskLevel?.toUpperCase?.() ?? ''] || 'badge-muted'
}

export default function AiAdvisorPage() {
  const [advice, setAdvice] = useState<InvestmentAdvice | null>(null)
  const [health, setHealth] = useState<FinancialHealthScore | null>(null)
  const [insights, setInsights] = useState<AiInsight[]>([])
  const [predictions, setPredictions] = useState<ExpensePrediction[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview'|'investments'|'predictions'|'insights'>('overview')

  useEffect(() => {
    Promise.allSettled([
      api.getInvestmentAdvice(),
      api.getHealthScore(),
      api.getAiInsights(),
      api.getPredictions(),
    ]).then(([aRes, hRes, iRes, pRes]) => {
      if (aRes.status === 'fulfilled' && aRes.value.success) setAdvice(aRes.value.data)
      if (hRes.status === 'fulfilled' && hRes.value.success) setHealth(hRes.value.data)
      if (iRes.status === 'fulfilled' && iRes.value.success) setInsights(iRes.value.data)
      if (pRes.status === 'fulfilled' && pRes.value.success) setPredictions(pRes.value.data)
    }).finally(() => setLoading(false))
  }, [])

  const tabs = [
    { id: 'overview',     label: '📊 Overview' },
    { id: 'investments',  label: '📈 Investments' },
    { id: 'predictions',  label: '🔮 Predictions' },
    { id: 'insights',     label: '💡 Insights' },
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="glass-card p-6 relative overflow-hidden">
        <div className="absolute inset-0 gradient-brand opacity-[0.07]" />
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-purple-500/15" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🤖</span>
            <div>
              <h2 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>AI Financial Advisor</h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Personalized insights powered by behavioral analysis</p>
            </div>
          </div>
          {advice && (
            <div className="flex items-center gap-4 mt-4 flex-wrap">
              <div className="px-4 py-2 rounded-xl" style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Monthly Surplus</span>
                <div className="font-display font-bold text-lg text-emerald-400">{formatCurrency(advice.monthlySurplus)}</div>
              </div>
              <div className="px-4 py-2 rounded-xl" style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)' }}>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Invest Monthly</span>
                <div className="font-display font-bold text-lg text-brand-400">{formatCurrency(advice.recommendedInvestment)}</div>
              </div>
              <div className="px-4 py-2 rounded-xl" style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Risk Profile</span>
                <div className="font-display font-bold text-lg text-gold-500">{advice.riskProfile}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(tab => (
          <button key={tab.id} id={`tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.id ? 'gradient-brand text-white shadow' : 'btn-ghost'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <HealthScoreRing score={health} loading={loading} />
          {/* Allocation Pie */}
          {advice?.allocation && (
            <div className="glass-card p-6">
              <h3 className="font-display font-semibold text-base mb-4" style={{ color: 'var(--text-primary)' }}>
                Recommended Allocation
              </h3>
              <div className="space-y-3">
                {Object.entries(advice.allocation).map(([key, val], i) => {
                  const colors = ['#6366f1','#10b981','#f59e0b','#06b6d4']
                  return (
                    <div key={key}>
                      <div className="flex justify-between text-sm mb-1">
                        <span style={{ color: 'var(--text-secondary)' }}>{key}</span>
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{val}%</span>
                      </div>
                      <div className="progress-bar">
                        <motion.div
                          className="progress-fill"
                          style={{ background: colors[i % colors.length], width: `${val}%` }}
                          initial={{ width: 0 }}
                          animate={{ width: `${val}%` }}
                          transition={{ duration: 0.8, delay: i * 0.1 }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
              {(health?.strengths?.length ?? 0) > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>✅ Strengths</h4>
                  {(health?.strengths ?? []).map((s, i) => (
                    <p key={i} className="text-xs py-1.5" style={{ color: 'var(--text-muted)' }}>• {s}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'investments' && advice && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {advice.recommendations.map((opt, i) => (
            <motion.div key={opt.name} className="glass-card p-5"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}>
              <div className="flex items-start justify-between mb-3">
                <div className="text-3xl">{opt.icon}</div>
              <span className={`badge ${getRiskBadge(opt.riskLevel)}`}>
                  {opt.riskLevel.replace('_', ' ')}
                </span>
              </div>
              <h4 className="font-display font-semibold text-base mb-1" style={{ color: 'var(--text-primary)' }}>{opt.name}</h4>
              <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{opt.description}</p>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Suggested Monthly</div>
                  <div className="font-bold text-emerald-400">{formatCurrency(opt.suggestedAmount)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Expected Return</div>
                  <div className="font-semibold text-xs" style={{ color: 'var(--text-secondary)' }}>{opt.expectedReturn}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {activeTab === 'predictions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {predictions.map((pred, i) => (
            <motion.div key={pred.category} className="glass-card p-4"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>
                  {pred.category.replace('_', ' ').toLowerCase()}
                </span>
                <span className={`text-xs font-bold ${pred.trend === 'UP' ? 'text-rose-400' : pred.trend === 'DOWN' ? 'text-emerald-400' : 'text-yellow-400'}`}>
                  {pred.trend === 'UP' ? '↑' : pred.trend === 'DOWN' ? '↓' : '→'} {pred.changePercent > 0 ? '+' : ''}{pred.changePercent.toFixed(0)}%
                </span>
              </div>
              <div className="font-display font-bold text-2xl mb-1" style={{ color: 'var(--text-primary)' }}>
                {formatCurrency(pred.predictedAmount)}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Last: {formatCurrency(pred.lastMonthAmount)} · {pred.reason}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {activeTab === 'insights' && (
        <AiInsightsPanel insights={insights} loading={loading} />
      )}
    </div>
  )
}
