'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Camera, Scan, Users, SplitSquareVertical, Loader2, CheckCircle2 } from 'lucide-react'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import type { ExpenseCategory, ExpenseType, HouseholdMember } from '@/types'
import { useAuthStore } from '@/store/authStore'

const categories: ExpenseCategory[] = [
  'FOOD','GROCERIES','PETROL','TRAVEL','RENT','ELECTRICITY','INTERNET',
  'MEDICAL','SHOPPING','EDUCATION','ENTERTAINMENT','INVESTMENT','SAVINGS',
  'REPAIRS','MAINTENANCE','EMERGENCY','VEHICLE','UTILITIES','OTHER'
]

const categoryIcons: Partial<Record<ExpenseCategory, string>> = {
  FOOD:'🍽️', GROCERIES:'🛒', PETROL:'⛽', TRAVEL:'✈️', RENT:'🏠',
  ELECTRICITY:'⚡', INTERNET:'🌐', MEDICAL:'🏥', SHOPPING:'🛍️',
  EDUCATION:'📚', ENTERTAINMENT:'🎬', INVESTMENT:'📈', SAVINGS:'💰',
  REPAIRS:'🔧', MAINTENANCE:'⚙️', EMERGENCY:'🚨', VEHICLE:'🚗',
  UTILITIES:'💡', OTHER:'📦',
}

interface SplitEntry {
  memberId: number
  memberName: string
  amount: string
}

interface Props {
  onClose: () => void
  onSuccess: () => void
  prefill?: Partial<{
    amount: string
    description: string
    category: ExpenseCategory
  }>
}

