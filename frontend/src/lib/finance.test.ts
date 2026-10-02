import { describe, expect, it } from 'vitest'
import {
  budgetProgress, categoryBreakdown, forecastNextMonth, goalProgress, householdIncome, householdSpend, memberShare,
  monthlyBillLoad, netBalances, pairwiseDebts, simplifyDebts, taxSummary, toCSV, tripSpent, vehicleStats, walletBalance, cagr,
} from './finance'
import { formatCompact, formatMoney, parseMoney, splitEvenly, sumMoney, financialYear } from './money'
import type { Budget, Expense, ExpenseSplit, Goal, GoalContribution, Income, Member, RecurringBill, TaxDocument, Trip, TripExpense, VehicleExpense, WalletTransaction, Investment } from './model'

const H = 'h1'
const A = 'asha', R = 'ravi', M = 'meera'

const exp = (o: Partial<Expense>): Expense => ({
  id: Math.random().toString(36), household_id: H, paid_by: A, created_by: A, amount: 0, description: 'x', category: 'GROCERIES',
  visibility: 'HOUSEHOLD', expense_date: '2026-09-10', payment_method: 'UPI', is_reimbursable: false, notes: null, bill_id: null,
  created_at: '2026-09-10T00:00:00Z', ...o,
})
const split = (o: Partial<ExpenseSplit>): ExpenseSplit => ({
  id: Math.random().toString(36), household_id: H, expense_id: 'e', owed_by: R, owed_to: A, amount: 0, settled_at: null, created_at: '', ...o,
})
const member = (user_id: string, monthly_income: number): Member => ({
  household_id: H, user_id, role: 'PARENT', monthly_income, can_view_analytics: true, can_manage_expenses: true, joined_at: '', full_name: user_id, email: null,
})

describe('money', () => {
  it('sums without floating-point drift', () => {
    const rows = Array.from({ length: 10 }, () => ({ v: 0.1 }))
    expect(sumMoney(rows, (r) => r.v)).toBe(1)
    expect(sumMoney([{ v: 0.1 }, { v: 0.2 }], (r) => r.v)).toBe(0.3)
  })

  it('splits evenly and the shares add back to the total', () => {
    expect(splitEvenly(100, 3)).toEqual([33.34, 33.33, 33.33])
    expect(sumMoney(splitEvenly(1999.99, 7), (x) => x)).toBe(1999.99)
  })

  it('formats Indian rupees', () => {
    expect(formatMoney(150000)).toBe('₹1,50,000')
    expect(formatMoney(-2500)).toBe('−₹2,500')
    expect(formatCompact(250000)).toBe('₹2.5L')
    expect(formatCompact(12500000)).toBe('₹1.3Cr')
  })

  it('parses typed amounts and rejects junk', () => {
    expect(parseMoney('1,250.50')).toBe(1250.5)
    expect(parseMoney('₹ 99')).toBe(99)
    expect(parseMoney('12.345')).toBeNaN()
    expect(parseMoney('abc')).toBeNaN()
  })

  it('labels the Indian financial year', () => {
    expect(financialYear(new Date(2026, 2, 31))).toBe('2025-26')
    expect(financialYear(new Date(2026, 3, 1))).toBe('2026-27')
  })
})

describe('spending', () => {
  const expenses = [
    exp({ id: 'e1', amount: 1200, paid_by: A }),
    exp({ id: 'e2', amount: 300, paid_by: R, category: 'FOOD' }),
    exp({ id: 'e3', amount: 999, paid_by: A, visibility: 'PERSONAL' }),
    exp({ id: 'e4', amount: 5000, paid_by: A, expense_date: '2026-08-31' }),
  ]

  it('household total counts only shared expenses in the month', () => {
    expect(householdSpend(expenses, '2026-09')).toBe(1500)
  })

  it("member share = paid − owed back + owes others", () => {
    const splits = [split({ expense_id: 'e1', owed_by: R, owed_to: A, amount: 400 })]
    expect(memberShare(expenses, splits, A, '2026-09')).toBe(1200 + 999 - 400)
    expect(memberShare(expenses, splits, R, '2026-09')).toBe(300 + 400)
  })

  it('income = declared monthly income + extra entries that month', () => {
    const members = [member(A, 80000), member(R, 45000)]
    const incomes: Income[] = [{ id: 'i', household_id: H, user_id: R, amount: 5000.5, source: 'Freelance', income_date: '2026-09-02', notes: null, created_at: '' }]
    expect(householdIncome(members, incomes, '2026-09')).toBe(130000.5)
    expect(householdIncome(members, incomes, '2026-10')).toBe(125000)
  })

  it('does not count declared income for months before someone joined', () => {
    const members = [{ ...member(A, 80000), joined_at: '2026-06-15T10:00:00Z' }]
    expect(householdIncome(members, [], '2026-05')).toBe(0)
    expect(householdIncome(members, [], '2026-06')).toBe(80000)
  })

  it('breaks spending down by category with shares adding to 100%', () => {
    const slices = categoryBreakdown(expenses.slice(0, 3))
    expect(slices[0]).toMatchObject({ category: 'GROCERIES', amount: 2199, count: 2 })
    expect(slices.reduce((t, s) => t + s.share, 0)).toBeCloseTo(100)
  })
})

