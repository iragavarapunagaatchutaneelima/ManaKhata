// ManaKhata calculation engine.
//
// Every figure shown in the app is derived here from raw ledger rows, so the
// demo household and real households follow exactly the same maths. All money
// arithmetic goes through integer paise (see money.ts). Each function is pure
// and covered by finance.test.ts.

import type {
  Budget, Expense, ExpenseSplit, Goal, GoalContribution, ID, Income, InsurancePolicy, Investment,
  LedgerData, Member, RecurringBill, TaxDocument, TaxSection, Trip, TripExpense, VehicleExpense, WalletTransaction,
} from './model'
import {
  addMonths, daysBetween, daysInMonth, fromMinor, lastMonths, monthKey, monthLabel, parseISODate, sumMoney, toMinor,
} from './money'
import { category } from './categories'

// ── Spending & income ────────────────────────────────────────────────────────

export const inMonth = (date: string, key: string) => date.slice(0, 7) === key

/** Household spending: everything shared with the household in that month. */
export function householdSpend(expenses: Expense[], key: string): number {
  return sumMoney(expenses.filter((e) => e.visibility === 'HOUSEHOLD' && inMonth(e.expense_date, key)), (e) => e.amount)
}

/**
 * A member's real share of spending in a month (Splitwise-style):
 * what they paid, minus what others owe them back, plus what they owe others.
 */
export function memberShare(expenses: Expense[], splits: ExpenseSplit[], userId: ID, key: string): number {
  const monthIds = new Set(expenses.filter((e) => inMonth(e.expense_date, key)).map((e) => e.id))
  let minor = 0
  for (const e of expenses) if (e.paid_by === userId && monthIds.has(e.id)) minor += toMinor(e.amount)
  for (const s of splits) {
    if (!monthIds.has(s.expense_id)) continue
    if (s.owed_to === userId) minor -= toMinor(s.amount)
    if (s.owed_by === userId) minor += toMinor(s.amount)
  }
  return fromMinor(minor)
}

/** Declared monthly income plus any extra income entries recorded that month. */
export function memberIncome(members: Member[], incomes: Income[], userId: ID, key: string): number {
  const member = members.find((m) => m.user_id === userId)
  // Declared salary only counts from the month the person joined the household.
  const declared = member && (!member.joined_at || member.joined_at.slice(0, 7) <= key) ? member.monthly_income : 0
  const extra = sumMoney(incomes.filter((i) => i.user_id === userId && inMonth(i.income_date, key)), (i) => i.amount)
  return fromMinor(toMinor(declared) + toMinor(extra))
}

export function householdIncome(members: Member[], incomes: Income[], key: string): number {
  return fromMinor(members.reduce((t, m) => t + toMinor(memberIncome(members, incomes, m.user_id, key)), 0))
}

export interface MonthSummary {
  key: string
  income: number
  spent: number
  saved: number
  /** Saved / income, 0–100 (can go negative when overspending). */
  savingsRate: number
}

export function summarize(income: number, spent: number, key: string): MonthSummary {
  const saved = fromMinor(toMinor(income) - toMinor(spent))
  return { key, income, spent, saved, savingsRate: income > 0 ? (saved / income) * 100 : 0 }
}

export interface CategorySlice { category: string; label: string; color: string; amount: number; share: number; count: number }

export function categoryBreakdown(expenses: Expense[]): CategorySlice[] {
  const totals = new Map<string, { minor: number; count: number }>()
  let all = 0
  for (const e of expenses) {
    const t = totals.get(e.category) ?? { minor: 0, count: 0 }
    t.minor += toMinor(e.amount); t.count++
    totals.set(e.category, t)
    all += toMinor(e.amount)
  }
  return [...totals.entries()]
    .map(([key, t]) => ({
      category: key, label: category(key).label, color: category(key).color,
      amount: fromMinor(t.minor), share: all > 0 ? (t.minor / all) * 100 : 0, count: t.count,
    }))
    .sort((a, b) => b.amount - a.amount)
}

export interface TrendPoint { key: string; label: string; spent: number; income: number; saved: number }

export function householdTrend(data: Pick<LedgerData, 'expenses' | 'incomes' | 'members'>, endKey: string, months = 6): TrendPoint[] {
  return lastMonths(endKey, months).map((key) => {
    const spent = householdSpend(data.expenses, key)
    const income = householdIncome(data.members, data.incomes, key)
    return { key, label: monthLabel(key), spent, income, saved: fromMinor(toMinor(income) - toMinor(spent)) }
  })
}

