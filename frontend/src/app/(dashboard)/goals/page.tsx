'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, Plus, CheckCircle2, Trophy, Loader2, ArrowRight } from 'lucide-react'
import api from '@/lib/api'
import { formatCurrency, formatDate } from '@/hooks/useUtils'
import toast from 'react-hot-toast'
import ReactConfetti from 'react-confetti'

interface Goal {
  id: number
  name: string
  description: string
  targetAmount: number
  currentAmount: number
  targetDate: string
  contributions: { amount: number; contributor: { fullName: string }; contributionDate: string }[]
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [contributeTo, setContributeTo] = useState<number | null>(null)
  const [newGoal, setNewGoal] = useState({ name: '', description: '', targetAmount: '', targetDate: '' })
  const [contributionAmt, setContributionAmt] = useState('')

  useEffect(() => { loadGoals() }, [])

  const loadGoals = async () => {
    setLoading(true)
    try {
      const res = await api.getGoals()
      if (res.success) setGoals(res.data)
    } finally { setLoading(false) }
  }

  const handleCreate = async () => {
    if (!newGoal.name || !newGoal.targetAmount) return
    try {
      const res = await api.createGoal({
        ...newGoal,
        targetAmount: parseFloat(newGoal.targetAmount)
      })
      if (res.success) {
        setGoals(prev => [...prev, res.data])
        setShowNew(false)
        setNewGoal({ name: '', description: '', targetAmount: '', targetDate: '' })
        toast.success('Goal created! 🎯')
      }
    } catch { toast.error('Failed to create goal') }
  }

  const handleContribute = async (goalId: number, target: number, current: number) => {
    const amt = parseFloat(contributionAmt)
    if (!amt || amt <= 0) return
    try {
      const res = await api.addGoalContribution(goalId, { amount: amt })
      if (res.success) {
        setGoals(prev => prev.map(g => {
          if (g.id === goalId) {
            const updatedAmt = g.currentAmount + amt
            if (updatedAmt >= target && current < target) {
              setShowConfetti(true)
              setTimeout(() => setShowConfetti(false), 5000)
              toast.success(`You reached your goal: ${g.name}! 🎉🎉`, { icon: '🏆' })
            } else {
              toast.success('Contribution added! 💰')
            }
            return { ...g, currentAmount: updatedAmt, contributions: [res.data, ...g.contributions] }
          }
          return g
        }))
        setContributeTo(null)
        setContributionAmt('')
      }
    } catch { toast.error('Failed to add contribution') }
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto space-y-4">
      {[1, 2].map(i => <div key={i} className="skeleton h-48 rounded-2xl" />)}
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative">
      {showConfetti && <div className="fixed inset-0 z-50 pointer-events-none"><ReactConfetti recycle={false} numberOfPieces={500} /></div>}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl gradient-brand flex items-center justify-center shadow-glow-brand">
            <Trophy size={24} className="text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>Shared Goals</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Save together for vacations, gadgets, or emergencies</p>
          </div>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Goal
        </button>
      </div>

      <AnimatePresence>
        {showNew && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="glass-card p-5 border border-brand-500/30 space-y-4 overflow-hidden">
            <h3 className="font-semibold text-lg">Create a Savings Goal</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Goal Name</label>
                <input type="text" value={newGoal.name} onChange={e => setNewGoal(n => ({...n, name: e.target.value}))}
                  className="input-field" placeholder="e.g. Goa Trip" />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Target Amount (₹)</label>
                <input type="number" value={newGoal.targetAmount} onChange={e => setNewGoal(n => ({...n, targetAmount: e.target.value}))}
                  className="input-field font-bold text-emerald-400" placeholder="50000" />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Target Date</label>
                <input type="date" value={newGoal.targetDate} onChange={e => setNewGoal(n => ({...n, targetDate: e.target.value}))}
                  className="input-field" />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Description (Optional)</label>
                <input type="text" value={newGoal.description} onChange={e => setNewGoal(n => ({...n, description: e.target.value}))}
                  className="input-field" placeholder="Brief note..." />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setShowNew(false)} className="btn-ghost">Cancel</button>
              <button onClick={handleCreate} className="btn-primary">Create Goal</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.map(goal => {
          const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
          const isComplete = progress >= 100

          return (
            <motion.div key={goal.id} layout className={`glass-card p-6 border relative overflow-hidden ${isComplete ? 'border-emerald-500/50' : 'border-transparent'}`}
              style={{ borderColor: isComplete ? undefined : 'var(--border-color)' }}>
              
              {isComplete && <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">Goal Reached!</div>}
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>{goal.name}</h3>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{goal.description || 'Savings Goal'}</p>
                </div>
                <div className="text-right">
                  <div className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
                    {formatCurrency(goal.targetAmount)}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Target: {goal.targetDate ? formatDate(goal.targetDate) : 'No date set'}
                  </div>
                </div>
              </div>

              {/* Progress Ring / Bar */}
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm font-semibold">
                  <span className={isComplete ? 'text-emerald-400' : 'text-brand-400'}>
                    {formatCurrency(goal.currentAmount)} saved
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>{progress.toFixed(1)}%</span>
                </div>
                <div className="h-3 rounded-full bg-black/20 overflow-hidden border border-white/5 relative">
                  <motion.div 
                    initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className={`h-full rounded-full ${isComplete ? 'bg-emerald-500' : 'gradient-brand relative'}`}
                  >
                    {!isComplete && <div className="absolute inset-0 bg-white/20 animate-pulse" />}
                  </motion.div>
                </div>
              </div>

              {contributeTo === goal.id ? (
                <div className="flex gap-2">
                  <input autoFocus type="number" value={contributionAmt} onChange={e => setContributionAmt(e.target.value)}
                    className="input-field flex-1 text-sm" placeholder="Amount to add..." />
                  <button onClick={() => handleContribute(goal.id, goal.targetAmount, goal.currentAmount)} className="btn-primary text-sm px-4">Add</button>
                  <button onClick={() => { setContributeTo(null); setContributionAmt('') }} className="btn-ghost text-sm px-3">X</button>
                </div>
              ) : (
                <button 
                  onClick={() => setContributeTo(goal.id)}
                  disabled={isComplete}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                    isComplete ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 border border-brand-500/20'
                  }`}
                >
                  {isComplete ? <><CheckCircle2 size={16} /> Fully Funded</> : <><Plus size={16} /> Add Funds</>}
                </button>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
