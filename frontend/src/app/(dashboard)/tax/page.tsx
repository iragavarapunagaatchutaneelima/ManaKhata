'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Plus, Upload, Calculator } from 'lucide-react'
import api from '@/lib/api'
import { formatCurrency, formatDate } from '@/hooks/useUtils'
import toast from 'react-hot-toast'

interface TaxDocument {
  id: number
  documentName: string
  category: string
  amount: number
  financialYear: string
  dateUploaded: string
}

export default function TaxPage() {
  const [docs, setDocs] = useState<TaxDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  
  const [newDoc, setNewDoc] = useState({ documentName: '', category: '80C', amount: '', financialYear: '2024-2025' })

  useEffect(() => { loadDocs() }, [])

  const loadDocs = async () => {
    setLoading(true)
    try {
      const res = await api.getTaxDocuments()
      if (res.success) setDocs(res.data)
    } finally { setLoading(false) }
  }

  const handleCreate = async () => {
    if (!newDoc.documentName || !newDoc.amount) return
    try {
      const res = await api.createTaxDocument({
        ...newDoc,
        amount: parseFloat(newDoc.amount)
      })
      if (res.success) {
        setDocs(prev => [res.data, ...prev])
        setShowNew(false)
        setNewDoc({ documentName: '', category: '80C', amount: '', financialYear: '2024-2025' })
        toast.success('Document recorded!')
      }
    } catch { toast.error('Failed to record document') }
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto space-y-4">
      {[1, 2].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
    </div>
  )

  const groupedDocs = docs.reduce((acc, doc) => {
    const fy = doc.financialYear
    if (!acc[fy]) acc[fy] = []
    acc[fy].push(doc)
    return acc
  }, {} as Record<string, TaxDocument[]>)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <Calculator size={24} className="text-blue-500" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>Tax Assistant</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Organize your tax-saving proofs by financial year</p>
          </div>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary flex items-center gap-2">
          <Upload size={16} /> Record Proof
        </button>
      </div>

      <AnimatePresence>
        {showNew && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="glass-card p-5 border border-blue-500/30 space-y-4 overflow-hidden">
            <h3 className="font-semibold text-lg">Add Tax Document</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Document Name</label>
                <input type="text" value={newDoc.documentName} onChange={e => setNewDoc(n => ({...n, documentName: e.target.value}))}
                  className="input-field" placeholder="e.g. PPF Deposit" />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Amount (₹)</label>
                <input type="number" value={newDoc.amount} onChange={e => setNewDoc(n => ({...n, amount: e.target.value}))}
                  className="input-field font-bold text-emerald-400" placeholder="150000" />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Category</label>
                <select value={newDoc.category} onChange={e => setNewDoc(n => ({...n, category: e.target.value}))} className="input-field">
                  <option>80C</option>
                  <option>80D</option>
                  <option>HRA</option>
                  <option>Home Loan Interest (24B)</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Financial Year</label>
                <select value={newDoc.financialYear} onChange={e => setNewDoc(n => ({...n, financialYear: e.target.value}))} className="input-field">
                  <option>2024-2025</option>
                  <option>2023-2024</option>
                  <option>2022-2023</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setShowNew(false)} className="btn-ghost">Cancel</button>
              <button onClick={handleCreate} className="btn-primary bg-blue-500 hover:bg-blue-600">Save Document</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-8">
        {Object.entries(groupedDocs).sort((a,b) => b[0].localeCompare(a[0])).map(([fy, fyDocs]) => {
          const totalAmount = fyDocs.reduce((sum, d) => sum + d.amount, 0)
          return (
            <div key={fy} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>FY {fy}</h2>
                <span className="text-sm font-semibold text-emerald-400">Total: {formatCurrency(totalAmount)}</span>
              </div>
              <div className="glass-card divide-y divide-white/5 overflow-hidden border border-white/5">
                {fyDocs.map(doc => (
                  <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <FileText size={20} className="text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{doc.documentName}</h4>
                        <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                          Uploaded {formatDate(doc.dateUploaded)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{formatCurrency(doc.amount)}</div>
                      <div className="text-xs font-semibold px-2 py-0.5 rounded bg-white/5 inline-block mt-1" style={{ color: 'var(--text-muted)' }}>{doc.category}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {docs.length === 0 && !loading && (
          <div className="text-center py-12 glass-card rounded-2xl border border-blue-500/10">
            <Calculator size={48} className="mx-auto mb-4 text-blue-500/30" />
            <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>No Tax Documents</h3>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Start recording your 80C and other tax-saving investments here.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
