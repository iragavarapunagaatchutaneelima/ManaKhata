'use client'
 
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Wallet, ArrowUpRight, ArrowDownLeft, Share2, Sparkles } from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, getRoleBadge } from '@/hooks/useUtils'
import type { HouseholdMember } from '@/types'
import toast from 'react-hot-toast'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
 
interface WalletActivity {
  id: string
  type: 'ALLOCATE' | 'RECEIVE' | 'TRANSFER'
  amount: number
  targetMember: string
  date: string
  status: 'SUCCESS' | 'PENDING'
}
 
export default function WalletPage() {
  const { user } = useAuthStore()
  const [members, setMembers] = useState<HouseholdMember[]>([])
  const [personalBalance, setPersonalBalance] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [allocForm, setAllocForm] = useState({ memberId: '', amount: '' })
  const [activities, setActivities] = useState<WalletActivity[]>([
    { id: '1', type: 'ALLOCATE', amount: 5000, targetMember: 'Demo User 2', date: '2026-05-22', status: 'SUCCESS' },
    { id: '2', type: 'ALLOCATE', amount: 3000, targetMember: 'Demo User 3', date: '2026-05-20', status: 'SUCCESS' },
    { id: '3', type: 'ALLOCATE', amount: 2000, targetMember: 'Demo User 4', date: '2026-05-15', status: 'SUCCESS' },
  ])
 
  useEffect(() => {
    fetchData()
  }, [])
 
  async function fetchData() {
    try {
      const res = await api.getHousehold()
      if (res.success) {
        setMembers(res.data.members || [])
        // Find current user's balance
        const currentUserMember = res.data.members?.find((m: any) => m.email?.toLowerCase() === user?.email?.toLowerCase())
        if (currentUserMember) {
          setPersonalBalance(currentUserMember.walletBalance)
        } else {
          setPersonalBalance(user?.walletBalance ?? 0)
        }
      }
    } catch {
      toast.error('Failed to load wallet data')
    } finally {
      setLoading(false)
    }
  }
 
  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!allocForm.memberId || !allocForm.amount) return
 
    const memberId = parseInt(allocForm.memberId)
    const amount = parseFloat(allocForm.amount)
 
    if (personalBalance < amount) {
      toast.error('Insufficient wallet balance to allocate!')
      return
    }
 
    try {
      const res = await api.allocateWallet(memberId, amount)
      if (res.success) {
        toast.success(`₹${amount} allocated successfully!`)
        // Update local list
        setMembers(prev => prev.map(m => {
          if (m.id === memberId) {
            return { ...m, walletBalance: m.walletBalance + amount }
          }
          return m
        }))
        setPersonalBalance(prev => prev - amount)
 
        // Log transaction
        const targetMemberObj = members.find(m => m.id === memberId)
        const targetName = targetMemberObj ? targetMemberObj.fullName : 'Family Member'
        
        setActivities(prev => [
          {
            id: Date.now().toString(),
            type: 'ALLOCATE',
            amount,
            targetMember: targetName,
            date: new Date().toISOString().split('T')[0],
            status: 'SUCCESS'
          },
          ...prev
        ])
        
        setAllocForm({ memberId: '', amount: '' })
      }
    } catch {
      toast.error('Failed to allocate wallet funds')
    }
  }
 
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="skeleton h-48 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="skeleton h-80 rounded-2xl" />
          <div className="skeleton h-80 rounded-2xl" />
        </div>
      </div>
    )
  }
 
  // Recharts Chart Data
  const chartData = members.map(m => ({
    name: m.fullName.split(' ')[0],
    value: m.walletBalance
  })).filter(item => item.value > 0)
 
  const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4']
 
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Personal Balance Card */}
        <motion.div 
          className="relative overflow-hidden rounded-2xl p-6 text-white shadow-glow-brand flex flex-col justify-between h-48"
          style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px]" />
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">Your Balance</span>
              <h2 className="font-display font-bold text-3xl mt-1">{formatCurrency(personalBalance)}</h2>
            </div>
            <div className="p-3 rounded-xl bg-white/10">
              <Wallet size={24} />
            </div>
          </div>
          <div className="relative z-10 flex items-center gap-2 text-xs text-white/80">
            <span className="flex items-center gap-0.5 text-emerald-300 font-semibold">
              <ArrowUpRight size={14} /> Stable
            </span>
            <span>Allocated from Demo Household Treasury</span>
          </div>
        </motion.div>
 
        {/* Total Household Treasury Card */}
        <motion.div 
          className="glass-card p-6 flex flex-col justify-between h-48"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Household Distribution</span>
            <h2 className="font-display font-bold text-3xl mt-1" style={{ color: 'var(--text-primary)' }}>
              {formatCurrency(members.reduce((acc, m) => acc + m.walletBalance, 0))}
            </h2>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div>
              <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{members.length} Members</div>
              <div style={{ color: 'var(--text-muted)' }}>Wallet Holders</div>
            </div>
            <div className="w-px h-8" style={{ background: 'var(--border-color)' }} />
            <div>
              <div className="font-semibold text-emerald-400">
                {formatCurrency(members.reduce((acc, m) => acc + m.walletBalance, 0) / (members.length || 1))}
              </div>
              <div style={{ color: 'var(--text-muted)' }}>Average Balance</div>
            </div>
          </div>
        </motion.div>
 
        {/* Quick Transfer Mock Actions */}
        <motion.div 
          className="glass-card p-6 flex flex-col justify-between h-48"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <button 
              onClick={() => toast.success('Transfer request submitted to Househead (Mocked)')}
              className="flex items-center justify-center gap-1.5 p-3 rounded-xl border border-white/5 bg-white/4 text-xs font-semibold hover:bg-white/8 transition-all"
              style={{ color: 'var(--text-secondary)' }}
            >
              <ArrowDownLeft size={14} className="text-indigo-400" /> Request Funds
            </button>
            <button 
              onClick={() => toast.success('P2P transfer request initiated (Mocked)')}
              className="flex items-center justify-center gap-1.5 p-3 rounded-xl border border-white/5 bg-white/4 text-xs font-semibold hover:bg-white/8 transition-all"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Share2 size={14} className="text-emerald-400" /> Send to Member
            </button>
          </div>
          <p className="text-[10px] text-center" style={{ color: 'var(--text-muted)' }}>P2P features simulate household settlement</p>
        </motion.div>
      </div>
 
      {/* Allocations & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fund Allocation & Member Balances */}
        <div className="space-y-6">
          {/* Member Wallet Balances */}
          <div className="glass-card p-6">
            <h3 className="font-display font-semibold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>
              👥 Family Members&apos; Wallet Balances
            </h3>
            <div className="space-y-3">
              {members.map(member => {
                const badge = getRoleBadge(member.role)
                return (
                  <div key={member.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--bg-primary)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center text-white font-bold text-sm">
                        {member.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {member.fullName}
                          {member.isHousehead && <span className="ml-1 text-gold-500 text-xs">👑</span>}
                        </div>
                        <span className={`badge ${badge.className} text-[9px] px-1.5 py-0.5`}>{badge.label}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-bold text-emerald-400">{formatCurrency(member.walletBalance)}</div>
                      <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Balance</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
 
          {/* Househead Allocation Tool */}
          {user?.isHousehead && (
            <div className="glass-card p-6 border border-brand-500/20 relative overflow-hidden">
              <div className="absolute inset-0 gradient-brand opacity-[0.03]" />
              <div className="relative z-10">
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles size={16} className="text-indigo-400 animate-pulse" />
                  <h3 className="font-display font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
                    Allocate Wallet Funds
                  </h3>
                </div>
                <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                  As the Househead, you can distribute treasury funds directly to other members&apos; wallets.
                </p>
                <form onSubmit={handleAllocate} className="flex flex-col sm:flex-row gap-3">
                  <select 
                    id="alloc-wallet-member" 
                    value={allocForm.memberId} 
                    onChange={e => setAllocForm(f => ({ ...f, memberId: e.target.value }))}
                    className="input-field flex-1" 
                    required
                  >
                    <option value="">Select family member...</option>
                    {members.filter(m => !m.isHousehead).map(m => (
                      <option key={m.id} value={m.id}>{m.fullName}</option>
                    ))}
                  </select>
                  <input 
                    id="alloc-wallet-amount" 
                    type="number" 
                    min="1" 
                    value={allocForm.amount}
                    onChange={e => setAllocForm(f => ({ ...f, amount: e.target.value }))}
                    className="input-field flex-1" 
                    placeholder="Amount (₹)" 
                    required 
                  />
                  <button type="submit" className="btn-primary px-6 whitespace-nowrap">
                    Distribute 💸
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
 
        {/* Wallet Charts & Activity Logs */}
        <div className="space-y-6">
          {/* Treasury Chart */}
          <div className="glass-card p-6">
            <h3 className="font-display font-semibold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>
              📊 Fund Distribution Chart
            </h3>
            {chartData.length > 0 ? (
              <div className="h-44 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ background: 'rgba(10, 15, 30, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      formatter={(val: any) => [`₹${val}`, 'Wallet Balance']}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-44 flex items-center justify-center text-xs" style={{ color: 'var(--text-muted)' }}>
                No wallet funds allocated yet.
              </div>
            )}
          </div>
 
          {/* Recent Wallet Activities */}
          <div className="glass-card p-6">
            <h3 className="font-display font-semibold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>
              📜 Recent Wallet Activity
            </h3>
            <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
              {activities.map(act => (
                <div key={act.id} className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-indigo-400 bg-indigo-500/10">
                      <ArrowUpRight size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                        Allocated to {act.targetMember}
                      </div>
                      <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{act.date}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-indigo-400">-₹{act.amount}</div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold uppercase tracking-wider">
                      {act.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