export function memberTrend(data: Pick<LedgerData, 'expenses' | 'incomes' | 'members' | 'splits'>, userId: ID, endKey: string, months = 6): TrendPoint[] {
  return lastMonths(endKey, months).map((key) => {
    const spent = memberShare(data.expenses, data.splits, userId, key)
    const income = memberIncome(data.members, data.incomes, userId, key)
    return { key, label: monthLabel(key), spent, income, saved: fromMinor(toMinor(income) - toMinor(spent)) }
  })
}

export interface MemberSpend { userId: ID; name: string; paid: number; share: number }

export function spendByMember(data: Pick<LedgerData, 'expenses' | 'splits' | 'members'>, key: string): MemberSpend[] {
  return data.members
    .map((m) => ({
      userId: m.user_id,
      name: m.full_name,
      paid: sumMoney(data.expenses.filter((e) => e.paid_by === m.user_id && e.visibility === 'HOUSEHOLD' && inMonth(e.expense_date, key)), (e) => e.amount),
      share: memberShare(data.expenses, data.splits, m.user_id, key),
    }))
    .sort((a, b) => b.paid - a.paid)
}

// ── Budgets ─────────────────────────────────────────────────────────────────

export type BudgetStatus = 'ok' | 'warn' | 'over'

export interface BudgetProgress {
  budget: Budget
  spent: number
  remaining: number
  percent: number
  status: BudgetStatus
  /** Straight-line projection of month-end spend (only for the current month). */
  projected: number | null
}

export function budgetProgress(budget: Budget, expenses: Expense[], key: string, todayISO: string): BudgetProgress {
  const relevant = expenses.filter((e) =>
    e.category === budget.category && inMonth(e.expense_date, key) &&
    (budget.user_id ? e.paid_by === budget.user_id : e.visibility === 'HOUSEHOLD'))
  const spent = sumMoney(relevant, (e) => e.amount)
  const percent = budget.monthly_limit > 0 ? (spent / budget.monthly_limit) * 100 : 0
  const status: BudgetStatus = percent >= 100 ? 'over' : percent >= budget.alert_at_percent ? 'warn' : 'ok'
  let projected: number | null = null
  if (monthKey(todayISO) === key) {
    const day = parseISODate(todayISO).getDate()
    projected = fromMinor(Math.round((toMinor(spent) / day) * daysInMonth(key)))
  }
  return { budget, spent, remaining: fromMinor(toMinor(budget.monthly_limit) - toMinor(spent)), percent, status, projected }
}

// ── Splits, balances & debt simplification ──────────────────────────────────

/** Net position per person from open splits: positive = is owed money. */
export function netBalances(splits: ExpenseSplit[]): Map<ID, number> {
  const minor = new Map<ID, number>()
  for (const s of splits) {
    if (s.settled_at) continue
    minor.set(s.owed_to, (minor.get(s.owed_to) ?? 0) + toMinor(s.amount))
    minor.set(s.owed_by, (minor.get(s.owed_by) ?? 0) - toMinor(s.amount))
  }
  return new Map([...minor].map(([k, v]) => [k, fromMinor(v)]))
}

export interface PairDebt { debtor: ID; creditor: ID; amount: number }

/** Open amounts per (debtor -> creditor) pair, netted in both directions. */
export function pairwiseDebts(splits: ExpenseSplit[]): PairDebt[] {
  const owed = new Map<string, number>()
  for (const s of splits) {
    if (s.settled_at) continue
    const k = `${s.owed_by}|${s.owed_to}`
    owed.set(k, (owed.get(k) ?? 0) + toMinor(s.amount))
  }
  const result: PairDebt[] = []
  const seen = new Set<string>()
  for (const [k, v] of owed) {
    const [a, b] = k.split('|')
    const pair = [a, b].sort().join('|')
    if (seen.has(pair)) continue
    seen.add(pair)
    const net = v - (owed.get(`${b}|${a}`) ?? 0)
    if (net > 0) result.push({ debtor: a, creditor: b, amount: fromMinor(net) })
    else if (net < 0) result.push({ debtor: b, creditor: a, amount: fromMinor(-net) })
  }
  return result.sort((x, y) => y.amount - x.amount)
}

/**
 * Minimum-transfer settle-up plan: repeatedly match the largest debtor with the
 * largest creditor. Produces at most n−1 payments for n people.
 */
