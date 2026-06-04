'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { SplitSquareVertical, ArrowUpRight, ArrowDownLeft, CheckCircle2, Circle } from 'lucide-react'
import api from '@/lib/api'
import { formatCurrency, formatDate } from '@/hooks/useUtils'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

interface ExpenseSplit {
  id: number
  owedBy: { id: number; fullName: string }
  owedTo: { id: number; fullName: string }
  amount: number
  note: string
  isSettled: boolean
  createdAt: string
  expense?: { description: string; category: string }
}

export default function SplitsPage() {
  const { user } = useAuthStore()
  const [splits, setSplits] = useState<ExpenseSplit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadSplits() }, [])

  const loadSplits = async () => {
    setLoading(true)
    try {
      const res = await api.getMySplits()
      if (res.success) setSplits(res.data)
    } finally { setLoading(false) }
  }

  const handleSettle = async (id: number) => {
    try {
      const res = await api.settleSplit(id)
      if (res.success) {
        setSplits(prev => prev.map(s => s.id === id ? { ...s, isSettled: true } : s))
        toast.success('Split settled successfully!')
      }
    } catch { toast.error('Failed to settle split') }
  }

  const iOwe = splits.filter(s => s.owedBy.id === user?.userId && !s.isSettled)
  const owedToMe = splits.filter(s => s.owedTo.id === user?.userId && !s.isSettled)
  const settled = splits.filter(s => s.isSettled)

  const totalIOwe = iOwe.reduce((acc, s) => acc + s.amount, 0)
  const totalOwedToMe = owedToMe.reduce((acc, s) => acc + s.amount, 0)

  if (loading) return (
    <div className="max-w-4xl mx-auto space-y-4">
      {[1, 2, 3].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
    </div>
  )

  const SplitCard = ({ split, type }: { split: ExpenseSplit, type: 'owe' | 'owed' | 'settled' }) => {
    const isOwe = split.owedBy.id === user?.userId
    const otherPerson = isOwe ? split.owedTo : split.owedBy

    return (
      <div className={`p-4 rounded-xl border flex items-center gap-4 transition-all hover:bg-white/5 ${
        split.isSettled ? 'opacity-60' : ''
      }`} style={{ borderColor: 'var(--border-color)', background: 'var(--bg-primary)' }}>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm ${
          type === 'owe' ? 'bg-rose-500/20 text-rose-500' :
          type === 'owed' ? 'bg-emerald-500/20 text-emerald-500' :
          'bg-slate-500/20 text-slate-500'
        }`}>
          {otherPerson.fullName.charAt(0)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              {isOwe ? 'You owe ' : ''}
              {otherPerson.fullName}
              {!isOwe ? ' owes you' : ''}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/50">
              {formatDate(split.createdAt)}
            </span>
          </div>
          <div className="text-sm truncate mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {split.expense?.description || split.note || 'Split'}
          </div>
        </div>

        <div className="text-right">
          <div className={`font-display font-bold ${
            type === 'owe' ? 'text-rose-400' :
            type === 'owed' ? 'text-emerald-400' :
            'text-slate-400'
          }`}>
            {formatCurrency(split.amount)}
          </div>
          {!split.isSettled && (
            <button
              onClick={() => handleSettle(split.id)}
              className="mt-1 flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded border hover:bg-white/10 transition-colors"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
            >
              <Circle size={10} /> Mark Settled
            </button>
          )}
          {split.isSettled && (
            <div className="mt-1 flex items-center justify-end gap-1 text-[10px] font-medium text-emerald-500/50">
              <CheckCircle2 size={12} /> Settled
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl gradient-brand flex items-center justify-center shadow-glow-brand">
          <SplitSquareVertical size={24} className="text-white" />
        </div>
        <div>
          <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>IOUs & Splits</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Track who owes who in the household</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 text-rose-400 mb-2">
            <ArrowUpRight size={18} />
            <span className="text-sm font-semibold uppercase tracking-wider">You Owe</span>
          </div>
          <div className="font-display font-bold text-3xl" style={{ color: 'var(--text-primary)' }}>
            {formatCurrency(totalIOwe)}
          </div>
        </div>
        
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <ArrowDownLeft size={18} />
            <span className="text-sm font-semibold uppercase tracking-wider">Owed To You</span>
          </div>
          <div className="font-display font-bold text-3xl" style={{ color: 'var(--text-primary)' }}>
            {formatCurrency(totalOwedToMe)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h3 className="font-display font-semibold text-rose-400 flex items-center gap-2">
            <ArrowUpRight size={16} /> To Pay
          </h3>
          {iOwe.length === 0 ? (
            <div className="glass-card p-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              You don't owe anyone! 🎉
            </div>
          ) : iOwe.map(s => <SplitCard key={s.id} split={s} type="owe" />)}
        </div>

        <div className="space-y-3">
          <h3 className="font-display font-semibold text-emerald-400 flex items-center gap-2">
            <ArrowDownLeft size={16} /> To Receive
          </h3>
          {owedToMe.length === 0 ? (
            <div className="glass-card p-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              No one owes you money right now.
            </div>
          ) : owedToMe.map(s => <SplitCard key={s.id} split={s} type="owed" />)}
        </div>
      </div>

      {settled.length > 0 && (
        <div className="mt-8">
          <h3 className="font-display font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>Recently Settled</h3>
          <div className="space-y-2">
            {settled.slice(0, 5).map(s => <SplitCard key={s.id} split={s} type="settled" />)}
          </div>
        </div>
      )}
    </div>
  )
}