export default function AddExpenseModal({ onClose, onSuccess, prefill }: Props) {
  const { user } = useAuthStore()
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    amount: prefill?.amount || '',
    description: prefill?.description || '',
    category: (prefill?.category || 'FOOD') as ExpenseCategory,
    expenseType: 'VARIABLE' as ExpenseType,
    expenseDate: new Date().toISOString().split('T')[0],
    notes: '',
    paidForHousehold: false,
    isReimbursable: false,
  })
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'form' | 'split'>('form')
  const [scanning, setScanning] = useState(false)
  const [scannedPreview, setScannedPreview] = useState<string | null>(null)
  const [members, setMembers] = useState<HouseholdMember[]>([])
  const [splits, setSplits] = useState<SplitEntry[]>([])
  const [splitMode, setSplitMode] = useState<'equal' | 'custom'>('equal')
  const [membersLoaded, setMembersLoaded] = useState(false)

  const update = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleScanReceipt = async (file: File) => {
    setScanning(true)
    const reader = new FileReader()
    reader.onload = () => setScannedPreview(reader.result as string)
    reader.readAsDataURL(file)

    // Simulate AI OCR parsing (in production, POST to /api/ocr/scan)
    await new Promise(r => setTimeout(r, 1800))
    
    // Mock parsed result — replace with real API call in production
    const mockResults = [
      { amount: '2450', description: 'Monthly groceries - DMart', category: 'GROCERIES' as ExpenseCategory },
      { amount: '850',  description: 'Zomato food order',         category: 'FOOD'       as ExpenseCategory },
      { amount: '3200', description: 'Electricity bill payment',  category: 'ELECTRICITY' as ExpenseCategory },
    ]
    const result = mockResults[Math.floor(Math.random() * mockResults.length)]
    
    setForm(f => ({ ...f, amount: result.amount, description: result.description, category: result.category }))
    setScanning(false)
    toast.success('Receipt scanned! 🎯 Review and confirm.')
  }

  const loadMembers = async () => {
    if (membersLoaded) return
    try {
      const res = await api.getHousehold()
      if (res.success) {
        const all = (res.data.members || []).filter((m: HouseholdMember) => m.id !== user?.userId)
        setMembers(all)
        // default equal split
        const amt = parseFloat(form.amount) || 0
        const perPerson = all.length > 0 ? (amt / (all.length + 1)).toFixed(2) : '0'
        setSplits(all.map((m: HouseholdMember) => ({ memberId: m.id, memberName: m.fullName, amount: perPerson })))
        setMembersLoaded(true)
      }
    } catch { /* ignore */ }
  }

  const handleTabSwitch = async (t: 'form' | 'split') => {
    setTab(t)
    if (t === 'split') await loadMembers()
  }

  const recalcEqualSplit = (newAmount: string) => {
    update('amount', newAmount)
    if (splitMode === 'equal' && members.length > 0) {
      const amt = parseFloat(newAmount) || 0
      const perPerson = (amt / (members.length + 1)).toFixed(2)
      setSplits(s => s.map(sp => ({ ...sp, amount: perPerson })))
    }
  }

  const splitTotal = splits.reduce((acc, s) => acc + (parseFloat(s.amount) || 0), 0)
  const myShare = (parseFloat(form.amount) || 0) - splitTotal

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.createExpense({
        ...form,
        amount: parseFloat(form.amount),
      })
      
      // If splits exist, create them
      if (tab === 'split' && splits.length > 0 && res.success) {
        const expenseId = res.data?.id
        await Promise.all(
          splits
            .filter(s => parseFloat(s.amount) > 0)
            .map(s => api.createExpenseSplit({
              expenseId,
              owedByUserId: s.memberId,
              amount: parseFloat(s.amount),
              note: `Split for: ${form.description}`,
            }))
        )
      }

      toast.success('Expense added! 💸')
      onSuccess()
    } catch (err: any) {
      toast.error(err.message || 'Failed to add expense')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          className="glass-card w-full max-w-lg"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
          initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 pb-0">
            <h2 className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
              Add Expense
            </h2>
            <div className="flex items-center gap-2">
              {/* OCR Scan button */}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={scanning}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-brand-500/30 bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 transition-all disabled:opacity-50"
              >
                {scanning ? <Loader2 size={13} className="animate-spin" /> : <Scan size={13} />}
                {scanning ? 'Scanning…' : 'Scan Receipt'}
              </button>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
                onChange={e => e.target.files?.[0] && handleScanReceipt(e.target.files[0])} />
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-red-500/10 transition-colors">
                <X size={18} style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>
          </div>

          {/* Scanned Preview strip */}
          <AnimatePresence>
            {scannedPreview && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                className="mx-5 mt-3 rounded-xl overflow-hidden border border-emerald-500/30 relative"
              >
                <img src={scannedPreview} alt="Receipt" className="w-full h-20 object-cover opacity-60" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
                    <CheckCircle2 size={16} /> Receipt scanned & fields auto-filled
                  </div>
                </div>
                <button
                  onClick={() => setScannedPreview(null)}
                  className="absolute top-1 right-1 p-1 rounded-full bg-black/40 text-white/70"
                >
                  <X size={12} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tabs */}
          <div className="flex gap-0 mx-5 mt-4 mb-1 p-1 rounded-xl border" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-primary)' }}>
            {[
              { id: 'form', label: 'Expense', icon: null },
              { id: 'split', label: 'Split Bill', icon: <SplitSquareVertical size={13} /> },
            ].map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleTabSwitch(t.id as any)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                  tab === t.id ? 'bg-brand-600 text-white shadow' : 'text-white/50 hover:text-white/70'
                }`}
              >
                {t.icon}{t.label}
              </button>
            ))}
          </div>

          {/* Scrollable content */}
          <div className="overflow-y-auto flex-1 px-5 pb-5">
            <form onSubmit={handleSubmit} className="space-y-4 pt-3">
              {/* Amount */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Amount (₹)</label>
                <input id="expense-amount" type="number" min="1" step="0.01"
                  value={form.amount}
                  onChange={e => tab === 'split' ? recalcEqualSplit(e.target.value) : update('amount', e.target.value)}
                  className="input-field text-lg font-bold" placeholder="0.00" required />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Description</label>
                <input id="expense-desc" type="text" value={form.description}
                  onChange={e => update('description', e.target.value)}
                  className="input-field" placeholder="What did you spend on?" required />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Category</label>
                <div className="grid grid-cols-5 gap-1.5 max-h-32 overflow-y-auto pr-1">
                  {categories.map(cat => (
                    <button key={cat} type="button" onClick={() => update('category', cat)} id={`cat-${cat}`}
                      className={`flex flex-col items-center p-2 rounded-xl text-center transition-all ${
                        form.category === cat
                          ? 'bg-brand-500/20 border border-brand-500/40'
                          : 'border border-transparent hover:bg-brand-500/8'
                      }`}
                    >
                      <span className="text-lg">{categoryIcons[cat]}</span>
                      <span className="text-[9px] mt-0.5 capitalize" style={{ color: 'var(--text-muted)' }}>
                        {cat.replace('_', ' ').toLowerCase().slice(0, 7)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date & Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Date</label>
                  <input id="expense-date" type="date" value={form.expenseDate}
                    onChange={e => update('expenseDate', e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Type</label>
                  <select id="expense-type" value={form.expenseType}
                    onChange={e => update('expenseType', e.target.value)} className="input-field">
                    <option value="VARIABLE">Variable</option>
                    <option value="FIXED">Fixed</option>
                    <option value="EMERGENCY">Emergency</option>
                    <option value="SHARED">Shared</option>
                  </select>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input id="exp-household" type="checkbox" checked={form.paidForHousehold}
                    onChange={e => update('paidForHousehold', e.target.checked)}
                    className="w-4 h-4 accent-indigo-500 rounded" />
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Paid for household</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input id="exp-reimb" type="checkbox" checked={form.isReimbursable}
                    onChange={e => update('isReimbursable', e.target.checked)}
                    className="w-4 h-4 accent-indigo-500 rounded" />
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Reimbursable</span>
                </label>
              </div>

              {/* Bill Splitting Tab Content */}
              {tab === 'split' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border p-4 space-y-3" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-primary)' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users size={15} className="text-brand-400" />
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Split Between Members</span>
                    </div>
                    <div className="flex gap-1 p-0.5 rounded-lg bg-white/5 border border-white/8">
                      {(['equal','custom'] as const).map(m => (
                        <button key={m} type="button"
                          onClick={() => {
                            setSplitMode(m)
                            if (m === 'equal' && members.length > 0) {
                              const amt = parseFloat(form.amount) || 0
                              const per = (amt / (members.length + 1)).toFixed(2)
                              setSplits(s => s.map(sp => ({ ...sp, amount: per })))
                            }
                          }}
                          className={`text-[10px] px-2 py-0.5 rounded-md font-medium transition-all ${splitMode === m ? 'bg-brand-600 text-white' : 'text-white/40'}`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {members.length === 0 ? (
                    <div className="text-center py-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <Loader2 size={16} className="animate-spin mx-auto mb-2" />
                      Loading members…
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {splits.map((sp, i) => (
                          <div key={sp.memberId} className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full gradient-brand flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {sp.memberName.charAt(0)}
                            </div>
                            <span className="flex-1 text-sm" style={{ color: 'var(--text-secondary)' }}>{sp.memberName}</span>
                            <input
                              type="number" min="0" step="0.01"
                              value={sp.amount}
                              onChange={e => {
                                setSplitMode('custom')
                                setSplits(prev => prev.map((s, j) => j === i ? { ...s, amount: e.target.value } : s))
                              }}
                              className="input-field w-24 text-sm py-1.5 text-right"
                              placeholder="₹0"
                            />
                          </div>
                        ))}
                      </div>

                      {/* Summary */}
                      <div className="pt-2 border-t space-y-1" style={{ borderColor: 'var(--border-color)' }}>
                        <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                          <span>Others total</span>
                          <span className="text-rose-400 font-semibold">₹{splitTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span style={{ color: 'var(--text-muted)' }}>Your share</span>
                          <span className="text-emerald-400 font-semibold">₹{Math.max(0, myShare).toFixed(2)}</span>
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
                <button id="expense-submit" type="submit" disabled={loading} className="btn-primary flex-1 disabled:opacity-50">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={15} className="animate-spin" /> Saving…
                    </span>
                  ) : tab === 'split' ? 'Add & Split 💸' : 'Add Expense 💸'}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