export function simplifyDebts(balances: Map<ID, number>): PairDebt[] {
  const creditors: [ID, number][] = []
  const debtors: [ID, number][] = []
  for (const [id, amount] of balances) {
    const m = toMinor(amount)
    if (m > 0) creditors.push([id, m])
    else if (m < 0) debtors.push([id, -m])
  }
  const plan: PairDebt[] = []
  while (creditors.length && debtors.length) {
    creditors.sort((a, b) => b[1] - a[1])
    debtors.sort((a, b) => b[1] - a[1])
    const [cId, cAmt] = creditors[0]
    const [dId, dAmt] = debtors[0]
    const pay = Math.min(cAmt, dAmt)
    plan.push({ debtor: dId, creditor: cId, amount: fromMinor(pay) })
    creditors[0][1] -= pay
    debtors[0][1] -= pay
    if (creditors[0][1] === 0) creditors.shift()
    if (debtors[0][1] === 0) debtors.shift()
  }
  return plan
}

// ── Wallet ──────────────────────────────────────────────────────────────────

export function walletBalance(tx: WalletTransaction[], userId: ID): number {
  let minor = 0
  for (const t of tx) {
    if (t.to_user === userId) minor += toMinor(t.amount)
    if (t.from_user === userId) minor -= toMinor(t.amount)
  }
  return fromMinor(minor)
}

export function walletBalances(tx: WalletTransaction[], members: Member[]): Map<ID, number> {
  return new Map(members.map((m) => [m.user_id, walletBalance(tx, m.user_id)]))
}

// ── Bills ───────────────────────────────────────────────────────────────────

const PER_MONTH: Record<string, number> = { WEEKLY: 52 / 12, MONTHLY: 1, QUARTERLY: 1 / 3, YEARLY: 1 / 12 }

/** Average monthly cost of all active recurring bills. */
export function monthlyBillLoad(bills: RecurringBill[]): number {
  return fromMinor(Math.round(bills.filter((b) => b.is_active).reduce((t, b) => t + toMinor(b.amount) * (PER_MONTH[b.frequency] ?? 1), 0)))
}

export interface BillDue { bill: RecurringBill; daysLeft: number; overdue: boolean }

export function billsDue(bills: RecurringBill[], todayISO: string, horizonDays = 30): BillDue[] {
  return bills
    .filter((b) => b.is_active)
    .map((bill) => ({ bill, daysLeft: daysBetween(todayISO, bill.next_due_date), overdue: bill.next_due_date < todayISO }))
    .filter((d) => d.daysLeft <= horizonDays)
    .sort((a, b) => a.daysLeft - b.daysLeft)
}

// ── Goals ───────────────────────────────────────────────────────────────────

export interface GoalProgress {
  goal: Goal
  saved: number
  remaining: number
  percent: number
  monthsLeft: number | null
  /** Amount to set aside each month to hit the target date. */
  requiredMonthly: number | null
  done: boolean
}

export function goalProgress(goal: Goal, contributions: GoalContribution[], todayISO: string): GoalProgress {
  const saved = sumMoney(contributions.filter((c) => c.goal_id === goal.id), (c) => c.amount)
  const remainingMinor = Math.max(0, toMinor(goal.target_amount) - toMinor(saved))
  let monthsLeft: number | null = null
  let requiredMonthly: number | null = null
  if (goal.target_date) {
    const days = daysBetween(todayISO, goal.target_date)
    monthsLeft = Math.max(0, Math.ceil(days / 30.4375))
    requiredMonthly = remainingMinor === 0 ? 0 : fromMinor(Math.ceil(remainingMinor / Math.max(1, monthsLeft)))
  }
  return {
    goal, saved, remaining: fromMinor(remainingMinor),
    percent: Math.min(100, (saved / goal.target_amount) * 100),
    monthsLeft, requiredMonthly, done: remainingMinor === 0,
  }
}

// ── Investments & insurance ─────────────────────────────────────────────────

export const LIQUID_ASSETS = new Set(['FIXED_DEPOSIT', 'RECURRING_DEPOSIT', 'MUTUAL_FUND', 'BOND'])

export interface PortfolioSummary {
  invested: number
  current: number
  gain: number
  gainPercent: number
  liquid: number
  allocation: { type: string; value: number; share: number }[]
}