describe('budgets', () => {
  const budget: Budget = { id: 'b', household_id: H, user_id: null, category: 'GROCERIES', monthly_limit: 10000, alert_at_percent: 80, created_at: '' }

  it('reports spend, remaining, status and month-end projection', () => {
    const expenses = [exp({ amount: 4000, expense_date: '2026-09-05' }), exp({ amount: 4500, expense_date: '2026-09-09' })]
    const p = budgetProgress(budget, expenses, '2026-09', '2026-09-10')
    expect(p).toMatchObject({ spent: 8500, remaining: 1500, status: 'warn' })
    expect(p.percent).toBeCloseTo(85)
    expect(p.projected).toBe(25500) // 8500 / 10 days * 30
  })

  it('personal budgets only count what that person paid', () => {
    const personal = { ...budget, user_id: R }
    const expenses = [exp({ amount: 4000, paid_by: A }), exp({ amount: 700, paid_by: R, visibility: 'PERSONAL' })]
    expect(budgetProgress(personal, expenses, '2026-09', '2026-10-01').spent).toBe(700)
  })
})

describe('splits & settle-up', () => {
  const splits = [
    split({ owed_by: R, owed_to: A, amount: 500 }),
    split({ owed_by: A, owed_to: R, amount: 200 }),
    split({ owed_by: M, owed_to: R, amount: 300 }),
    split({ owed_by: M, owed_to: A, amount: 100, settled_at: '2026-09-01' }),
  ]

  it('nets open balances per person (sum is zero)', () => {
    const net = netBalances(splits)
    expect(net.get(A)).toBe(300)
    expect(net.get(R)).toBe(0)
    expect(net.get(M)).toBe(-300)
    expect([...net.values()].reduce((a, b) => a + b, 0)).toBe(0)
  })

  it('nets pairs in both directions', () => {
    expect(pairwiseDebts(splits)).toEqual([
      { debtor: R, creditor: A, amount: 300 },
      { debtor: M, creditor: R, amount: 300 },
    ])
  })

  it('simplifies to the minimum number of payments', () => {
    // Ravi is square overall, so Meera can pay Asha directly: 1 payment instead of 2.
    expect(simplifyDebts(netBalances(splits))).toEqual([{ debtor: M, creditor: A, amount: 300 }])
  })
})

describe('wallet', () => {
  it('balance = money in − money out', () => {
    const tx: WalletTransaction[] = [
      { id: '1', household_id: H, from_user: null, to_user: A, amount: 2000, kind: 'TOP_UP', note: null, created_by: A, created_at: '' },
      { id: '2', household_id: H, from_user: A, to_user: R, amount: 750.25, kind: 'ALLOCATION', note: null, created_by: A, created_at: '' },
      { id: '3', household_id: H, from_user: A, to_user: R, amount: 200, kind: 'CHORE_REWARD', note: null, created_by: A, created_at: '' },
    ]
    expect(walletBalance(tx, A)).toBe(1049.75)
    expect(walletBalance(tx, R)).toBe(950.25)
  })
})

describe('bills', () => {
  it('normalises every frequency to a monthly cost', () => {
    const bill = (amount: number, frequency: RecurringBill['frequency']): RecurringBill => ({
      id: frequency, household_id: H, name: frequency, amount, category: 'UTILITIES', frequency, next_due_date: '2026-10-01', owner_id: null, is_active: true, created_by: A, created_at: '',
    })
    // 1200 + 300/3 + 12000/12 + 120*52/12 = 1200 + 100 + 1000 + 520
    expect(monthlyBillLoad([bill(1200, 'MONTHLY'), bill(300, 'QUARTERLY'), bill(12000, 'YEARLY'), bill(120, 'WEEKLY')])).toBe(2820)
  })
})

