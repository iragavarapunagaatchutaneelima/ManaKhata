'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingCart, Plus, CheckCircle2, Circle, Trash2, ShoppingBag,
  ChevronDown, ChevronUp, Loader2, X, Receipt
} from 'lucide-react'
import api from '@/lib/api'
import { formatCurrency } from '@/hooks/useUtils'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import AddExpenseModal from '@/components/ui/AddExpenseModal'

interface GroceryItem {
  id: number
  name: string
  quantity?: number
  unit?: string
  estimatedPrice?: number
  isChecked: boolean
  category?: string
}

interface GroceryList {
  id: number
  name: string
  isCompleted: boolean
  createdBy: { id: number; fullName: string }
  createdAt: string
  items: GroceryItem[]
}

export default function GroceryListPage() {
  const { user } = useAuthStore()
  const [lists, setLists] = useState<GroceryList[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [showNewList, setShowNewList] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [newItem, setNewItem] = useState({ name: '', quantity: '', unit: 'pcs', estimatedPrice: '', category: '' })
  const [addingToList, setAddingToList] = useState<number | null>(null)
  const [checkoutList, setCheckoutList] = useState<GroceryList | null>(null)

  useEffect(() => { loadLists() }, [])

  const loadLists = async () => {
    setLoading(true)
    try {
      const res = await api.getGroceryLists()
      if (res.success) setLists(res.data)
    } finally { setLoading(false) }
  }

  const handleCreateList = async () => {
    if (!newListName.trim()) return
    try {
      const res = await api.createGroceryList(newListName)
      if (res.success) {
        setLists(prev => [res.data, ...prev])
        setNewListName('')
        setShowNewList(false)
        setExpandedId(res.data.id)
        toast.success('List created!')
      }
    } catch { toast.error('Failed to create list') }
  }

  const handleToggleItem = async (listId: number, itemId: number) => {
    setLists(prev => prev.map(l => l.id === listId
      ? { ...l, items: l.items.map(i => i.id === itemId ? { ...i, isChecked: !i.isChecked } : i) }
      : l
    ))
    try { await api.toggleGroceryItem(itemId) } catch { /* revert on error */ loadLists() }
  }

  const handleAddItem = async (listId: number) => {
    if (!newItem.name.trim()) return
    try {
      const res = await api.addGroceryItem(listId, {
        name: newItem.name,
        quantity: newItem.quantity ? parseInt(newItem.quantity) : 1,
        unit: newItem.unit,
        estimatedPrice: newItem.estimatedPrice ? parseFloat(newItem.estimatedPrice) : undefined,
        category: newItem.category,
      })
      if (res.success) {
        setLists(prev => prev.map(l => l.id === listId
          ? { ...l, items: [...l.items, res.data] }
          : l
        ))
        setNewItem({ name: '', quantity: '', unit: 'pcs', estimatedPrice: '', category: '' })
        setAddingToList(null)
        toast.success('Item added!')
      }
    } catch { toast.error('Failed to add item') }
  }

  const handleCheckout = (list: GroceryList) => {
    setCheckoutList(list)
  }

  const handleDeleteList = async (listId: number) => {
    try {
      await api.deleteGroceryList(listId)
      setLists(prev => prev.filter(l => l.id !== listId))
      toast.success('List deleted')
    } catch { toast.error('Failed to delete list') }
  }

  const getListTotal = (list: GroceryList) =>
    list.items.reduce((acc, i) => acc + ((i.estimatedPrice || 0) * (i.quantity || 1)), 0)

  const getCheckedTotal = (list: GroceryList) =>
    list.items.filter(i => i.isChecked).reduce((acc, i) => acc + ((i.estimatedPrice || 0) * (i.quantity || 1)), 0)

  if (loading) return (
    <div className="max-w-3xl mx-auto space-y-4">
      {[1, 2].map(i => <div key={i} className="skeleton h-32 rounded-2xl" />)}
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>
            🛒 Grocery Lists
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Collaborative household shopping — shared in real-time
          </p>
        </div>
        <button
          onClick={() => setShowNewList(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} /> New List
        </button>
      </div>

      {/* New List form */}
      <AnimatePresence>
        {showNewList && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card p-4 border border-brand-500/30"
          >
            <div className="flex gap-3">
              <input
                autoFocus
                type="text"
                value={newListName}
                onChange={e => setNewListName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateList()}
                className="input-field flex-1"
                placeholder="e.g. Weekly Vegetables, Party Supplies…"
              />
              <button onClick={handleCreateList} className="btn-primary px-5">Create</button>
              <button onClick={() => setShowNewList(false)} className="btn-ghost">
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats overview */}
      {lists.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Active Lists', value: lists.filter(l => !l.isCompleted).length, icon: '📋', color: 'text-indigo-400' },
            { label: 'Total Items', value: lists.reduce((a, l) => a + l.items.length, 0), icon: '📦', color: 'text-emerald-400' },
            { label: 'Est. Budget', value: formatCurrency(lists.reduce((a, l) => a + getListTotal(l), 0)), icon: '💰', color: 'text-amber-400' },
          ].map(stat => (
            <div key={stat.label} className="glass-card p-4 text-center">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className={`font-display font-bold text-lg ${stat.color}`}>{stat.value}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Lists */}
      {lists.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-5xl mb-3">🛒</div>
          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No grocery lists yet</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Create your first list to get started!</p>
        </div>
      ) : (
        lists.map(list => {
          const isExpanded = expandedId === list.id
          const total = getListTotal(list)
          const checkedTotal = getCheckedTotal(list)
          const checkedCount = list.items.filter(i => i.isChecked).length
          const progress = list.items.length > 0 ? (checkedCount / list.items.length) * 100 : 0

          return (
            <motion.div
              key={list.id}
              layout
              className={`glass-card overflow-hidden ${list.isCompleted ? 'opacity-60' : ''}`}
            >
              {/* List header */}
              <div
                className="p-4 cursor-pointer flex items-center justify-between hover:bg-white/2 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : list.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
                    list.isCompleted ? 'bg-emerald-500/10' : 'bg-indigo-500/10'
                  }`}>
                    {list.isCompleted ? '✅' : '🛒'}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{list.name}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {list.items.length} items · by {list.createdBy.fullName} · est. {formatCurrency(total)}
                    </div>
                    {/* Progress bar */}
                    <div className="mt-1.5 h-1.5 rounded-full bg-white/5 w-40">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${progress}%`, background: progress === 100 ? '#10b981' : '#6366f1' }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{
                    background: list.isCompleted ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.1)',
                    color: list.isCompleted ? '#10b981' : '#6366f1'
                  }}>
                    {checkedCount}/{list.items.length}
                  </span>
                  {!list.isCompleted && (
                    <button
                      onClick={e => { e.stopPropagation(); handleCheckout(list) }}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all border border-emerald-500/20"
                    >
                      <Receipt size={12} /> Checkout
                    </button>
                  )}
                  <button
                    onClick={e => { e.stopPropagation(); handleDeleteList(list.id) }}
                    className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                  {isExpanded ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
                </div>
              </div>

              {/* Expanded items */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                    className="overflow-hidden border-t" style={{ borderColor: 'var(--border-color)' }}
                  >
                    <div className="p-4 space-y-2">
                      {/* Items */}
                      {list.items.map(item => (
                        <div
                          key={item.id}
                          onClick={() => handleToggleItem(list.id, item.id)}
                          className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-white/3 transition-colors"
                        >
                          {item.isChecked
                            ? <CheckCircle2 size={20} className="text-emerald-400 flex-shrink-0" />
                            : <Circle size={20} className="flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                          }
                          <div className={`flex-1 min-w-0 ${item.isChecked ? 'line-through opacity-50' : ''}`}>
                            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.name}</span>
                            {item.quantity && (
                              <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>
                                {item.quantity} {item.unit}
                              </span>
                            )}
                            {item.category && (
                              <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/40">{item.category}</span>
                            )}
                          </div>
                          {item.estimatedPrice && (
                            <span className="text-sm font-semibold text-amber-400 flex-shrink-0">
                              {formatCurrency(item.estimatedPrice * (item.quantity || 1))}
                            </span>
                          )}
                        </div>
                      ))}

                      {/* Add item inline */}
                      {addingToList === list.id ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          className="p-3 rounded-xl border border-brand-500/30 bg-brand-500/5 space-y-2"
                        >
                          <div className="flex gap-2">
                            <input autoFocus type="text" value={newItem.name}
                              onChange={e => setNewItem(n => ({ ...n, name: e.target.value }))}
                              onKeyDown={e => e.key === 'Enter' && handleAddItem(list.id)}
                              className="input-field flex-1 py-1.5 text-sm" placeholder="Item name…" />
                            <input type="number" min="1" value={newItem.quantity}
                              onChange={e => setNewItem(n => ({ ...n, quantity: e.target.value }))}
                              className="input-field w-16 py-1.5 text-sm" placeholder="Qty" />
                            <select value={newItem.unit} onChange={e => setNewItem(n => ({ ...n, unit: e.target.value }))}
                              className="input-field w-20 py-1.5 text-xs">
                              {['pcs','kg','g','L','ml','bag','box'].map(u => <option key={u}>{u}</option>)}
                            </select>
                          </div>
                          <div className="flex gap-2">
                            <input type="number" min="0" step="0.01" value={newItem.estimatedPrice}
                              onChange={e => setNewItem(n => ({ ...n, estimatedPrice: e.target.value }))}
                              className="input-field flex-1 py-1.5 text-sm" placeholder="Est. price (₹)" />
                            <input type="text" value={newItem.category}
                              onChange={e => setNewItem(n => ({ ...n, category: e.target.value }))}
                              className="input-field flex-1 py-1.5 text-sm" placeholder="Category (optional)" />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleAddItem(list.id)} className="btn-primary py-1.5 text-sm flex-1">
                              Add Item
                            </button>
                            <button onClick={() => { setAddingToList(null); setNewItem({ name: '', quantity: '', unit: 'pcs', estimatedPrice: '', category: '' }) }}
                              className="btn-ghost py-1.5 text-sm">Cancel</button>
                          </div>
                        </motion.div>
                      ) : (
                        <button
                          onClick={() => setAddingToList(list.id)}
                          className="w-full flex items-center gap-2 p-2.5 rounded-xl text-sm border border-dashed hover:bg-white/3 transition-colors"
                          style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
                        >
                          <Plus size={14} /> Add item to this list
                        </button>
                      )}

                      {/* Footer summary */}
                      {list.items.length > 0 && (
                        <div className="pt-2 border-t flex justify-between text-sm" style={{ borderColor: 'var(--border-color)' }}>
                          <span style={{ color: 'var(--text-muted)' }}>
                            Picked: {formatCurrency(checkedTotal)}
                          </span>
                          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                            Total: {formatCurrency(total)}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })
      )}

      {/* Checkout modal — auto-fills an expense with the grocery list total */}
      {checkoutList && (
        <AddExpenseModal
          onClose={() => setCheckoutList(null)}
          onSuccess={() => {
            setCheckoutList(null)
            api.completeGroceryList(checkoutList.id)
            setLists(prev => prev.map(l => l.id === checkoutList.id ? { ...l, isCompleted: true } : l))
            toast.success('Groceries logged as an expense! 🎉')
          }}
          prefill={{
            amount: getListTotal(checkoutList).toFixed(2),
            description: `Groceries: ${checkoutList.name}`,
            category: 'GROCERIES',
          }}
        />
      )}
    </div>
  )
}