export function portfolio(investments: Investment[]): PortfolioSummary {
  const invested = sumMoney(investments, (i) => i.invested_amount)
  const current = sumMoney(investments, (i) => i.current_value)
  const gain = fromMinor(toMinor(current) - toMinor(invested))
  const byType = new Map<string, number>()
  for (const i of investments) byType.set(i.asset_type, (byType.get(i.asset_type) ?? 0) + toMinor(i.current_value))
  const currentMinor = toMinor(current)
  return {
    invested, current, gain,
    gainPercent: invested > 0 ? (gain / invested) * 100 : 0,
    liquid: sumMoney(investments.filter((i) => LIQUID_ASSETS.has(i.asset_type)), (i) => i.current_value),
    allocation: [...byType].map(([type, v]) => ({ type, value: fromMinor(v), share: currentMinor > 0 ? (v / currentMinor) * 100 : 0 }))
      .sort((a, b) => b.value - a.value),
  }
}

/** Annualised return (CAGR) for a holding with a purchase date, else null. */
export function cagr(inv: Investment, todayISO: string): number | null {
  if (!inv.investment_date || inv.invested_amount <= 0) return null
  const years = daysBetween(inv.investment_date, todayISO) / 365.25
  if (years < 1) return null // annualising short periods is misleading
  return (Math.pow(inv.current_value / inv.invested_amount, 1 / years) - 1) * 100
}

const PREMIUMS_PER_YEAR: Record<string, number> = { MONTHLY: 12, QUARTERLY: 4, YEARLY: 1 }

export function annualPremiums(policies: InsurancePolicy[]): number {
  return fromMinor(policies.reduce((t, p) => t + toMinor(p.premium_amount) * (PREMIUMS_PER_YEAR[p.premium_frequency] ?? 1), 0))
}

// ── Tax (India, old regime) ─────────────────────────────────────────────────

export const TAX_LIMITS: Record<TaxSection, { label: string; limit: number | null; note: string }> = {
  '80C':         { label: '80C — PPF, ELSS, EPF, LIC, tuition, home-loan principal', limit: 150000, note: 'Combined cap with 80CCC and 80CCD(1).' },
  '80CCD_1B':    { label: '80CCD(1B) — extra NPS contribution', limit: 50000, note: 'Over and above the 80C limit.' },
  '80D_SELF':    { label: '80D — health insurance (self, spouse, children)', limit: 25000, note: '₹50,000 if you are a senior citizen.' },
  '80D_PARENTS': { label: '80D — health insurance (parents)', limit: 25000, note: '₹50,000 if parents are senior citizens.' },
  '24B':         { label: '24(b) — home-loan interest (self-occupied)', limit: 200000, note: 'Per property, self-occupied.' },
  '80E':         { label: '80E — education-loan interest', limit: null, note: 'No upper limit, for up to 8 years.' },
  '80G':         { label: '80G — donations', limit: null, note: '50% or 100% of the donation depending on the fund.' },
  '80TTA':       { label: '80TTA — savings-account interest', limit: 10000, note: '80TTB (₹50,000) applies to senior citizens instead.' },
  'HRA':         { label: 'HRA exemption', limit: null, note: 'Least of the three HRA rules; check your salary slip.' },
  'OTHER':       { label: 'Other deductions', limit: null, note: '' },
}

export interface TaxLine { section: TaxSection; label: string; claimed: number; limit: number | null; eligible: number; headroom: number | null; note: string }

export function taxSummary(docs: TaxDocument[], fy: string): { lines: TaxLine[]; totalEligible: number } {
  const lines = (Object.keys(TAX_LIMITS) as TaxSection[]).map((section) => {
    const claimed = sumMoney(docs.filter((d) => d.section === section && d.financial_year === fy), (d) => d.amount)
    const { label, limit, note } = TAX_LIMITS[section]
    const eligible = limit === null ? claimed : Math.min(claimed, limit)
    return { section, label, claimed, limit, eligible, headroom: limit === null ? null : Math.max(0, limit - claimed), note }
  })
  return { lines, totalEligible: sumMoney(lines, (l) => l.eligible) }
}

// ── Trips & vehicles ────────────────────────────────────────────────────────

/** Trip spend converted to the trip's base currency. */
export function tripSpent(trip: Trip, expenses: TripExpense[]): number {
  return fromMinor(expenses
    .filter((e) => e.trip_id === trip.id)
    .reduce((t, e) => t + Math.round(toMinor(e.amount) * (e.currency_code === trip.base_currency ? 1 : e.exchange_rate)), 0))
}

