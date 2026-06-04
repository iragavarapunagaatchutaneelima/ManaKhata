'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Star, Medal, Award, Crown, Zap } from 'lucide-react'
import api from '@/lib/api'

interface Badge {
  id: number
  name: string
  description: string
  icon: string
  earnedDate: string
}

export default function AchievementsPage() {
  const [badges, setBadges] = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadBadges() }, [])

  const loadBadges = async () => {
    setLoading(true)
    try {
      const res = await api.getBadges()
      if (res.success) setBadges(res.data)
    } finally { setLoading(false) }
  }

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Trophy': return <Trophy size={32} className="text-yellow-400" />
      case 'Star': return <Star size={32} className="text-yellow-400" />
      case 'Medal': return <Medal size={32} className="text-emerald-400" />
      case 'Crown': return <Crown size={32} className="text-purple-400" />
      case 'Zap': return <Zap size={32} className="text-blue-400" />
      default: return <Award size={32} className="text-brand-400" />
    }
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-32 rounded-2xl" />)}
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
            <Trophy size={24} className="text-yellow-500" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>Your Achievements</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Badges earned for great financial habits and chore completion!</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {badges.map((badge, idx) => (
          <motion.div 
            key={badge.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass-card p-6 border border-brand-500/20 flex flex-col items-center text-center relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-brand-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-16 h-16 rounded-full bg-black/40 flex items-center justify-center mb-4 shadow-glow-brand relative z-10">
              {getIcon(badge.icon)}
            </div>
            <h3 className="font-bold text-sm mb-1 relative z-10" style={{ color: 'var(--text-primary)' }}>{badge.name}</h3>
            <p className="text-[10px] relative z-10" style={{ color: 'var(--text-muted)' }}>{badge.description}</p>
          </motion.div>
        ))}
      </div>

      {badges.length === 0 && (
        <div className="text-center py-12 glass-card rounded-2xl border border-white/5">
          <Award size={48} className="mx-auto mb-4 text-white/20" />
          <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>No badges yet</h3>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Complete goals and chores to earn badges!</p>
        </div>
      )}
    </div>
  )
}
