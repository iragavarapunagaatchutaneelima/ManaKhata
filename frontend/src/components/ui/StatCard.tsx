'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'

interface StatCardProps {
  id?: string
  icon: string
  label: string
  value: string
  sub: string
  gradient: string
  loading?: boolean
  delay?: number
}

const StatCard = memo(function StatCard({ id, icon, label, value, sub, gradient, loading, delay = 0 }: StatCardProps) {
  if (loading) {
    return (
      <div className="glass-card p-5 h-32">
        <div className="skeleton h-4 w-20 mb-3" />
        <div className="skeleton h-8 w-28 mb-2" />
        <div className="skeleton h-3 w-16" />
      </div>
    )
  }

  return (
    <motion.div
      id={id}
      className="glass-card p-5 stat-card overflow-hidden cursor-default"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -6, scale: 1.018, rotateX: 1.5 }}
    >
      <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${gradient} flex items-center justify-center text-xl shadow-lg ring-1 ring-white/20`}>
          {icon}
        </div>
      </div>
      <div className="font-display font-bold text-2xl mb-0.5 truncate" style={{ color: 'var(--text-primary)' }}>
        {value}
      </div>
      <div className="text-xs font-semibold mb-0.5" style={{ color: 'var(--text-muted)' }}>
        {label}
      </div>
      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
        {sub}
      </div>
    </motion.div>
  )
})

export default StatCard