export interface VehicleStats {
  total: number
  fuel: number
  maintenance: number
  /** km per litre, full-tank method across consecutive fuel entries with odometer readings. */
  kmPerLitre: number | null
  /** running cost per km across the odometer range. */
  costPerKm: number | null
  lastOdometer: number | null
}

export function vehicleStats(expenses: VehicleExpense[]): VehicleStats {
  const total = sumMoney(expenses, (e) => e.amount)
  const fuel = sumMoney(expenses.filter((e) => e.expense_type === 'FUEL'), (e) => e.amount)
  const fills = expenses
    .filter((e) => e.expense_type === 'FUEL' && e.odometer_km != null && e.litres)
    .sort((a, b) => (a.odometer_km! - b.odometer_km!))
  let kmPerLitre: number | null = null
  if (fills.length >= 2) {
    const distance = fills[fills.length - 1].odometer_km! - fills[0].odometer_km!
    // Litres bought after the first fill are what was burnt to cover the distance.
    const litres = fills.slice(1).reduce((t, f) => t + Number(f.litres), 0)
    kmPerLitre = litres > 0 && distance > 0 ? distance / litres : null
  }
  const readings = expenses.filter((e) => e.odometer_km != null).map((e) => e.odometer_km!)
  const range = readings.length >= 2 ? Math.max(...readings) - Math.min(...readings) : 0
  return {
    total, fuel, maintenance: fromMinor(toMinor(total) - toMinor(fuel)),
    kmPerLitre,
    costPerKm: range > 0 ? total / range : null,
    lastOdometer: readings.length ? Math.max(...readings) : null,
  }
}

// ── Financial health score ──────────────────────────────────────────────────

export interface HealthComponent { key: string; label: string; score: number; weight: number; detail: string }
export interface HealthScore { score: number; grade: 'A' | 'B' | 'C' | 'D' | 'F'; label: string; components: HealthComponent[] }

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n))

/**
 * Weighted 0–100 score from five standard personal-finance indicators:
 *  savings rate (target ≥ 30%), emergency fund (target 6 months of expenses),
 *  budget adherence, month-to-month spending stability, and protection
 *  (health cover + life cover of 10× annual income).
 */
export function healthScore(data: LedgerData, todayISO: string): HealthScore {
  const key = monthKey(todayISO)
  const prev = addMonths(key, -1)
  // Use last complete month when the current month has barely started.
  const refKey = parseISODate(todayISO).getDate() < 10 ? prev : key
  const income = householdIncome(data.members, data.incomes, refKey)
  const spent = householdSpend(data.expenses, refKey)
  const rate = income > 0 ? ((income - spent) / income) * 100 : 0
  const savingsScore = clamp((rate / 30) * 100)

  const months = lastMonths(prev, 6).map((k) => householdSpend(data.expenses, k)).filter((v) => v > 0)
  const avgSpend = months.length ? months.reduce((a, b) => a + b, 0) / months.length : spent
  const liquid = portfolio(data.investments).liquid + sumMoney(data.members, (m) => walletBalance(data.wallet, m.user_id))
  const emergencyMonths = avgSpend > 0 ? liquid / avgSpend : 0
  const emergencyScore = clamp((emergencyMonths / 6) * 100)

  const progress = data.budgets.map((b) => budgetProgress(b, data.expenses, refKey, todayISO))
  const budgetScore = progress.length ? (progress.filter((p) => p.status !== 'over').length / progress.length) * 100 : 50

  let stabilityScore = 50
  if (months.length >= 3) {
    const mean = avgSpend
    const sd = Math.sqrt(months.reduce((t, v) => t + (v - mean) ** 2, 0) / months.length)
    const cv = mean > 0 ? sd / mean : 0
    stabilityScore = clamp(100 - (cv / 0.5) * 100)
  }

  const hasHealth = data.policies.some((p) => p.policy_type === 'HEALTH')
  const lifeCover = sumMoney(data.policies.filter((p) => p.policy_type === 'TERM_LIFE' || p.policy_type === 'LIFE'), (p) => p.coverage_amount)
  const annualIncome = sumMoney(data.members, (m) => m.monthly_income) * 12
  const lifeScore = annualIncome > 0 ? clamp((lifeCover / (annualIncome * 10)) * 100) : (lifeCover > 0 ? 100 : 0)
  const protectionScore = (hasHealth ? 50 : 0) + lifeScore / 2

  const components: HealthComponent[] = [
    { key: 'savings', label: 'Savings rate', weight: 30, score: Math.round(savingsScore), detail: `${rate.toFixed(0)}% of income saved in ${monthLabel(refKey, 'long')} (target 30%)` },
    { key: 'emergency', label: 'Emergency fund', weight: 25, score: Math.round(emergencyScore), detail: `${emergencyMonths.toFixed(1)} months of expenses in liquid savings (target 6)` },
    { key: 'budgets', label: 'Budget discipline', weight: 15, score: Math.round(budgetScore), detail: progress.length ? `${progress.filter((p) => p.status !== 'over').length} of ${progress.length} budgets on track` : 'No budgets set yet' },
    { key: 'stability', label: 'Spending stability', weight: 15, score: Math.round(stabilityScore), detail: months.length >= 3 ? 'Based on the last 6 months of household spending' : 'Needs 3 months of history' },
    { key: 'protection', label: 'Protection', weight: 15, score: Math.round(protectionScore), detail: `${hasHealth ? 'Health cover in place' : 'No health cover'} · life cover ${annualIncome > 0 ? `${(lifeCover / annualIncome).toFixed(1)}× annual income (target 10×)` : 'not linked to income'}` },
  ]
  const score = Math.round(components.reduce((t, c) => t + c.score * c.weight, 0) / 100)
  const grade = score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : score >= 40 ? 'D' : 'F'
  const label = { A: 'Excellent', B: 'Good', C: 'Fair', D: 'Needs attention', F: 'At risk' }[grade]
  return { score, grade, label, components }
}

