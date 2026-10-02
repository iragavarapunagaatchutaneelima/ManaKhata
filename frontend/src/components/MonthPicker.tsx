'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { addMonths, monthKey, monthLabel } from '@/lib/money'
import { IconButton } from './ui'

export function MonthPicker({ value, onChange }: { value: string; onChange: (key: string) => void }) {
  const current = monthKey(new Date())
  return (
    <div className="inline-flex items-center rounded-[10px] border border-line bg-surface">
      <IconButton label="Previous month" onClick={() => onChange(addMonths(value, -1))}><ChevronLeft size={18} /></IconButton>
      <span className="min-w-[120px] text-center text-sm font-semibold text-ink">{monthLabel(value, 'long')}</span>
      <IconButton label="Next month" disabled={value >= current} onClick={() => onChange(addMonths(value, 1))}><ChevronRight size={18} /></IconButton>
    </div>
  )
}
