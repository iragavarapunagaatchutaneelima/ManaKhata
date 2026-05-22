'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Fuel, Wrench } from 'lucide-react'
import api from '@/lib/api'
import { formatCurrency, formatDate } from '@/hooks/useUtils'
import type { Vehicle } from '@/types'
import toast from 'react-hot-toast'

const vehicleEmoji: Record<string, string> = {
  BIKE: '🏍️', SCOOTY: '🛵', CAR: '🚗', AUTO: '🛺', TRUCK: '🚛', CYCLE: '🚲', OTHER: '🚗'
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [showExpForm, setShowExpForm] = useState(false)
  const [form, setForm] = useState({ name: '', vehicleType: 'CAR', make: '', model: '', year: '', fuelType: 'Petrol', mileageKmpl: '', registrationNumber: '', isShared: false })
  const [expForm, setExpForm] = useState({ amount: '', description: '', expenseType: 'FUEL', fuelLiters: '', notes: '' })

  useEffect(() => { loadVehicles() }, [])

  const loadVehicles = async () => {
    setLoading(true)
    try {
      const res = await api.getVehicles()
      if (res.success) setVehicles(res.data || [])
    } finally { setLoading(false) }
  }

  const loadDetail = async (id: number) => {
    const res = await api.getVehicleDetail(id)
    if (res.success) setSelected(res.data)
  }

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.addVehicle({ ...form, year: form.year ? parseInt(form.year) : undefined, mileageKmpl: form.mileageKmpl ? parseFloat(form.mileageKmpl) : undefined })
      toast.success('Vehicle added! 🚗')
      setShowAdd(false)
      loadVehicles()
    } catch { toast.error('Failed to add vehicle') }
  }

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    try {
      await api.addVehicleExpense(selected.vehicle.id, { ...expForm, amount: parseFloat(expForm.amount), fuelLiters: expForm.fuelLiters ? parseFloat(expForm.fuelLiters) : undefined })
      toast.success('Expense logged! ⛽')
      setShowExpForm(false)
      loadDetail(selected.vehicle.id)
    } catch { toast.error('Failed to log expense') }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>Vehicles & Assets</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Track fuel, maintenance, and contributions</p>
        </div>
        <button id="add-vehicle-btn" onClick={() => setShowAdd(!showAdd)} className="btn-primary"><Plus size={16} /> Add Vehicle</button>
      </div>

      {/* Add Vehicle Form */}
      {showAdd && (
        <motion.form onSubmit={handleAddVehicle} className="glass-card p-6"
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Add Vehicle</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { id:'v-name', label:'Name', key:'name', placeholder:"Father's Honda Activa" },
              { id:'v-reg', label:'Reg. No.', key:'registrationNumber', placeholder:"DL-3C-AB-1234" },
              { id:'v-make', label:'Make', key:'make', placeholder:"Honda" },
              { id:'v-model', label:'Model', key:'model', placeholder:"Activa 6G" },
              { id:'v-year', label:'Year', key:'year', placeholder:"2021", type:'number' },
              { id:'v-mileage', label:'Mileage (kmpl)', key:'mileageKmpl', placeholder:"45", type:'number' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{f.label}</label>
                <input id={f.id} type={f.type || 'text'} value={(form as any)[f.key]}
                  onChange={e => setForm(fr => ({...fr, [f.key]: e.target.value}))}
                  className="input-field" placeholder={f.placeholder} />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Type</label>
              <select id="v-type" value={form.vehicleType} onChange={e => setForm(f => ({...f, vehicleType: e.target.value}))} className="input-field">
                {['BIKE','SCOOTY','CAR','AUTO','TRUCK','CYCLE','OTHER'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Fuel Type</label>
              <select id="v-fuel" value={form.fuelType} onChange={e => setForm(f => ({...f, fuelType: e.target.value}))} className="input-field">
                {['Petrol','Diesel','CNG','Electric','Hybrid'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 col-span-full">
              <input id="v-shared" type="checkbox" checked={form.isShared} onChange={e => setForm(f => ({...f, isShared: e.target.checked}))} className="w-4 h-4 accent-indigo-500" />
              <label htmlFor="v-shared" className="text-sm" style={{ color: 'var(--text-secondary)' }}>Shared with household</label>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="button" onClick={() => setShowAdd(false)} className="btn-ghost flex-1">Cancel</button>
            <button id="vehicle-submit" type="submit" className="btn-primary flex-1">Add Vehicle 🚗</button>
          </div>
        </motion.form>
      )}

      {/* Vehicle Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="skeleton h-48 rounded-2xl" />)}
        </div>
      ) : vehicles.length === 0 ? (
        <div className="glass-card py-20 text-center">
          <div className="text-5xl mb-3">🚗</div>
          <p style={{ color: 'var(--text-muted)' }}>No vehicles added yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((v, i) => (
            <motion.div key={v.id} className="glass-card p-5 cursor-pointer"
              onClick={() => { loadDetail(v.id); }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -3 }}>
              <div className="flex items-start justify-between mb-3">
                <div className="text-4xl">{vehicleEmoji[v.vehicleType] || '🚗'}</div>
                {v.isShared && <span className="badge badge-brand">Shared</span>}
              </div>
              <h4 className="font-display font-semibold text-base mb-1" style={{ color: 'var(--text-primary)' }}>{v.name}</h4>
              <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>{v.make} {v.model} {v.year && `· ${v.year}`}</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-xl text-center" style={{ background: 'var(--bg-primary)' }}>
                  <Fuel size={14} className="mx-auto mb-1 text-rose-400" />
                  <div className="font-bold text-sm text-rose-400">{formatCurrency(v.totalFuelCost)}</div>
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Fuel</div>
                </div>
                <div className="p-2 rounded-xl text-center" style={{ background: 'var(--bg-primary)' }}>
                  <Wrench size={14} className="mx-auto mb-1 text-brand-400" />
                  <div className="font-bold text-sm text-brand-400">{formatCurrency(v.totalMaintenanceCost)}</div>
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Maintenance</div>
                </div>
              </div>
              {v.registrationNumber && (
                <p className="text-xs mt-3 text-center font-mono" style={{ color: 'var(--text-muted)' }}>{v.registrationNumber}</p>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Vehicle Detail Drawer */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-end" onClick={() => setSelected(null)}>
          <motion.div
            className="w-full max-w-md h-full overflow-auto"
            style={{ background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border-color)' }}
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-4xl mb-2">{vehicleEmoji[selected.vehicle.vehicleType] || '🚗'}</div>
                  <h3 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>{selected.vehicle.name}</h3>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{selected.vehicle.make} {selected.vehicle.model}</p>
                </div>
                <button onClick={() => setSelected(null)} className="btn-ghost p-2">✕</button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-4 rounded-xl gradient-rose text-white text-center">
                  <div className="font-bold text-xl">{formatCurrency(selected.totalFuelCost)}</div>
                  <div className="text-xs opacity-80 mt-0.5">Total Fuel</div>
                </div>
                <div className="p-4 rounded-xl gradient-brand text-white text-center">
                  <div className="font-bold text-xl">{formatCurrency(selected.totalMaintenanceCost)}</div>
                  <div className="text-xs opacity-80 mt-0.5">Maintenance</div>
                </div>
              </div>

              <button id="log-expense-btn" onClick={() => setShowExpForm(!showExpForm)} className="btn-primary w-full mb-4">
                <Plus size={16} /> Log Expense
              </button>

              {showExpForm && (
                <form onSubmit={handleAddExpense} className="glass-card p-4 mb-4 space-y-3">
                  <input id="vexp-amount" type="number" value={expForm.amount} onChange={e => setExpForm(f => ({...f, amount: e.target.value}))}
                    className="input-field" placeholder="Amount (₹)" required />
                  <input id="vexp-desc" type="text" value={expForm.description} onChange={e => setExpForm(f => ({...f, description: e.target.value}))}
                    className="input-field" placeholder="Description" required />
                  <select id="vexp-type" value={expForm.expenseType} onChange={e => setExpForm(f => ({...f, expenseType: e.target.value}))} className="input-field">
                    {['FUEL','MAINTENANCE','INSURANCE','REPAIR','SERVICE','PUC','WASHING','OTHER'].map(t => <option key={t}>{t}</option>)}
                  </select>
                  {expForm.expenseType === 'FUEL' && (
                    <input id="vexp-liters" type="number" value={expForm.fuelLiters} onChange={e => setExpForm(f => ({...f, fuelLiters: e.target.value}))}
                      className="input-field" placeholder="Fuel liters" />
                  )}
                  <button id="vexp-submit" type="submit" className="btn-primary w-full">Log Expense ⛽</button>
                </form>
              )}

              {/* Contribution breakdown */}
              {selected.contributionBreakdown?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>Contributions</h4>
                  {selected.contributionBreakdown.map((c: any[]) => (
                    <div key={c[0]} className="flex items-center justify-between py-2">
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{c[1]}</span>
                      <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{formatCurrency(c[2])}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Recent expenses */}
              <h4 className="font-semibold text-sm mt-4 mb-3" style={{ color: 'var(--text-primary)' }}>Recent Expenses</h4>
              <div className="space-y-2">
                {(selected.expenses || []).slice(0, 8).map((exp: any) => (
                  <div key={exp.id} className="flex items-center justify-between p-3 rounded-xl"
                    style={{ background: 'var(--bg-primary)' }}>
                    <div>
                      <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{exp.description}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {exp.expenseType} · {exp.contributor?.fullName}
                      </div>
                    </div>
                    <span className="font-semibold text-sm text-rose-400">{formatCurrency(exp.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
