'use client'

import { motion } from 'framer-motion'
import type { FinancialHealthScore } from '@/types'

interface HealthScoreRingProps {
  score: FinancialHealthScore | null
  loading?: boolean
}

const getScoreColor = (score: number) => {
  if (score >= 85) return '#10b981'
  if (score >= 70) return '#6366f1'
  if (score >= 55) return '#f59e0b'
  return '#f43f5e'
}

const gradeColors: Record<string, string> = {
  A: '#10b981', B: '#6366f1', C: '#f59e0b', D: '#fb7185', F: '#f43f5e'
}

export default function HealthScoreRing({ score, loading }: HealthScoreRingProps) {
  const r = 52
  const circumference = 2 * Math.PI * r
  const progress = score ? (score.score / 100) * circumference : 0
  const dashOffset = circumference - progress
  const color = score ? getScoreColor(score.score) : '#6366f1'

  if (loading) {
    return (
      <div className="glass-card p-6 h-[280px]">
        <div className="skeleton h-5 w-36 mb-4" />
        <div className="flex items-center justify-center">
          <div className="skeleton rounded-full w-32 h-32" />
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card p-6">
      <h3 className="font-display font-semibold text-base mb-4" style={{ color: 'var(--text-primary)' }}>
        Financial Health Score
      </h3>

      <div className="flex items-center gap-6">
        {/* Ring */}
        <div className="relative flex-shrink-0">
          <svg width="128" height="128" viewBox="0 0 128 128">
            {/* Background track */}
            <circle
              cx="64" cy="64" r={r}
              fill="none"
              stroke="rgba(148,163,184,0.12)"
              strokeWidth="10"
            />
            {/* Progress */}
            <motion.circle
              cx="64" cy="64" r={r}
              fill="none"
              stroke={color}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
              transform="rotate(-90 64 64)"
              style={{ filter: `drop-shadow(0 0 8px ${color}60)` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              className="font-display font-bold text-3xl"
              style={{ color }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              {score?.score ?? '--'}
            </motion.span>
            <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
              Grade {score?.grade ?? '-'}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>
            {score?.status ?? 'Loading...'}
          </div>

          {score && Object.entries(score.breakdown).map(([key, val]) => (
            <div key={key} className="mb-2">
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: 'var(--text-muted)' }}>{key}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{val}</span>
              </div>
              <div className="progress-bar" style={{ height: '4px' }}>
                <motion.div
                  className="progress-fill"
                  style={{ background: color, width: `${val}%` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${val}%` }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Improvements */}
      {(score?.improvements?.length ?? 0) > 0 && (
        <div className="mt-4 space-y-1.5">
          {(score?.improvements ?? []).slice(0, 2).map((tip, i) => (
            <div key={i} className="flex items-start gap-2 text-xs p-2 rounded-lg"
              style={{ background: 'rgba(245,158,11,0.08)', color: 'var(--text-secondary)' }}>
              <span>💡</span>
              <span>{tip}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