// ── Forecasts & insights ────────────────────────────────────────────────────

export interface Forecast { category: string; label: string; predicted: number; lastMonth: number; changePercent: number }

/** Next-month estimate per category: weighted average of the last 3 complete months (3:2:1). */
export function forecastNextMonth(expenses: Expense[], todayISO: string): Forecast[] {
  const current = monthKey(todayISO)
  const [m1, m2, m3] = [addMonths(current, -1), addMonths(current, -2), addMonths(current, -3)]
  const shared = expenses.filter((e) => e.visibility === 'HOUSEHOLD')
  const cats = new Set(shared.filter((e) => [m1, m2, m3].includes(monthKey(e.expense_date))).map((e) => e.category))
  return [...cats].map((cat) => {
    const of = (k: string) => sumMoney(shared.filter((e) => e.category === cat && inMonth(e.expense_date, k)), (e) => e.amount)
    const [a, b, c] = [of(m1), of(m2), of(m3)]
    const predicted = fromMinor(Math.round((toMinor(a) * 3 + toMinor(b) * 2 + toMinor(c)) / 6))
    return { category: cat, label: category(cat).label, predicted, lastMonth: a, changePercent: a > 0 ? ((predicted - a) / a) * 100 : 0 }
  }).sort((x, y) => y.predicted - x.predicted)
}

export interface Insight { id: string; tone: 'good' | 'warn' | 'info'; title: string; body: string }

