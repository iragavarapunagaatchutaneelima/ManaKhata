'use client'

import { motion } from 'framer-motion'
import type { AiInsight } from '@/types'

interface AiInsightsPanelProps {
  insights: AiInsight[]
  loading?: boolean
}

const typeConfig = {
  WARNING:  { bg: 'rgba(244,63,94,0.08)',  border: 'rgba(244,63,94,0.20)',  badge: 'badge-rose',    label: 'Warning' },
  ALERT:    { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.20)', badge: 'badge-gold',    label: 'Alert' },
  TIP:      { bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.20)', badge: 'badge-brand',   label: 'Tip' },
  POSITIVE: { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.20)', badge: 'badge-emerald', label: 'Great' },
}

export default function AiInsightsPanel({ insights, loading }: AiInsightsPanelProps) {
  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="skeleton h-5 w-32 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}
        </div>
      </div>
    )
  }

  if (!insights.length) return null

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🤖</span>
        <h3 className="font-display font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
          AI Financial Insights
        </h3>
        <span className="badge badge-brand">{insights.length} insights</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {insights.map((insight, i) => {
          const config = typeConfig[insight.type] || typeConfig.TIP
          return (
            <motion.div
              key={i}
              className="p-4 rounded-xl border transition-all hover:scale-[1.01]"
              style={{ background: config.bg, borderColor: config.border }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{insight.icon}</span>
                  <span className={`badge ${config.badge}`}>{config.label}</span>
                </div>
              </div>
              <h4 className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                {insight.title}
              </h4>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {insight.message}
              </p>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
