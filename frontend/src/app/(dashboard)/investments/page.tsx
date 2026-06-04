'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, Plus, Activity, Briefcase, Landmark, Shield, User } from 'lucide-react'
import api from '@/lib/api'
import { formatCurrency, formatDate } from '@/hooks/useUtils'
import toast from 'react-hot-toast'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface Investment {
  id: number
  name: string
  assetType: 'MUTUAL_FUND' | 'STOCK' | 'FIXED_DEPOSIT' | 'GOLD' | 'REAL_ESTATE' | 'OTHER'
  investedAmount: number
  currentValue: number
  investmentDate: string
  platformOrBroker: string
  owner: { fullName: string }
}

export default function InvestmentsPage() {
  const [investments, setInvestments] = useState<Investment[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  
  const [newInv, setNewInv] = useState({ name: '', assetType: 'MUTUAL_FUND', investedAmount: '', currentValue: '', investmentDate: '', platformOrBroker: '' })

  useEffect(() => { loadInvestments() }, [])

  const loadInvestments = async () => {
    setLoading(true)
    try {
      const res = await api.getInvestments()
      if (res.success) setInvestments(res.data)
    } finally { setLoading(false) }
  }

  const handleCreate = async () => {
    if (!newInv.name || !newInv.investedAmount) return
    try {
      const res = await api.createInvestment({
        ...newInv,
        investedAmount: parseFloat(newInv.investedAmount),
        currentValue: newInv.currentValue ? parseFloat(newInv.currentValue) : parseFloat(newInv.investedAmount)
      })
      if (res.success) {
        setInvestments(prev => [res.data, ...prev])
        setShowNew(false)
        setNewInv({ name: '', assetType: 'MUTUAL_FUND', investedAmount: '', currentValue: '', investmentDate: '', platformOrBroker: '' })
        toast.success('Investment added!')
      }
    } catch { toast.error('Failed to add investment') }
  }

  if (loading) return (
    <div className="max-w-5xl mx-auto space-y-4">
      {[1, 2, 3].map(i => <div key={i} className="skeleton h-32 rounded-2xl" />)}
    </div>
  )

  const totalInvested = investments.reduce((acc, curr) => acc + curr.investedAmount, 0)
  const totalCurrent = investments.reduce((acc, curr) => acc + curr.currentValue, 0)
  const absoluteReturn = totalCurrent - totalInvested
  const percentageReturn = totalInvested > 0 ? (absoluteReturn / totalInvested) * 100 : 0
  const isPositive = absoluteReturn >= 0

  // Mock chart data for aesthetic
  const chartData = [
    { name: 'Jan', val: totalInvested * 0.8 },
    { name: 'Feb', val: totalInvested * 0.85 },
    { name: 'Mar', val: totalInvested * 0.9 },
    { name: 'Apr', val: totalInvested * 0.95 },
    { name: 'May', val: totalInvested },
    { name: 'Jun', val: totalCurrent }
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl gradient-brand flex items-center justify-center shadow-glow-brand">
            <TrendingUp size={24} className="text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>Portfolio Tracker</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Monitor your family's net worth and investments</p>
          </div>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Asset
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Portfolio Summary Card */}
        <div className="lg:col-span-1 glass-card p-6 border border-brand-500/20 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Briefcase size={80} />
          </div>
          <div>
            <h3 className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Current Value</h3>
            <div className="font-display font-bold text-4xl mt-1" style={{ color: 'var(--text-primary)' }}>
              {formatCurrency(totalCurrent)}
            </div>
            
            <div className="mt-6 space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Total Invested</span>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{formatCurrency(totalInvested)}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Total Returns</span>
                <div className="text-right">
                  <span className={`font-semibold block ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isPositive ? '+' : ''}{formatCurrency(absoluteReturn)}
                  </span>
                  <span className={`text-xs ${isPositive ? 'text-emerald-400/80' : 'text-red-400/80'}`}>
                    {isPositive ? '+' : ''}{percentageReturn.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Growth Chart Card */}
        <div className="lg:col-span-2 glass-card p-6 border border-white/5 h-64 flex flex-col">
          <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--text-muted)' }}>Portfolio Growth (6 Months)</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--brand-color)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--brand-color)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                  formatter={(value: any) => formatCurrency(Number(value))}
                />
                <Area type="monotone" dataKey="val" stroke="var(--brand-color)" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showNew && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="glass-card p-5 border border-brand-500/30 space-y-4 overflow-hidden">
            <h3 className="font-semibold text-lg">Add New Investment</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Asset Name</label>
                <input type="text" value={newInv.name} onChange={e => setNewInv(n => ({...n, name: e.target.value}))}
                  className="input-field" placeholder="e.g. HDFC Midcap" />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Asset Type</label>
                <select value={newInv.assetType} onChange={e => setNewInv(n => ({...n, assetType: e.target.value as any}))} className="input-field">
                  <option value="MUTUAL_FUND">Mutual Fund</option>
                  <option value="STOCK">Stock</option>
                  <option value="FIXED_DEPOSIT">Fixed Deposit</option>
                  <option value="GOLD">Gold</option>
                  <option value="REAL_ESTATE">Real Estate</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Platform / Broker</label>
                <input type="text" value={newInv.platformOrBroker} onChange={e => setNewInv(n => ({...n, platformOrBroker: e.target.value}))}
                  className="input-field" placeholder="e.g. Zerodha" />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Invested Amount (₹)</label>
                <input type="number" value={newInv.investedAmount} onChange={e => setNewInv(n => ({...n, investedAmount: e.target.value}))}
                  className="input-field" placeholder="10000" />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Current Value (₹)</label>
                <input type="number" value={newInv.currentValue} onChange={e => setNewInv(n => ({...n, currentValue: e.target.value}))}
                  className="input-field font-bold text-emerald-400" placeholder="Leave empty if same" />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Investment Date</label>
                <input type="date" value={newInv.investmentDate} onChange={e => setNewInv(n => ({...n, investmentDate: e.target.value}))}
                  className="input-field" />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setShowNew(false)} className="btn-ghost">Cancel</button>
              <button onClick={handleCreate} className="btn-primary">Save Asset</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-semibold">Your Assets</h3>
        </div>
        <div className="divide-y divide-white/5">
          {investments.map(inv => {
            const ret = inv.currentValue - inv.investedAmount
            const retPct = inv.investedAmount > 0 ? (ret / inv.investedAmount) * 100 : 0
            const isPos = ret >= 0
            return (
              <div key={inv.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-brand-500/10 flex items-center justify-center">
                    {inv.assetType === 'MUTUAL_FUND' ? <Activity size={20} className="text-brand-400" /> :
                     inv.assetType === 'FIXED_DEPOSIT' ? <Shield size={20} className="text-brand-400" /> :
                     inv.assetType === 'REAL_ESTATE' ? <Landmark size={20} className="text-brand-400" /> :
                     <TrendingUp size={20} className="text-brand-400" />}
                  </div>
                  <div>
                    <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{inv.name}</h4>
                    <div className="flex items-center gap-2 text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      <span className="px-1.5 py-0.5 rounded bg-white/5">{inv.assetType.replace('_', ' ')}</span>
                      {inv.platformOrBroker && <span>• {inv.platformOrBroker}</span>}
                      <span className="flex items-center gap-1"><User size={10}/> {inv.owner?.fullName}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right flex items-center gap-6">
                  <div className="hidden md:block">
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Invested</div>
                    <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{formatCurrency(inv.investedAmount)}</div>
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Current Value</div>
                    <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(inv.currentValue)}</div>
                    <div className={`text-xs ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isPos ? '▲' : '▼'} {formatCurrency(Math.abs(ret))} ({Math.abs(retPct).toFixed(1)}%)
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
          {investments.length === 0 && (
            <div className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              No investments found. Add one to start tracking your portfolio.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
