'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plane, Plus, MapPin, Calendar, Users, DollarSign, Wallet } from 'lucide-react'
import api from '@/lib/api'
import { formatCurrency, formatDate } from '@/hooks/useUtils'
import toast from 'react-hot-toast'

interface TripExpense {
  id: number
  description: string
  amount: number
  currencyCode: string
  exchangeRate: number
  expenseDate: string
  paidBy: { fullName: string }
}

interface Trip {
  id: number
  destination: string
  startDate: string
  endDate: string
  budget: number
  baseCurrency: string
}

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [activeTrip, setActiveTrip] = useState<number | null>(null)
  const [tripExpenses, setTripExpenses] = useState<Record<number, TripExpense[]>>({})
  
  const [newTrip, setNewTrip] = useState({ destination: '', startDate: '', endDate: '', budget: '', baseCurrency: 'INR' })
  const [newExpense, setNewExpense] = useState({ description: '', amount: '', currencyCode: 'INR', exchangeRate: '1.0' })

  useEffect(() => { loadTrips() }, [])

  const loadTrips = async () => {
    setLoading(true)
    try {
      const res = await api.getTrips()
      if (res.success) setTrips(res.data)
    } finally { setLoading(false) }
  }

  const loadExpenses = async (tripId: number) => {
    try {
      const res = await api.getTripExpenses(tripId)
      if (res.success) {
        setTripExpenses(prev => ({ ...prev, [tripId]: res.data }))
      }
    } catch {}
  }

  const handleCreateTrip = async () => {
    if (!newTrip.destination || !newTrip.budget) return
    try {
      const res = await api.createTrip({
        ...newTrip,
        budget: parseFloat(newTrip.budget)
      })
      if (res.success) {
        setTrips(prev => [res.data, ...prev])
        setShowNew(false)
        setNewTrip({ destination: '', startDate: '', endDate: '', budget: '', baseCurrency: 'INR' })
        toast.success('Trip planned!')
      }
    } catch { toast.error('Failed to plan trip') }
  }

  const handleCreateExpense = async (tripId: number) => {
    if (!newExpense.description || !newExpense.amount) return
    try {
      const res = await api.createTripExpense(tripId, {
        ...newExpense,
        amount: parseFloat(newExpense.amount),
        exchangeRate: parseFloat(newExpense.exchangeRate)
      })
      if (res.success) {
        setTripExpenses(prev => ({
          ...prev,
          [tripId]: [res.data, ...(prev[tripId] || [])]
        }))
        setNewExpense({ description: '', amount: '', currencyCode: 'INR', exchangeRate: '1.0' })
        toast.success('Expense recorded!')
      }
    } catch { toast.error('Failed to add expense') }
  }

  const toggleTrip = (tripId: number) => {
    if (activeTrip === tripId) {
      setActiveTrip(null)
    } else {
      setActiveTrip(tripId)
      if (!tripExpenses[tripId]) {
        loadExpenses(tripId)
      }
    }
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto space-y-4">
      {[1, 2].map(i => <div key={i} className="skeleton h-32 rounded-2xl" />)}
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
            <Plane size={24} className="text-purple-500" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>Family Trips</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Plan vacations and track multi-currency expenses</p>
          </div>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary flex items-center gap-2 bg-purple-500 hover:bg-purple-600 border-purple-400/50">
          <Plus size={16} /> Plan Trip
        </button>
      </div>

      <AnimatePresence>
        {showNew && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="glass-card p-5 border border-purple-500/30 space-y-4 overflow-hidden">
            <h3 className="font-semibold text-lg">Plan a New Trip</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Destination</label>
                <input type="text" value={newTrip.destination} onChange={e => setNewTrip(n => ({...n, destination: e.target.value}))}
                  className="input-field" placeholder="e.g. Goa, Paris" />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Budget</label>
                <input type="number" value={newTrip.budget} onChange={e => setNewTrip(n => ({...n, budget: e.target.value}))}
                  className="input-field" placeholder="50000" />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Base Currency</label>
                <select value={newTrip.baseCurrency} onChange={e => setNewTrip(n => ({...n, baseCurrency: e.target.value}))} className="input-field">
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="AED">AED</option>
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Start Date</label>
                <input type="date" value={newTrip.startDate} onChange={e => setNewTrip(n => ({...n, startDate: e.target.value}))}
                  className="input-field" />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>End Date</label>
                <input type="date" value={newTrip.endDate} onChange={e => setNewTrip(n => ({...n, endDate: e.target.value}))}
                  className="input-field" />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setShowNew(false)} className="btn-ghost">Cancel</button>
              <button onClick={handleCreateTrip} className="btn-primary bg-purple-500 hover:bg-purple-600">Create Trip</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {trips.map(trip => {
          const expenses = tripExpenses[trip.id] || []
          // Calculate total spent in base currency (assuming expenses are already in base currency or exchangeRate is used)
          // Simplified: amount * exchangeRate = amount in base currency
          const totalSpent = expenses.reduce((sum, e) => sum + (e.amount * e.exchangeRate), 0)
          const budgetUsed = Math.min((totalSpent / trip.budget) * 100, 100)
          const isOverBudget = totalSpent > trip.budget

          return (
            <motion.div key={trip.id} layout className={`glass-card overflow-hidden border ${isOverBudget ? 'border-red-500/30' : 'border-white/5'}`}>
              <div className="p-6 cursor-pointer hover:bg-white/[0.02] transition-colors" onClick={() => toggleTrip(trip.id)}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                      <MapPin size={24} className="text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>{trip.destination}</h3>
                      <div className="flex items-center gap-3 text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        <span className="flex items-center gap-1"><Calendar size={12}/> {formatDate(trip.startDate)} - {formatDate(trip.endDate)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Budget: {formatCurrency(trip.budget, trip.baseCurrency)}
                    </div>
                    <div className={`text-sm mt-1 font-bold ${isOverBudget ? 'text-red-400' : 'text-emerald-400'}`}>
                      Spent: {formatCurrency(totalSpent, trip.baseCurrency)}
                    </div>
                  </div>
                </div>

                <div className="h-2 rounded-full bg-black/20 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }} animate={{ width: `${budgetUsed}%` }}
                    className={`h-full rounded-full ${isOverBudget ? 'bg-red-500' : 'bg-purple-500'}`}
                  />
                </div>
              </div>

              <AnimatePresence>
                {activeTrip === trip.id && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="border-t border-white/5 bg-black/10">
                    <div className="p-4 border-b border-white/5 flex gap-2">
                      <input type="text" value={newExpense.description} onChange={e => setNewExpense(n => ({...n, description: e.target.value}))}
                        className="input-field text-sm" placeholder="Expense description..." />
                      <input type="number" value={newExpense.amount} onChange={e => setNewExpense(n => ({...n, amount: e.target.value}))}
                        className="input-field text-sm w-24" placeholder="Amount" />
                      <select value={newExpense.currencyCode} onChange={e => setNewExpense(n => ({...n, currencyCode: e.target.value}))} className="input-field text-sm w-24">
                        <option value="INR">INR</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="AED">AED</option>
                      </select>
                      <button onClick={() => handleCreateExpense(trip.id)} className="btn-primary bg-purple-500 hover:bg-purple-600 px-4 py-2 shrink-0">Add Expense</button>
                    </div>

                    <div className="divide-y divide-white/5">
                      {expenses.map(expense => (
                        <div key={expense.id} className="p-3 px-6 flex justify-between items-center hover:bg-white/5 text-sm">
                          <div className="flex items-center gap-3">
                            <DollarSign size={16} className="text-purple-400" />
                            <div>
                              <div style={{ color: 'var(--text-primary)' }}>{expense.description}</div>
                              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Paid by {expense.paidBy.fullName} • {formatDate(expense.expenseDate)}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{formatCurrency(expense.amount, expense.currencyCode)}</div>
                            {expense.currencyCode !== trip.baseCurrency && (
                              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                ≈ {formatCurrency(expense.amount * expense.exchangeRate, trip.baseCurrency)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {expenses.length === 0 && (
                        <div className="p-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No expenses recorded for this trip yet.</div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
