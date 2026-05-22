'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Check, Clock, X, RefreshCcw } from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, formatDate, getReimbursementStatusBadge } from '@/hooks/useUtils'
import type { Reimbursement } from '@/types'
import toast from 'react-hot-toast'

export default function ReimbursementsPage() {
  const { user } = useAuthStore()
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'mine'>('all')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ amount: '', description: '', category: '', notes: '', paidDate: new Date().toISOString().split('T')[0] })

  useEffect(() => { loadData() }, [filter])

  const loadData = async () => {
    setLoading(true)
    try {
      const [r, s] = await Promise.all([
        api.getReimbursements(filter === 'mine' ? 'mine' : undefined),
        api.getReimbursementSummary(),
      ])
      if (r.success) setReimbursements(r.data.content || [])
      if (s.success) setSummary(s.data)
    } finally { setLoading(false) }
  }

  const handleAction = async (id: number, action: 'approve' | 'settle' | 'reject') => {
    try {
      if (action === 'approve') await api.approveReimbursement(id)
      else if (action === 'settle') await api.settleReimbursement(id)
      else await api.rejectReimbursement(id)
      toast.success(`Reimbursement ${action}d!`)
      loadData()
    } catch { toast.error(`Failed to ${action}`) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.createReimbursement({ ...form, amount: parseFloat(form.amount) })
      toast.success('Reimbursement request submitted! 🔄')
      setShowForm(false)
      setForm({ amount: '', description: '', category: '', notes: '', paidDate: new Date().toISOString().split('T')[0] })
      loadData()
    } catch { toast.error('Failed to submit') }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: '⏳', label: 'Pending (Household)', value: formatCurrency(summary.totalPendingHousehold), color: 'gradient-gold' },
            { icon: '👤', label: 'Owed to Me', value: formatCurrency(summary.totalPendingByMe), color: 'gradient-brand' },
            { icon: '📋', label: 'Pending Count', value: summary.pendingCount, color: 'gradient-rose' },
          ].map((s, i) => (
            <motion.div key={s.label} className="glass-card p-5"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center text-xl mb-3`}>{s.icon}</div>
              <div className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>{s.value}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          {['all', 'mine'].map(f => (
            <button key={f} onClick={() => setFilter(f as any)}
              className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${filter === f ? 'gradient-brand text-white shadow' : 'btn-ghost'}`}>
              {f === 'all' ? '🏠 All' : '👤 Mine'}
            </button>
          ))}
        </div>
        <button id="add-reimb-btn" onClick={() => setShowForm(!showForm)} className="btn-primary">
          <Plus size={16} /> New Request
        </button>
      </div>

      {/* Quick Form */}
      {showForm && (
        <motion.form onSubmit={handleSubmit}
          className="glass-card p-6"
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className="font-display font-semibold text-base mb-4" style={{ color: 'var(--text-primary)' }}>
            New Reimbursement Request
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Amount (₹)</label>
              <input id="reimb-amount" type="number" value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))}
                className="input-field" placeholder="2500" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Category</label>
              <input id="reimb-category" type="text" value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}
                className="input-field" placeholder="e.g. AC Repair" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Description</label>
              <input id="reimb-desc" type="text" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))}
                className="input-field" placeholder="What did you pay for?" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Date Paid</label>
              <input type="date" value={form.paidDate} onChange={e => setForm(f => ({...f, paidDate: e.target.value}))}
                className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Notes (optional)</label>
              <input type="text" value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))}
                className="input-field" placeholder="Any additional context" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="btn-ghost flex-1">Cancel</button>
            <button id="reimb-submit" type="submit" className="btn-primary flex-1">Submit Request 🔄</button>
          </div>
        </motion.form>
      )}

      {/* Reimbursements List */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h3 className="font-display font-semibold" style={{ color: 'var(--text-primary)' }}>
            Reimbursement Requests
          </h3>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">
            {[1,2,3].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
          </div>
        ) : reimbursements.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-4xl mb-2">🔄</div>
            <p style={{ color: 'var(--text-muted)' }}>No reimbursements found</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
            {reimbursements.map((r, i) => {
              const badge = getReimbursementStatusBadge(r.status)
              return (
                <motion.div key={r.id}
                  className="flex items-center gap-4 p-4 hover:bg-brand-500/4 transition-colors"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {r.payer?.fullName?.charAt(0)}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>{r.description}</div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.payer?.fullName}</span>
                      {r.category && <span className="text-xs badge badge-muted">{r.category}</span>}
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(r.paidDate)}</span>
                    </div>
                  </div>
                  {/* Amount + Status */}
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{formatCurrency(r.amount)}</div>
                    <span className={`badge ${badge.className}`}>{badge.label}</span>
                  </div>
                  {/* Actions (househead) */}
                  {user?.isHousehead && r.status === 'PENDING' && (
                    <div className="flex gap-1 flex-shrink-0">
                      <button id={`approve-${r.id}`} onClick={() => handleAction(r.id, 'approve')}
                        className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors" title="Approve">
                        <Check size={14} />
                      </button>
                      <button id={`reject-${r.id}`} onClick={() => handleAction(r.id, 'reject')}
                        className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors" title="Reject">
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  {user?.isHousehead && r.status === 'APPROVED' && (
                    <button id={`settle-${r.id}`} onClick={() => handleAction(r.id, 'settle')}
                      className="p-2 rounded-lg bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 transition-colors flex-shrink-0" title="Settle">
                      <RefreshCcw size={14} />
                    </button>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