export function insights(data: LedgerData, todayISO: string): Insight[] {
  const out: Insight[] = []
  const key = monthKey(todayISO)
  const prev = addMonths(key, -1)
  const cur = categoryBreakdown(data.expenses.filter((e) => e.visibility === 'HOUSEHOLD' && inMonth(e.expense_date, key)))
  const last = categoryBreakdown(data.expenses.filter((e) => e.visibility === 'HOUSEHOLD' && inMonth(e.expense_date, prev)))
  const day = parseISODate(todayISO).getDate()
  const share = day / daysInMonth(key)

  for (const p of data.budgets.map((b) => budgetProgress(b, data.expenses, key, todayISO))) {
    if (p.status === 'over') out.push({ id: `over-${p.budget.id}`, tone: 'warn', title: `${category(p.budget.category).label} budget exceeded`, body: `Spent ${pct(p.percent)} of the monthly limit.` })
    else if (p.projected && p.projected > p.budget.monthly_limit && share < 0.9) out.push({ id: `pace-${p.budget.id}`, tone: 'warn', title: `${category(p.budget.category).label} is on pace to overshoot`, body: `At this rate the month ends ${pct((p.projected / p.budget.monthly_limit) * 100)} of budget.` })
  }

  for (const c of cur.slice(0, 5)) {
    const before = last.find((l) => l.category === c.category)?.amount ?? 0
    if (before > 0 && share >= 0.5 && c.amount > before * 1.25) {
      out.push({ id: `jump-${c.category}`, tone: 'info', title: `${c.label} up ${pct(((c.amount - before) / before) * 100)}`, body: `Compared with all of ${monthLabel(prev, 'long')}.` })
    }
  }

  for (const d of billsDue(data.bills, todayISO, 5)) {
    out.push({ id: `bill-${d.bill.id}`, tone: d.overdue ? 'warn' : 'info', title: d.overdue ? `${d.bill.name} is overdue` : `${d.bill.name} due ${d.daysLeft === 0 ? 'today' : `in ${d.daysLeft} day${d.daysLeft === 1 ? '' : 's'}`}`, body: `${money(d.bill.amount)} · ${d.bill.frequency.toLowerCase()} bill` })
  }

  const open = pairwiseDebts(data.splits)
  if (open.length) out.push({ id: 'splits', tone: 'info', title: `${open.length} open balance${open.length > 1 ? 's' : ''} between family members`, body: 'Settle up from Split & settle to keep things fair.' })

  const prevSummary = summarize(householdIncome(data.members, data.incomes, prev), householdSpend(data.expenses, prev), prev)
  if (prevSummary.income > 0 && prevSummary.savingsRate >= 30) out.push({ id: 'saver', tone: 'good', title: `Saved ${pct(prevSummary.savingsRate)} last month`, body: 'Consider moving the surplus into a goal or investment.' })
  else if (prevSummary.income > 0 && prevSummary.savingsRate < 10) out.push({ id: 'lowsave', tone: 'warn', title: `Only ${pct(Math.max(prevSummary.savingsRate, 0))} saved last month`, body: 'Check the largest categories for things to trim.' })

  for (const p of data.policies) {
    if (p.expiry_date) {
      const days = daysBetween(todayISO, p.expiry_date)
      if (days >= 0 && days <= 30) out.push({ id: `policy-${p.id}`, tone: 'warn', title: `${p.provider} policy renews in ${days} days`, body: 'Renew before expiry to keep your cover continuous.' })
    }
  }
  return out
}

const pct = (n: number) => `${Math.round(n)}%`
const money = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`

// ── Achievements (computed, nothing stored) ─────────────────────────────────

export interface Achievement { id: string; title: string; description: string; earned: boolean; progress: number }

export function achievements(data: LedgerData, userId: ID, todayISO: string): Achievement[] {
  const myExpenses = data.expenses.filter((e) => e.created_by === userId || e.paid_by === userId)
  const prev = addMonths(monthKey(todayISO), -1)
  const budgetsKept = data.budgets.length > 0 && data.budgets.every((b) => budgetProgress(b, data.expenses, prev, todayISO).status !== 'over')
  const goalsDone = data.goals.filter((g) => goalProgress(g, data.contributions, todayISO).done).length
  const choresDone = data.chores.filter((c) => c.assigned_to === userId && c.status === 'APPROVED').length
  const daysLogged = new Set(myExpenses.map((e) => e.expense_date)).size
  const settled = data.splits.filter((s) => s.settled_at && (s.owed_by === userId || s.owed_to === userId)).length
  const list: [string, string, string, number, number][] = [
    ['first-entry', 'First entry', 'Record your first expense.', myExpenses.length, 1],
    ['steady-logger', 'Steady logger', 'Log spending on 20 different days.', daysLogged, 20],
    ['budget-keeper', 'Budget keeper', 'Stay within every budget for a full month.', budgetsKept ? 1 : 0, 1],
    ['goal-getter', 'Goal getter', 'Reach a savings goal.', goalsDone, 1],
    ['helping-hand', 'Helping hand', 'Get 5 chores approved.', choresDone, 5],
    ['fair-share', 'Fair share', 'Settle 3 split balances.', settled, 3],
  ]
  return list.map(([id, title, description, value, target]) => ({ id, title, description, earned: value >= target, progress: Math.min(100, (value / target) * 100) }))
}

// ── Export ──────────────────────────────────────────────────────────────────

export function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0])
  const cell = (v: unknown) => {
    const s = v == null ? '' : String(v)
    // Neutralise spreadsheet formula injection and quote everything.
    const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s
    return `"${safe.replace(/"/g, '""')}"`
  }
  return [headers.join(','), ...rows.map((r) => headers.map((h) => cell(r[h])).join(','))].join('\r\n')
}