describe('goals', () => {
  it('works out the monthly amount needed to hit the target date', () => {
    const goal: Goal = { id: 'g', household_id: H, name: 'Laptop', description: null, target_amount: 60000, target_date: '2027-03-10', created_by: A, created_at: '' }
    const contributions: GoalContribution[] = [{ id: 'c', household_id: H, goal_id: 'g', user_id: A, amount: 12000, note: null, created_at: '' }]
    const p = goalProgress(goal, contributions, '2026-10-10')
    expect(p).toMatchObject({ saved: 12000, remaining: 48000, percent: 20, monthsLeft: 5, requiredMonthly: 9600, done: false })
  })
})

describe('tax (old regime)', () => {
  it('caps each section at its legal limit', () => {
    const doc = (section: TaxDocument['section'], amount: number, financial_year = '2026-27'): TaxDocument =>
      ({ id: section + amount, household_id: H, owner_id: A, document_name: '', section, amount, financial_year, created_at: '' })
    const { lines, totalEligible } = taxSummary([doc('80C', 120000), doc('80C', 60000), doc('80D_SELF', 18000), doc('80E', 40000), doc('80C', 99999, '2025-26')], '2026-27')
    expect(lines.find((l) => l.section === '80C')).toMatchObject({ claimed: 180000, eligible: 150000, headroom: 0 })
    expect(lines.find((l) => l.section === '80D_SELF')).toMatchObject({ eligible: 18000, headroom: 7000 })
    expect(totalEligible).toBe(150000 + 18000 + 40000)
  })
})

describe('trips & vehicles', () => {
  it('converts foreign-currency trip spend into the base currency', () => {
    const trip: Trip = { id: 't', household_id: H, destination: 'Dubai', start_date: '2026-11-01', end_date: '2026-11-05', budget: 150000, base_currency: 'INR', created_at: '' }
    const te = (amount: number, currency_code: string, exchange_rate: number): TripExpense =>
      ({ id: String(amount), household_id: H, trip_id: 't', description: '', amount, currency_code, exchange_rate, paid_by: A, expense_date: '', created_at: '' })
    expect(tripSpent(trip, [te(20000, 'INR', 1), te(500, 'AED', 22.75)])).toBe(31375)
  })

  it('computes mileage with the full-tank method', () => {
    const fuel = (odometer_km: number, litres: number, amount: number): VehicleExpense =>
      ({ id: String(odometer_km), household_id: H, vehicle_id: 'v', expense_type: 'FUEL', amount, odometer_km, litres, expense_date: '', notes: null, created_at: '' })
    const s = vehicleStats([fuel(10000, 30, 3000), fuel(10450, 30, 3100), fuel(10900, 30, 3200),
      { ...fuel(10950, 1, 1), expense_type: 'SERVICE', litres: null, amount: 2500 }])
    expect(s.kmPerLitre).toBe(15) // 900 km / 60 litres
    expect(s.total).toBe(11800)
    expect(s.costPerKm).toBeCloseTo(11800 / 950)
  })

  it('annualises returns only after a year', () => {
    const inv = (investment_date: string): Investment => ({ id: 'i', household_id: H, owner_id: A, name: 'Index fund', asset_type: 'MUTUAL_FUND', invested_amount: 100000, current_value: 121000, investment_date, platform: null, created_at: '' })
    expect(cagr(inv('2024-10-01'), '2026-10-01')).toBeCloseTo(10, 0)
    expect(cagr(inv('2026-06-01'), '2026-10-01')).toBeNull()
  })
})

describe('forecast', () => {
  it('weights recent months 3:2:1', () => {
    const e = [
      exp({ amount: 6000, expense_date: '2026-09-05' }),
      exp({ amount: 3000, expense_date: '2026-08-05' }),
      exp({ amount: 3000, expense_date: '2026-07-05' }),
    ]
    const [f] = forecastNextMonth(e, '2026-10-02')
    expect(f).toMatchObject({ category: 'GROCERIES', predicted: 4500, lastMonth: 6000 }) // (18000+6000+3000)/6
  })
})

describe('csv export', () => {
  it('quotes values and neutralises formula injection', () => {
    expect(toCSV([{ a: 'x,y', b: '=HYPERLINK("evil")' }])).toBe('a,b\r\n"x,y","\'=HYPERLINK(""evil"")"')
  })
})
