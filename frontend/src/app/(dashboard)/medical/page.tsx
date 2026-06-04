'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldAlert, Plus, HeartPulse, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react'
import api from '@/lib/api'
import { formatCurrency, formatDate } from '@/hooks/useUtils'
import toast from 'react-hot-toast'

interface Policy {
  id: number
  provider: string
  policyNumber: string
  policyType: string
  coverageAmount: number
  premiumAmount: number
  expiryDate: string
  owner: { fullName: string }
}

export default function MedicalPage() {
  const [policies, setPolicies] = useState<Policy[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  
  const [newPolicy, setNewPolicy] = useState({ provider: '', policyNumber: '', policyType: 'Family Floater', coverageAmount: '', premiumAmount: '', expiryDate: '' })

  useEffect(() => { loadPolicies() }, [])

  const loadPolicies = async () => {
    setLoading(true)
    try {
      const res = await api.getPolicies()
      if (res.success) setPolicies(res.data)
    } finally { setLoading(false) }
  }

  const handleCreate = async () => {
    if (!newPolicy.provider || !newPolicy.policyNumber || !newPolicy.coverageAmount || !newPolicy.expiryDate) return
    try {
      const res = await api.createPolicy({
        ...newPolicy,
        coverageAmount: parseFloat(newPolicy.coverageAmount),
        premiumAmount: newPolicy.premiumAmount ? parseFloat(newPolicy.premiumAmount) : 0
      })
      if (res.success) {
        setPolicies(prev => [...prev, res.data])
        setShowNew(false)
        setNewPolicy({ provider: '', policyNumber: '', policyType: 'Family Floater', coverageAmount: '', premiumAmount: '', expiryDate: '' })
        toast.success('Policy saved securely!')
      }
    } catch { toast.error('Failed to save policy') }
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto space-y-4">
      {[1, 2].map(i => <div key={i} className="skeleton h-32 rounded-2xl" />)}
    </div>
  )

  const isExpiringSoon = (dateStr: string) => {
    const expiry = new Date(dateStr)
    const today = new Date()
    const diffTime = Math.abs(expiry.getTime() - today.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 30
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
            <HeartPulse size={24} className="text-red-500" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>Medical Vault</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Securely store family insurance policies and medical records</p>
          </div>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Policy
        </button>
      </div>

      <AnimatePresence>
        {showNew && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="glass-card p-5 border border-red-500/30 space-y-4 overflow-hidden">
            <h3 className="font-semibold text-lg">Add Insurance Policy</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Provider / Company</label>
                <input type="text" value={newPolicy.provider} onChange={e => setNewPolicy(n => ({...n, provider: e.target.value}))}
                  className="input-field" placeholder="e.g. Star Health" />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Policy Number</label>
                <input type="text" value={newPolicy.policyNumber} onChange={e => setNewPolicy(n => ({...n, policyNumber: e.target.value}))}
                  className="input-field" placeholder="SH-1234..." />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Policy Type</label>
                <select value={newPolicy.policyType} onChange={e => setNewPolicy(n => ({...n, policyType: e.target.value}))} className="input-field">
                  <option>Family Floater</option>
                  <option>Individual Health</option>
                  <option>Term Life</option>
                  <option>Vehicle Insurance</option>
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Coverage Amount (₹)</label>
                <input type="number" value={newPolicy.coverageAmount} onChange={e => setNewPolicy(n => ({...n, coverageAmount: e.target.value}))}
                  className="input-field font-bold text-emerald-400" placeholder="1000000" />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Annual Premium (₹)</label>
                <input type="number" value={newPolicy.premiumAmount} onChange={e => setNewPolicy(n => ({...n, premiumAmount: e.target.value}))}
                  className="input-field" placeholder="15000" />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Expiry Date</label>
                <input type="date" value={newPolicy.expiryDate} onChange={e => setNewPolicy(n => ({...n, expiryDate: e.target.value}))}
                  className="input-field" />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setShowNew(false)} className="btn-ghost">Cancel</button>
              <button onClick={handleCreate} className="btn-primary bg-red-500 hover:bg-red-600">Save Policy</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {policies.map(policy => {
          const expiringSoon = isExpiringSoon(policy.expiryDate)
          return (
            <motion.div key={policy.id} layout className={`glass-card p-6 border relative overflow-hidden ${expiringSoon ? 'border-red-500/50' : 'border-transparent hover:border-white/5'}`}>
              {expiringSoon && <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider flex items-center gap-1"><AlertTriangle size={12}/> Renew Soon</div>}
              
              <div className="flex justify-between items-start mb-6">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                    <ShieldAlert size={20} className="text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{policy.provider}</h3>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{policy.policyNumber}</p>
                    <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded bg-white/5" style={{ color: 'var(--text-muted)' }}>{policy.policyType}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Coverage</div>
                  <div className="font-semibold text-lg mt-1" style={{ color: 'var(--text-primary)' }}>{formatCurrency(policy.coverageAmount)}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Premium</div>
                  <div className="font-semibold text-lg mt-1" style={{ color: 'var(--text-primary)' }}>{formatCurrency(policy.premiumAmount)}</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm border-t border-white/5 pt-4 mt-2">
                <div style={{ color: 'var(--text-muted)' }}>Holder: <span style={{ color: 'var(--text-primary)' }}>{policy.owner.fullName}</span></div>
                <div className={expiringSoon ? 'text-red-400 font-semibold flex items-center gap-1' : 'text-emerald-400 flex items-center gap-1'}>
                  {expiringSoon ? <AlertTriangle size={14}/> : <CheckCircle2 size={14}/>} Valid till {formatDate(policy.expiryDate)}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {policies.length === 0 && !loading && (
        <div className="text-center py-12 glass-card rounded-2xl border border-red-500/10">
          <FileText size={48} className="mx-auto mb-4 text-red-500/30" />
          <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>No Policies Found</h3>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Store your health and life insurance policies here for quick access during emergencies.
          </p>
        </div>
      )}
    </div>
  )
}
