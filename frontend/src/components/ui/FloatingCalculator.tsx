'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import { Calculator, X, Minus } from 'lucide-react'

const BUTTONS = [
  ['C', '±', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['0', '.', '⌫', '='],
]

export default function FloatingCalculator() {
  const [open, setOpen] = useState(false)
  const [display, setDisplay] = useState('0')
  const [prev, setPrev] = useState('')
  const [op, setOp] = useState('')
  const [fresh, setFresh] = useState(false)
  const dragControls = useDragControls()

  const press = useCallback((btn: string) => {
    if (btn === 'C') {
      setDisplay('0'); setPrev(''); setOp(''); setFresh(false); return
    }
    if (btn === '⌫') {
      setDisplay(d => d.length <= 1 ? '0' : d.slice(0, -1)); return
    }
    if (btn === '±') {
      setDisplay(d => d.startsWith('-') ? d.slice(1) : d === '0' ? '0' : '-' + d); return
    }
    if (btn === '%') {
      setDisplay(d => String(parseFloat(d) / 100)); return
    }
    if (['÷', '×', '−', '+'].includes(btn)) {
      setPrev(display); setOp(btn); setFresh(true); return
    }
    if (btn === '=') {
      if (!op || !prev) return
      const a = parseFloat(prev), b = parseFloat(display)
      let result: number
      switch (op) {
        case '+': result = a + b; break
        case '−': result = a - b; break
        case '×': result = a * b; break
        case '÷': result = b !== 0 ? a / b : 0; break
        default: return
      }
      setDisplay(String(Math.round(result * 1e10) / 1e10))
      setPrev(''); setOp(''); setFresh(true)
      return
    }
    if (btn === '.') {
      if (fresh) { setDisplay('0.'); setFresh(false); return }
      if (!display.includes('.')) setDisplay(d => d + '.')
      return
    }
    if (fresh) { setDisplay(btn); setFresh(false) }
    else setDisplay(d => d === '0' ? btn : d + btn)
  }, [display, op, prev, fresh])

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        id="floating-calculator"
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-2xl gradient-brand flex items-center justify-center shadow-glow-brand text-white"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        animate={{ rotate: open ? 45 : 0 }}
      >
        {open ? <X size={20} /> : <Calculator size={20} />}
      </motion.button>

      {/* Calculator Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            drag
            dragControls={dragControls}
            dragMomentum={false}
            dragElastic={0.1}
            className="fixed bottom-24 right-6 z-50 w-64 rounded-3xl overflow-hidden select-none"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
            }}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header / Drag Handle */}
            <div
              className="px-4 py-3 flex items-center gap-2 cursor-grab active:cursor-grabbing"
              style={{ background: 'rgba(99,102,241,0.10)', borderBottom: '1px solid var(--border-color)' }}
              onPointerDown={e => dragControls.start(e)}
            >
              <Calculator size={14} className="text-brand-400" />
              <span className="text-xs font-semibold text-brand-400">Smart Calculator</span>
              <span className="ml-auto text-[10px]" style={{ color: 'var(--text-muted)' }}>drag to move</span>
            </div>

            {/* Display */}
            <div className="px-4 pt-4 pb-2 text-right">
              {op && (
                <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                  {prev} {op}
                </div>
              )}
              <div className="font-display font-bold text-3xl truncate" style={{ color: 'var(--text-primary)' }}>
                {display}
              </div>
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-4 gap-1.5 p-3">
              {BUTTONS.flat().map((btn, i) => {
                const isOp = ['÷', '×', '−', '+'].includes(btn)
                const isEq = btn === '='
                const isClear = btn === 'C'
                return (
                  <button
                    key={i}
                    id={`calc-btn-${btn.replace(/[^a-zA-Z0-9]/g, '_')}`}
                    onClick={() => press(btn)}
                    className={`calc-btn ${isOp ? 'calc-btn-op' : isEq ? 'calc-btn-eq' : isClear ? '!text-rose-400' : ''}`}
                    style={btn === '0' ? { gridColumn: 'span 1' } : {}}
                  >
                    {btn}
                  </button>
                )
              })}
            </div>

            {/* Quick tally */}
            <div className="px-3 pb-3">
              <div className="px-3 py-2 rounded-xl text-center text-xs"
                style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)' }}>
                Result: <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                  {display !== '0' && !isNaN(parseFloat(display))
                    ? `₹ ${parseFloat(display).toLocaleString('en-IN')}`
                    : '—'}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
