// Money and date helpers.
//
// Amounts are stored as rupees with 2 decimals (numeric(14,2) in Postgres).
// All arithmetic goes through integer paise so totals never drift
// (0.1 + 0.2 style float errors would otherwise show up in long ledgers).

export const toMinor = (amount: number | string | null | undefined) => Math.round(Number(amount || 0) * 100)
export const fromMinor = (minor: number) => minor / 100

/** Exact sum of money values. */
export function sumMoney<T>(rows: readonly T[], pick: (row: T) => number | string | null | undefined): number {
  let total = 0
  for (const row of rows) total += toMinor(pick(row))
  return fromMinor(total)
}

export const addMoney = (...values: number[]) => fromMinor(values.reduce((t, v) => t + toMinor(v), 0))
export const subMoney = (a: number, b: number) => fromMinor(toMinor(a) - toMinor(b))

/**
 * Split an amount into `parts` shares that add up exactly to the amount.
 * The leftover paise go to the first shares (₹100 / 3 -> 33.34, 33.33, 33.33).
 */
export function splitEvenly(amount: number, parts: number): number[] {
  if (parts <= 0) return []
  const minor = toMinor(amount)
  const base = Math.floor(minor / parts)
  let remainder = minor - base * parts
  return Array.from({ length: parts }, () => {
    const share = base + (remainder > 0 ? 1 : 0)
    if (remainder > 0) remainder--
    return fromMinor(share)
  })
}

export function formatMoney(amount: number, currency = 'INR', opts: { decimals?: boolean; sign?: boolean } = {}): string {
  const value = Number.isFinite(amount) ? amount : 0
  const fractionDigits = opts.decimals ? 2 : 0
  let text: string
  try {
    text = new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en', {
      style: 'currency',
      currency: currency || 'INR',
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(Math.abs(value))
  } catch {
    text = `${currency} ${Math.abs(value).toFixed(fractionDigits)}`
  }
  if (value < 0) return `−${text}`
  return opts.sign && value > 0 ? `+${text}` : text
}

/** ₹1.2L / ₹3.4Cr / $12K for tight spaces like chart axes. */
export function formatCompact(amount: number, currency = 'INR'): string {
  const abs = Math.abs(amount)
  const sign = amount < 0 ? '−' : ''
  const symbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : `${currency} `
  if (currency === 'INR') {
    if (abs >= 1e7) return `${sign}${symbol}${trim(abs / 1e7)}Cr`
    if (abs >= 1e5) return `${sign}${symbol}${trim(abs / 1e5)}L`
    if (abs >= 1e3) return `${sign}${symbol}${trim(abs / 1e3)}K`
  } else {
    if (abs >= 1e9) return `${sign}${symbol}${trim(abs / 1e9)}B`
    if (abs >= 1e6) return `${sign}${symbol}${trim(abs / 1e6)}M`
    if (abs >= 1e3) return `${sign}${symbol}${trim(abs / 1e3)}K`
  }
  return `${sign}${symbol}${Math.round(abs)}`
}

const trim = (n: number) => (Math.round(n * 10) / 10).toString()

export const formatPercent = (value: number, digits = 0) =>
  `${Number.isFinite(value) ? value.toFixed(digits) : '0'}%`

/** Parse user-typed money ("1,250.50") into a number, or NaN. */
export function parseMoney(input: string): number {
  const cleaned = input.replace(/[,\s₹]/g, '')
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return NaN
  return Number(cleaned)
}

// ── Dates (always local calendar dates, never UTC-shifted) ───────────────────

export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const today = () => toISODate(new Date())

/** 'YYYY-MM' for a date string or Date. */
export const monthKey = (d: string | Date) => (typeof d === 'string' ? d.slice(0, 7) : toISODate(d).slice(0, 7))

export function parseISODate(s: string): Date {
  const [y, m, d] = s.slice(0, 10).split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export function addMonths(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return monthKey(d)
}

/** The last `n` month keys ending with `endKey` (oldest first). */
export const lastMonths = (endKey: string, n: number) =>
  Array.from({ length: n }, (_, i) => addMonths(endKey, i - (n - 1)))

export function monthLabel(key: string, style: 'short' | 'long' = 'short'): string {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleString('en-IN', { month: style, ...(style === 'long' ? { year: 'numeric' } : {}) })
}

export function daysInMonth(key: string): number {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

export function daysBetween(from: string, to: string): number {
  return Math.round((parseISODate(to).getTime() - parseISODate(from).getTime()) / 86_400_000)
}

export function formatDate(s: string | null | undefined, style: 'short' | 'long' = 'short'): string {
  if (!s) return '—'
  const d = s.length <= 10 ? parseISODate(s) : new Date(s)
  return d.toLocaleDateString('en-IN', style === 'short' ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' })
}

export function relativeDay(s: string): string {
  const diff = daysBetween(today(), s.slice(0, 10))
  if (diff === 0) return 'Today'
  if (diff === -1) return 'Yesterday'
  if (diff === 1) return 'Tomorrow'
  if (diff < 0 && diff > -7) return `${-diff} days ago`
  if (diff > 0 && diff < 7) return `In ${diff} days`
  return formatDate(s, 'long')
}

/** Indian financial year label ('2026-27') for a date. FY runs April–March. */
export function financialYear(d: Date = new Date()): string {
  const start = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1
  return `${start}-${String((start + 1) % 100).padStart(2, '0')}`
}
