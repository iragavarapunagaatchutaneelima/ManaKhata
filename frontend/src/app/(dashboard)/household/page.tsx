'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, getRoleBadge } from '@/hooks/useUtils'
import type { HouseholdMember } from '@/types'
import toast from 'react-hot-toast'

export default function HouseholdPage() {
  const { user } = useAuthStore()
  const [members, setMembers] = useState<HouseholdMember[]>([])
  const [household, setHousehold] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [allocForm, setAllocForm] = useState({ memberId: '', amount: '' })

  useEffect(() => {
    api.getHousehold().then(res => {
      if (res.success) {
        setHousehold(res.data.household)
        setMembers(res.data.members || [])
      }
    }).finally(() => setLoading(false))
  }, [])

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.allocateWallet(parseInt(allocForm.memberId), parseFloat(allocForm.amount))
      toast.success(`₹${allocForm.amount} allocated!`)
      setAllocForm({ memberId: '', amount: '' })
    } catch { toast.error('Failed to allocate') }
  }

  const handlePermission = async (memberId: number, key: string, value: boolean) => {
    try {
      await api.updatePermissions(memberId, { [key]: value })
      toast.success('Permission updated')
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, [key]: value } : m))
    } catch { toast.error('Failed to update') }
  }

  if (loading) return (
    <div className="max-w-5xl mx-auto space-y-6">
      {[1,2,3].map(i => <div key={i} className="skeleton h-32 rounded-2xl" />)}
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Household Header */}
      {household && (
        <motion.div className="glass-card p-6 relative overflow-hidden"
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="absolute inset-0 gradient-brand opacity-[0.06]" />
          <div className="relative z-10 flex items-start justify-between flex-wrap gap-4">
            <div>
              <h2 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>
                🏠 {household.name}
              </h2>
              {household.address && (
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>📍 {household.address}, {household.city}</p>
              )}
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                {members.length} members · ₹ {household.currency}
              </p>
            </div>
            <div className="px-4 py-3 rounded-xl text-center" style={{ background: 'rgba(99,102,241,0.10)', border: '1px solid rgba(99,102,241,0.20)' }}>
              <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                Invite Code
              </div>
              <div className="font-mono font-bold text-xl tracking-widest text-brand-400">
                {household.inviteCode}
              </div>
              <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>Share with family</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Members Grid */}
      <div>
        <h3 className="font-display font-semibold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>
          Family Members ({members.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member, i) => {
            const badge = getRoleBadge(member.role)
            return (
              <motion.div key={member.id} className="glass-card p-5"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}>
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl gradient-brand flex items-center justify-center text-white font-bold text-lg">
                    {member.fullName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-semibold text-base truncate" style={{ color: 'var(--text-primary)' }}>
                      {member.fullName}
                      {member.isHousehead && <span className="ml-1 text-gold-500">👑</span>}
                    </div>
                    <span className={`badge ${badge.className}`}>{badge.label}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="p-2 rounded-xl text-center" style={{ background: 'var(--bg-primary)' }}>
                    <div className="font-bold text-sm text-emerald-400">{formatCurrency(member.walletBalance)}</div>
                    <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Wallet</div>
                  </div>
                  {member.monthlyIncome && member.monthlyIncome > 0 ? (
                    <div className="p-2 rounded-xl text-center" style={{ background: 'var(--bg-primary)' }}>
                      <div className="font-bold text-sm text-brand-400">{formatCurrency(member.monthlyIncome)}</div>
                      <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Income</div>
                    </div>
                  ) : (
                    <div className="p-2 rounded-xl text-center" style={{ background: 'var(--bg-primary)' }}>
                      <div className="font-bold text-sm" style={{ color: 'var(--text-muted)' }}>—</div>
                      <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Income</div>
                    </div>
                  )}
                </div>

                {member.phone && (
                  <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>📱 {member.phone}</p>
                )}

                {/* Permission toggles (househead only, non-self) */}
                {user?.isHousehead && !member.isHousehead && (
                  <div className="space-y-1.5 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Permissions</p>
                    {[
                      { key: 'canViewHousehold', label: 'View Household' },
                      { key: 'canViewAnalytics', label: 'View Analytics' },
                      { key: 'canManageExpenses', label: 'Manage Expenses' },
                    ].map(perm => (
                      <label key={perm.key} className="flex items-center justify-between cursor-pointer">
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{perm.label}</span>
                        <button
                          id={`perm-${member.id}-${perm.key}`}
                          onClick={() => handlePermission(member.id, perm.key, !(member as any)[perm.key])}
                          className={`w-8 h-4.5 rounded-full transition-all relative ${(member as any)[perm.key] ? 'bg-brand-500' : 'bg-gray-600'}`}
                          style={{ width: '32px', height: '18px', position: 'relative' }}
                        >
                          <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${(member as any)[perm.key] ? 'left-[14px]' : 'left-0.5'}`} />
                        </button>
                      </label>
                    ))}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Wallet Allocation (Househead) */}
      {user?.isHousehead && (
        <div className="glass-card p-6">
          <h3 className="font-display font-semibold text-base mb-4" style={{ color: 'var(--text-primary)' }}>
            💳 Allocate Wallet Funds
          </h3>
          <form onSubmit={handleAllocate} className="flex flex-wrap gap-3">
            <select id="alloc-member" value={allocForm.memberId} onChange={e => setAllocForm(f => ({...f, memberId: e.target.value}))}
              className="input-field flex-1 min-w-40" required>
              <option value="">Select member...</option>
              {members.filter(m => !m.isHousehead).map(m => (
                <option key={m.id} value={m.id}>{m.fullName}</option>
              ))}
            </select>
            <input id="alloc-amount" type="number" min="1" value={allocForm.amount}
              onChange={e => setAllocForm(f => ({...f, amount: e.target.value}))}
              className="input-field flex-1 min-w-32" placeholder="Amount (₹)" required />
            <button id="alloc-submit" type="submit" className="btn-primary px-6">Allocate 💸</button>
          </form>
        </div>
      )}
    </div>
  )
}
