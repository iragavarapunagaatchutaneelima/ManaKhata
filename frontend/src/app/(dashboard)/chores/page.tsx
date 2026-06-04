'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckSquare, Plus, Clock, CheckCircle2, User as UserIcon, Check, XCircle } from 'lucide-react'
import api from '@/lib/api'
import { formatCurrency, formatDate } from '@/hooks/useUtils'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'

interface Chore {
  id: number
  title: string
  description: string
  rewardAmount: number
  status: 'PENDING' | 'COMPLETED' | 'APPROVED' | 'REJECTED'
  dueDate: string
  assignedTo: { id: number; fullName: string }
}

export default function ChoresPage() {
  const { user } = useAuthStore()
  const [chores, setChores] = useState<Chore[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  
  const [newChore, setNewChore] = useState({ title: '', description: '', rewardAmount: '', dueDate: '', assignedToId: '' })
  const [members, setMembers] = useState<any[]>([])

  const isParent = user?.isHousehead || user?.role === 'PARENT'

  useEffect(() => { 
    loadChores() 
    if (isParent) loadMembers()
  }, [isParent])

  const loadChores = async () => {
    setLoading(true)
    try {
      const res = await api.getChores()
      if (res.success) setChores(res.data)
    } finally { setLoading(false) }
  }

  const loadMembers = async () => {
    try {
      const res = await api.getHouseholdMembers()
      if (res.success) setMembers(res.data)
    } catch {}
  }

  const handleCreate = async () => {
    if (!newChore.title || !newChore.rewardAmount || !newChore.assignedToId) return
    try {
      const res = await api.createChore({
        ...newChore,
        rewardAmount: parseFloat(newChore.rewardAmount),
        assignedToId: parseInt(newChore.assignedToId)
      })
      if (res.success) {
        setChores(prev => [...prev, res.data])
        setShowNew(false)
        setNewChore({ title: '', description: '', rewardAmount: '', dueDate: '', assignedToId: '' })
        toast.success('Chore assigned!')
      }
    } catch { toast.error('Failed to create chore') }
  }

  const updateStatus = async (choreId: number, status: 'COMPLETED' | 'APPROVED' | 'REJECTED') => {
    try {
      const res = await api.updateChoreStatus(choreId, status)
      if (res.success) {
        setChores(prev => prev.map(c => c.id === choreId ? { ...c, status } : c))
        if (status === 'COMPLETED') toast.success('Chore marked as completed! Waiting for approval.')
        else if (status === 'APPROVED') toast.success('Chore approved! Reward transferred.')
        else toast.error('Chore rejected.')
      }
    } catch { toast.error('Failed to update status') }
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto space-y-4">
      {[1, 2].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
    </div>
  )

  const pendingChores = chores.filter(c => c.status === 'PENDING')
  const reviewChores = chores.filter(c => c.status === 'COMPLETED')
  const historyChores = chores.filter(c => c.status === 'APPROVED' || c.status === 'REJECTED')

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
            <CheckSquare size={24} className="text-orange-500" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>Chore Board</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{isParent ? 'Assign tasks and reward your kids' : 'Complete tasks to earn pocket money!'}</p>
          </div>
        </div>
        {isParent && (
          <button onClick={() => setShowNew(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Assign Chore
          </button>
        )}
      </div>

      <AnimatePresence>
        {showNew && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="glass-card p-5 border border-brand-500/30 space-y-4 overflow-hidden">
            <h3 className="font-semibold text-lg">Assign a Chore</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Chore Title</label>
                <input type="text" value={newChore.title} onChange={e => setNewChore(n => ({...n, title: e.target.value}))}
                  className="input-field" placeholder="e.g. Wash the car" />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Reward Amount (₹)</label>
                <input type="number" value={newChore.rewardAmount} onChange={e => setNewChore(n => ({...n, rewardAmount: e.target.value}))}
                  className="input-field font-bold text-emerald-400" placeholder="100" />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Assign To</label>
                <select value={newChore.assignedToId} onChange={e => setNewChore(n => ({...n, assignedToId: e.target.value}))} className="input-field">
                  <option value="">Select Child...</option>
                  {members.filter(m => m.role === 'STUDENT' || m.role === 'ADULT_CHILD').map(m => (
                    <option key={m.id} value={m.id}>{m.fullName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Due Date</label>
                <input type="date" value={newChore.dueDate} onChange={e => setNewChore(n => ({...n, dueDate: e.target.value}))}
                  className="input-field" />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setShowNew(false)} className="btn-ghost">Cancel</button>
              <button onClick={handleCreate} className="btn-primary bg-orange-500 hover:bg-orange-600">Assign Chore</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-6">
        {/* Needs Review Section */}
        {reviewChores.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-500" /> 
              {isParent ? 'Needs Your Review' : 'Waiting for Approval'}
            </h3>
            {reviewChores.map(chore => (
              <ChoreCard key={chore.id} chore={chore} isParent={isParent} onStatusChange={updateStatus} />
            ))}
          </div>
        )}

        {/* To Do Section */}
        {pendingChores.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Clock size={18} className="text-orange-500" /> To Do
            </h3>
            {pendingChores.map(chore => (
              <ChoreCard key={chore.id} chore={chore} isParent={isParent} onStatusChange={updateStatus} />
            ))}
          </div>
        )}

        {/* History Section */}
        {historyChores.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>History</h3>
            {historyChores.map(chore => (
              <ChoreCard key={chore.id} chore={chore} isParent={isParent} onStatusChange={updateStatus} />
            ))}
          </div>
        )}

        {chores.length === 0 && !loading && (
          <div className="text-center py-12 glass-card rounded-2xl">
            <CheckSquare size={48} className="mx-auto mb-4 text-white/20" />
            <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>No chores assigned</h3>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              {isParent ? "Assign some tasks and reward your kids!" : "You don't have any tasks pending."}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function ChoreCard({ chore, isParent, onStatusChange }: { chore: Chore, isParent: boolean, onStatusChange: (id: number, s: any) => void }) {
  return (
    <div className="glass-card p-4 flex items-center justify-between border border-transparent hover:border-white/5 transition-all">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
          chore.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-500' :
          chore.status === 'REJECTED' ? 'bg-red-500/20 text-red-500' :
          chore.status === 'COMPLETED' ? 'bg-blue-500/20 text-blue-500' :
          'bg-orange-500/20 text-orange-500'
        }`}>
          {chore.status === 'APPROVED' ? <CheckCircle2 size={20} /> :
           chore.status === 'REJECTED' ? <XCircle size={20} /> :
           chore.status === 'COMPLETED' ? <Check size={20} /> :
           <Clock size={20} />}
        </div>
        <div>
          <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {chore.title}
            {chore.status === 'REJECTED' && <span className="ml-2 text-xs text-red-400 font-normal">Rejected</span>}
          </h4>
          <div className="flex items-center gap-3 text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            <span className="font-medium text-emerald-400">Earn {formatCurrency(chore.rewardAmount)}</span>
            {isParent && <span className="flex items-center gap-1"><UserIcon size={12} /> {chore.assignedTo.fullName}</span>}
            {chore.dueDate && <span>Due: {formatDate(chore.dueDate)}</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {chore.status === 'PENDING' && !isParent && (
          <button onClick={() => onStatusChange(chore.id, 'COMPLETED')} className="btn-primary text-sm px-4">Done</button>
        )}
        {chore.status === 'COMPLETED' && isParent && (
          <>
            <button onClick={() => onStatusChange(chore.id, 'REJECTED')} className="btn-ghost text-sm text-red-400 hover:bg-red-500/10">Reject</button>
            <button onClick={() => onStatusChange(chore.id, 'APPROVED')} className="btn-primary text-sm px-4 bg-emerald-500 hover:bg-emerald-600 text-white">Approve & Pay</button>
          </>
        )}
      </div>
    </div>
  )
}
