// Demo household: a realistic four-person Indian family with 6+ months of
// history, generated relative to today with a fixed random seed so every
// visitor sees a believable, internally consistent ledger. Nothing here is
// shown to real accounts.

import type {
  Budget, ChatMessage, Chore, Expense, ExpenseSplit, Goal, GoalContribution, GroceryItem, GroceryList, Income,
  InsurancePolicy, Investment, LedgerData, Member, RecurringBill, Reimbursement, TaxDocument, Trip, TripExpense,
  Vehicle, VehicleExpense, WalletTransaction,
} from './model'
import { addMonths, financialYear, monthKey, toISODate, toMinor, fromMinor } from './money'

export const DEMO_HOUSEHOLD_ID = 'demo-household'

export const DEMO_PEOPLE = [
  { id: 'demo-asha',   name: 'Asha Sharma',   email: 'asha@demo.kinfold.app',   role: 'HOUSEHEAD',   income: 110000, blurb: 'Household head · sees everything, approves requests' },
  { id: 'demo-vikram', name: 'Vikram Sharma', email: 'vikram@demo.kinfold.app', role: 'PARENT',      income: 85000,  blurb: 'Parent · manages budgets and chores' },
  { id: 'demo-meera',  name: 'Meera Sharma',  email: 'meera@demo.kinfold.app',  role: 'ADULT_CHILD', income: 32000,  blurb: 'Working daughter · shares costs, has private spending' },
  { id: 'demo-ravi',   name: 'Ravi Sharma',   email: 'ravi@demo.kinfold.app',   role: 'STUDENT',     income: 0,      blurb: 'Student · pocket money, chores and rewards' },
] as const

const [ASHA, VIKRAM, MEERA, RAVI] = DEMO_PEOPLE.map((p) => p.id)

// Deterministic PRNG (mulberry32) so the demo looks the same on every load.
function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function buildDemoLedger(now = new Date()): LedgerData {
  const rand = rng(20261002)
  const between = (lo: number, hi: number, step = 10) => Math.round((lo + rand() * (hi - lo)) / step) * step
  const pick = <T,>(xs: readonly T[]) => xs[Math.floor(rand() * xs.length)]
  let n = 0
  const id = (p: string) => `${p}-${(++n).toString(36)}`
  const todayISO = toISODate(now)
  const thisMonth = monthKey(now)
  const ts = (d: string) => `${d}T10:00:00.000Z`
  const dateIn = (key: string, day: number) => {
    const [y, m] = key.split('-').map(Number)
    const last = new Date(y, m, 0).getDate()
    return toISODate(new Date(y, m - 1, Math.min(day, last)))
  }
  const daysAgo = (d: number) => toISODate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - d))
  const daysAhead = (d: number) => daysAgo(-d)

  const household = { id: DEMO_HOUSEHOLD_ID, name: 'Sharma Household', currency: 'INR', invite_code: 'DEMO2026', created_by: ASHA, created_at: ts(dateIn(addMonths(thisMonth, -7), 1)) }
  const members: Member[] = DEMO_PEOPLE.map((p, i) => ({
    household_id: household.id, user_id: p.id, role: p.role, monthly_income: p.income,
    can_view_analytics: p.role !== 'STUDENT', can_manage_expenses: true,
    joined_at: ts(dateIn(addMonths(thisMonth, -7), 1 + i)), full_name: p.name, email: p.email,
  }))

  const expenses: Expense[] = []
  const splits: ExpenseSplit[] = []
  const add = (o: Partial<Expense> & Pick<Expense, 'amount' | 'description' | 'category' | 'expense_date' | 'paid_by'>) => {
    if (o.expense_date > todayISO) return null
    const e: Expense = {
      id: id('exp'), household_id: household.id, created_by: o.paid_by, visibility: 'HOUSEHOLD', payment_method: 'UPI',
      is_reimbursable: false, notes: null, bill_id: null, created_at: ts(o.expense_date), ...o,
    }
    expenses.push(e)
    return e
  }
  const shareWith = (e: Expense | null, people: string[], settled: boolean) => {
    if (!e) return
    const share = fromMinor(Math.floor(toMinor(e.amount) / (people.length + 1)))
    for (const p of people) {
      splits.push({ id: id('spl'), household_id: household.id, expense_id: e.id, owed_by: p, owed_to: e.paid_by, amount: share, settled_at: settled ? ts(e.expense_date) : null, created_at: ts(e.expense_date) })
    }
  }

  // Recurring bills (the current period is paid when its due date has passed).
  const bills: RecurringBill[] = [
    { name: 'House rent', amount: 28000, category: 'RENT', frequency: 'MONTHLY', day: 5, owner: ASHA },
    { name: 'Electricity (TPDDL)', amount: 3100, category: 'UTILITIES', frequency: 'MONTHLY', day: 9, owner: VIKRAM },
    { name: 'Airtel Fiber', amount: 999, category: 'INTERNET', frequency: 'MONTHLY', day: 3, owner: VIKRAM },
    { name: 'Netflix', amount: 649, category: 'SUBSCRIPTIONS', frequency: 'MONTHLY', day: 14, owner: MEERA },
    { name: 'House help salary', amount: 4500, category: 'HOUSEHOLD', frequency: 'MONTHLY', day: 1, owner: ASHA },
    { name: 'Car loan EMI (HDFC)', amount: 14650, category: 'RENT', frequency: 'MONTHLY', day: 7, owner: VIKRAM },
    { name: 'Support for parents', amount: 10000, category: 'FAMILY', frequency: 'MONTHLY', day: 2, owner: ASHA },
    { name: 'Ravi school fees', amount: 18500, category: 'EDUCATION', frequency: 'QUARTERLY', day: 10, owner: ASHA },
    { name: 'LIC premium', amount: 6200, category: 'INSURANCE', frequency: 'QUARTERLY', day: 20, owner: VIKRAM },
  ].map((b) => {
    const due = dateIn(thisMonth, b.day)
    const quarterly = b.frequency === 'QUARTERLY'
    let next = due > todayISO ? due : dateIn(addMonths(thisMonth, 1), b.day)
    if (quarterly) {
      const m = now.getMonth() // quarters start Jan/Apr/Jul/Oct
      const qStart = m - (m % 3)
      next = toISODate(new Date(now.getFullYear(), qStart, b.day))
      if (next <= todayISO) next = toISODate(new Date(now.getFullYear(), qStart + 3, b.day))
    }
    return { id: id('bill'), household_id: household.id, name: b.name, amount: b.amount, category: b.category, frequency: b.frequency as RecurringBill['frequency'], next_due_date: next, owner_id: b.owner, is_active: true, created_by: ASHA, created_at: household.created_at }
  })
  bills.push({ id: id('bill'), household_id: household.id, name: 'Car insurance (Creta)', amount: 14800, category: 'INSURANCE', frequency: 'YEARLY', next_due_date: daysAhead(12), owner_id: VIKRAM, is_active: true, created_by: VIKRAM, created_at: household.created_at })

  // Seven months of history: six full months plus this month to date.
  for (let back = 6; back >= 0; back--) {
    const key = addMonths(thisMonth, -back)
    const month = Number(key.slice(5, 7))
    const summer = month >= 4 && month <= 9

    for (const b of bills) {
      if (b.frequency === 'MONTHLY') {
        const amount = b.category === 'UTILITIES' ? between(summer ? 3200 : 1900, summer ? 4600 : 2600) : b.amount
        add({ amount, description: b.name, category: b.category, expense_date: dateIn(key, Number(b.next_due_date.slice(8, 10))), paid_by: b.owner_id!, bill_id: b.id, payment_method: b.category === 'HOUSEHOLD' ? 'CASH' : 'BANK' })
      }
      if (b.frequency === 'QUARTERLY' && (month - 1) % 3 === 0) {
        add({ amount: b.amount, description: b.name, category: b.category, expense_date: dateIn(key, Number(b.next_due_date.slice(8, 10))), paid_by: b.owner_id!, bill_id: b.id, payment_method: 'BANK' })
      }
    }

    // Weekly grocery runs + monthly milk
    for (const day of [2, 9, 16, 23, 29]) {
      const payer = pick([ASHA, ASHA, VIKRAM, MEERA])
      const e = add({ amount: between(1600, 3400), description: pick(['BigBasket order', 'Weekly vegetables & fruits', 'DMart monthly stock', 'Blinkit top-up', 'Kirana store']), category: 'GROCERIES', expense_date: dateIn(key, day), paid_by: payer })
      if (payer === MEERA) shareWith(e, [ASHA], back > 0)
    }
    add({ amount: 2280, description: 'Milk subscription (Mother Dairy)', category: 'GROCERIES', expense_date: dateIn(key, 1), paid_by: ASHA, payment_method: 'UPI' })

    // Fuel
    for (const day of [6, 18, 27]) add({ amount: between(1800, 2600), description: 'Petrol — Creta', category: 'TRANSPORT', expense_date: dateIn(key, day), paid_by: VIKRAM, payment_method: 'CARD' })
    add({ amount: between(400, 650), description: 'Petrol — Activa', category: 'TRANSPORT', expense_date: dateIn(key, 12), paid_by: MEERA })
    add({ amount: between(600, 1400), description: 'Metro & auto', category: 'TRANSPORT', expense_date: dateIn(key, 20), paid_by: MEERA, visibility: 'PERSONAL' })

    // Phones
    add({ amount: 719, description: 'Jio postpaid', category: 'INTERNET', expense_date: dateIn(key, 7), paid_by: ASHA })

    // Dining out, some split with Meera
    for (const day of [8, 21]) {
      const payer = pick([VIKRAM, MEERA, ASHA])
      const e = add({ amount: between(1100, 3200), description: pick(['Dinner at Haldiram\'s', 'Sunday brunch', 'Zomato order', 'Pizza night', 'Biryani from Behrouz']), category: 'FOOD', expense_date: dateIn(key, day), paid_by: payer, payment_method: 'CARD' })
      if (payer !== MEERA) shareWith(e, [MEERA], back > 1)
    }

    // Kids & education
    add({ amount: 3500, description: 'Maths tuition — Ravi', category: 'EDUCATION', expense_date: dateIn(key, 4), paid_by: ASHA })

    // Health
    if (rand() > 0.35) add({ amount: between(250, 1900), description: pick(['Apollo pharmacy', 'Clinic consultation', 'Blood test — Dr Lal PathLabs', 'Eye check-up']), category: 'HEALTH', expense_date: dateIn(key, 15), paid_by: pick([ASHA, VIKRAM]) })

    // Shopping & leisure
    add({ amount: between(1200, 5200), description: pick(['Myntra order', 'Amazon — household items', 'Decathlon', 'Shoes for Ravi', 'Kitchen utensils']), category: 'SHOPPING', expense_date: dateIn(key, 17), paid_by: pick([ASHA, VIKRAM]), payment_method: 'CARD' })
    add({ amount: between(600, 2400), description: pick(['Movie — PVR', 'Bowling', 'Concert tickets', 'Board game café']), category: 'ENTERTAINMENT', expense_date: dateIn(key, 25), paid_by: VIKRAM })
    add({ amount: 179, description: 'Spotify family', category: 'SUBSCRIPTIONS', expense_date: dateIn(key, 11), paid_by: MEERA })
    add({ amount: between(800, 2600), description: pick(['Zara', 'Nykaa', 'Books — Bahrisons', 'Gym membership']), category: pick(['SHOPPING', 'PERSONAL_CARE']), expense_date: dateIn(key, 13), paid_by: MEERA, visibility: 'PERSONAL', payment_method: 'CARD' })
    add({ amount: between(300, 900), description: 'Salon', category: 'PERSONAL_CARE', expense_date: dateIn(key, 22), paid_by: ASHA })
    add({ amount: between(500, 1500), description: 'Plumber / electrician', category: 'HOUSEHOLD', expense_date: dateIn(key, 19), paid_by: VIKRAM, payment_method: 'CASH' })
    if (month === 10 || month === 11) add({ amount: between(6000, 9000), description: 'Diwali sweets & gifts', category: 'GIFTS', expense_date: dateIn(key, 26), paid_by: ASHA })
  }

  // Extra income: interest, Vikram's freelance work
  const incomes: Income[] = []
  for (let back = 6; back >= 0; back--) {
    const key = addMonths(thisMonth, -back)
    if (back % 2 === 0) {
      const d = dateIn(key, 24)
      if (d <= todayISO) incomes.push({ id: id('inc'), household_id: household.id, user_id: VIKRAM, amount: between(8000, 15000, 500), source: 'Freelance', income_date: d, notes: 'Design consulting', created_at: ts(d) })
    }
    const q = Number(key.slice(5, 7))
    if (q % 3 === 0) {
      const d = dateIn(key, 30)
      if (d <= todayISO) incomes.push({ id: id('inc'), household_id: household.id, user_id: ASHA, amount: between(2400, 3200), source: 'Interest', income_date: d, notes: 'Savings account interest', created_at: ts(d) })
    }
  }

  // Wallet: Asha funds the family wallet, gives pocket money; chore rewards.
  const wallet: WalletTransaction[] = []
  const tx = (o: Omit<WalletTransaction, 'id' | 'household_id' | 'created_by' | 'created_at'> & { date: string }) => {
    if (o.date > todayISO) return
    const { date, ...rest } = o
    wallet.push({ id: id('wal'), household_id: household.id, created_by: o.from_user ?? o.to_user!, created_at: ts(date), ...rest })
  }
  for (let back = 5; back >= 0; back--) {
    const key = addMonths(thisMonth, -back)
    tx({ from_user: null, to_user: ASHA, amount: 8000, kind: 'TOP_UP', note: 'Monthly family wallet', date: dateIn(key, 1) })
    tx({ from_user: ASHA, to_user: RAVI, amount: 2000, kind: 'ALLOCATION', note: 'Pocket money', date: dateIn(key, 2) })
    tx({ from_user: ASHA, to_user: MEERA, amount: 1500, kind: 'ALLOCATION', note: 'Commute allowance', date: dateIn(key, 2) })
    tx({ from_user: RAVI, to_user: null, amount: between(900, 1600), kind: 'WITHDRAWAL', note: 'Spent from pocket money', date: dateIn(key, 26) })
  }

  // Chores
  const chores: Chore[] = [
    { title: 'Wash the car', reward: 150, status: 'APPROVED', due: daysAgo(9) },
    { title: 'Clean your room', reward: 100, status: 'COMPLETED', due: daysAgo(1) },
    { title: 'Water the plants (week)', reward: 80, status: 'PENDING', due: daysAhead(3) },
    { title: 'Help with grocery run', reward: 50, status: 'PENDING', due: daysAhead(5) },
  ].map((c) => ({
    id: id('chore'), household_id: household.id, title: c.title, description: null, reward_amount: c.reward, assigned_to: RAVI, due_date: c.due,
    status: c.status as Chore['status'], created_by: VIKRAM, completed_at: c.status !== 'PENDING' ? ts(c.due) : null, decided_at: c.status === 'APPROVED' ? ts(c.due) : null, created_at: ts(daysAgo(14)),
  }))
  tx({ from_user: VIKRAM, to_user: RAVI, amount: 150, kind: 'CHORE_REWARD', note: 'Chore: Wash the car', date: daysAgo(9) })
  tx({ from_user: null, to_user: VIKRAM, amount: 1000, kind: 'TOP_UP', note: 'For chore rewards', date: daysAgo(20) })

  // Reimbursements
  const reimbursements: Reimbursement[] = [
    { by: MEERA, amount: 3450, description: 'Paid electricity bill from my account', category: 'UTILITIES', paid: daysAgo(4), status: 'PENDING' },
    { by: RAVI, amount: 640, description: 'Science project materials', category: 'EDUCATION', paid: daysAgo(6), status: 'PENDING' },
    { by: VIKRAM, amount: 2200, description: 'Gas cylinder refill', category: 'UTILITIES', paid: daysAgo(12), status: 'APPROVED' },
    { by: MEERA, amount: 1850, description: 'Medicines for Dadi', category: 'HEALTH', paid: daysAgo(35), status: 'SETTLED' },
  ].map((r) => ({
    id: id('reim'), household_id: household.id, requested_by: r.by, amount: r.amount, description: r.description, category: r.category, paid_date: r.paid,
    status: r.status as Reimbursement['status'], decided_by: r.status === 'PENDING' ? null : ASHA, decided_at: r.status === 'PENDING' ? null : ts(r.paid), settled_at: r.status === 'SETTLED' ? ts(r.paid) : null, created_at: ts(r.paid),
  }))

  const budget = (category: string, monthly_limit: number, user_id: string | null = null, alert = 80): Budget =>
    ({ id: id('bud'), household_id: household.id, user_id, category, monthly_limit, alert_at_percent: alert, created_at: household.created_at })
  const budgets = [
    budget('GROCERIES', 13500), budget('FOOD', 5000), budget('TRANSPORT', 8000), budget('SHOPPING', 5500),
    budget('ENTERTAINMENT', 2500), budget('UTILITIES', 4500), budget('SHOPPING', 3000, MEERA, 75),
  ]

  // Goals
  const goals: Goal[] = [
    { name: 'Emergency fund', description: '6 months of expenses', target: 450000, date: dateIn(addMonths(thisMonth, 14), 28), per: [[ASHA, 15000], [VIKRAM, 10000]] },
    { name: 'Goa holiday', description: 'December family trip', target: 70000, date: dateIn(addMonths(thisMonth, 2), 20), per: [[ASHA, 6000], [MEERA, 3000]] },
    { name: "Ravi's laptop", description: 'For college', target: 65000, date: dateIn(addMonths(thisMonth, 9), 1), per: [[VIKRAM, 3500], [RAVI, 500]] },
  ].map((g) => ({ id: id('goal'), household_id: household.id, name: g.name, description: g.description, target_amount: g.target, target_date: g.date, created_by: ASHA, created_at: ts(dateIn(addMonths(thisMonth, -5), 1)), _per: g.per } as Goal & { _per: [string, number][] }))
  const contributions: GoalContribution[] = []
  for (const g of goals as (Goal & { _per: [string, number][] })[]) {
    for (let back = 5; back >= 0; back--) {
      for (const [user, amount] of g._per) {
        const d = dateIn(addMonths(thisMonth, -back), 3)
        if (d <= todayISO) contributions.push({ id: id('gc'), household_id: household.id, goal_id: g.id, user_id: user, amount, note: null, created_at: ts(d) })
      }
    }
    delete (g as Partial<{ _per: unknown }>)._per
  }

  // Groceries
  const weekList: GroceryList = { id: id('gl'), household_id: household.id, name: 'This week', created_by: ASHA, completed_at: null, expense_id: null, created_at: ts(daysAgo(2)) }
  const festiveList: GroceryList = { id: id('gl'), household_id: household.id, name: 'Festival prep', created_by: VIKRAM, completed_at: null, expense_id: null, created_at: ts(daysAgo(5)) }
  const item = (list: GroceryList, name: string, quantity: number, unit: string, price: number, cat: string, checked = false): GroceryItem =>
    ({ id: id('gi'), household_id: household.id, list_id: list.id, name, quantity, unit, estimated_price: price, category: cat, is_checked: checked, created_at: list.created_at })
  const groceryItems = [
    item(weekList, 'Tomatoes', 2, 'kg', 80, 'Vegetables', true), item(weekList, 'Onions', 3, 'kg', 105, 'Vegetables', true),
    item(weekList, 'Bananas', 1, 'dozen', 60, 'Fruits'), item(weekList, 'Paneer', 500, 'g', 210, 'Dairy'),
    item(weekList, 'Atta (10 kg)', 1, 'bag', 480, 'Staples'), item(weekList, 'Toor dal', 2, 'kg', 330, 'Staples'),
    item(weekList, 'Detergent', 1, 'pack', 245, 'Household'),
    item(festiveList, 'Diyas', 24, 'pcs', 240, 'Festive'), item(festiveList, 'Ghee', 1, 'L', 650, 'Dairy', true),
    item(festiveList, 'Dry fruits box', 2, 'box', 1400, 'Festive'),
  ]

  // Chat
  const chat: ChatMessage[] = [
    { by: VIKRAM, channel: 'general', text: 'Plumber is coming at 11 tomorrow, someone please be home.', ago: 3 },
    { by: MEERA, channel: 'general', text: "I'll be working from home, I can handle it.", ago: 3 },
    { by: ASHA, channel: 'expenses', text: 'Groceries are at 80% of budget already — let\'s skip the extra Blinkit orders this week.', ago: 2 },
    { by: RAVI, channel: 'general', text: 'Marked "Clean your room" as done 🙂', ago: 1 },
    { by: ASHA, channel: 'plans', text: 'Goa fund is on track. Booking flights next month?', ago: 1 },
    { by: MEERA, channel: 'plans', text: 'Yes! I can add ₹3,000 more this month.', ago: 0 },
  ].map((m, i) => ({ id: id('msg'), household_id: household.id, sender_id: m.by, channel: m.channel as ChatMessage['channel'], content: m.text, created_at: new Date(now.getTime() - m.ago * 86_400_000 + i * 60_000).toISOString() }))

  // Vehicles with odometer-based fuel log
  const creta: Vehicle = { id: id('veh'), household_id: household.id, owner_id: VIKRAM, name: 'Family car', registration_number: 'DL 8C AB 4521', vehicle_type: 'CAR', make: 'Hyundai', model: 'Creta', year: 2021, fuel_type: 'Petrol', is_shared: true, created_at: household.created_at }
  const activa: Vehicle = { id: id('veh'), household_id: household.id, owner_id: MEERA, name: "Meera's scooter", registration_number: 'DL 3S CD 9012', vehicle_type: 'SCOOTER', make: 'Honda', model: 'Activa 6G', year: 2022, fuel_type: 'Petrol', is_shared: false, created_at: household.created_at }
  const vehicleExpenses: VehicleExpense[] = []
  let odo = 38200
  for (let i = 12; i >= 0; i--) {
    const d = daysAgo(i * 14 + 3)
    odo += between(380, 520, 1)
    const litres = Math.round((between(380, 520, 1) / 13.5) * 10) / 10
    vehicleExpenses.push({ id: id('ve'), household_id: household.id, vehicle_id: creta.id, expense_type: 'FUEL', amount: Math.round(litres * 102.5), odometer_km: odo, litres, expense_date: d, notes: null, created_at: ts(d) })
  }
  vehicleExpenses.push({ id: id('ve'), household_id: household.id, vehicle_id: creta.id, expense_type: 'SERVICE', amount: 7850, odometer_km: odo - 900, litres: null, expense_date: daysAgo(40), notes: '40,000 km service', created_at: ts(daysAgo(40)) })
  vehicleExpenses.push({ id: id('ve'), household_id: household.id, vehicle_id: creta.id, expense_type: 'PUC', amount: 100, odometer_km: null, litres: null, expense_date: daysAgo(70), notes: null, created_at: ts(daysAgo(70)) })
  let odo2 = 14100
  for (let i = 6; i >= 0; i--) {
    const d = daysAgo(i * 25 + 5)
    odo2 += between(230, 300, 1)
    vehicleExpenses.push({ id: id('ve'), household_id: household.id, vehicle_id: activa.id, expense_type: 'FUEL', amount: 520, odometer_km: odo2, litres: 5, expense_date: d, notes: null, created_at: ts(d) })
  }

  // Trips
  const goa: Trip = { id: id('trip'), household_id: household.id, destination: 'Goa', start_date: daysAhead(62), end_date: daysAhead(67), budget: 70000, base_currency: 'INR', created_at: ts(daysAgo(30)) }
  const dubai: Trip = { id: id('trip'), household_id: household.id, destination: 'Dubai', start_date: daysAgo(130), end_date: daysAgo(124), budget: 180000, base_currency: 'INR', created_at: ts(daysAgo(170)) }
  const te = (trip: Trip, description: string, amount: number, currency_code: string, exchange_rate: number, paid_by: string, d: string): TripExpense =>
    ({ id: id('te'), household_id: household.id, trip_id: trip.id, description, amount, currency_code, exchange_rate, paid_by, expense_date: d, created_at: ts(d) })
  const tripExpenses = [
    te(goa, 'Flights (4 pax, IndiGo)', 26400, 'INR', 1, ASHA, daysAgo(10)),
    te(goa, 'Villa advance', 12000, 'INR', 1, VIKRAM, daysAgo(6)),
    te(dubai, 'Flights', 78000, 'INR', 1, ASHA, daysAgo(160)),
    te(dubai, 'Hotel (6 nights)', 3150, 'AED', 22.8, VIKRAM, daysAgo(128)),
    te(dubai, 'Desert safari', 720, 'AED', 22.8, MEERA, daysAgo(127)),
    te(dubai, 'Food & metro', 1180, 'AED', 22.8, ASHA, daysAgo(126)),
  ]

  const inv = (name: string, asset_type: Investment['asset_type'], invested_amount: number, current_value: number, monthsAgo: number, platform: string, owner: string): Investment =>
    ({ id: id('inv'), household_id: household.id, owner_id: owner, name, asset_type, invested_amount, current_value, investment_date: dateIn(addMonths(thisMonth, -monthsAgo), 5), platform, created_at: household.created_at })
  const investments = [
    inv('UTI Nifty 50 Index Fund', 'MUTUAL_FUND', 240000, 291500, 30, 'Groww', ASHA),
    inv('Parag Parikh Flexi Cap', 'MUTUAL_FUND', 120000, 151800, 26, 'Zerodha Coin', VIKRAM),
    inv('PPF account', 'PPF', 410000, 468900, 60, 'SBI', ASHA),
    inv('Fixed deposit (1 yr)', 'FIXED_DEPOSIT', 150000, 157400, 7, 'HDFC Bank', VIKRAM),
    inv('Sovereign Gold Bond', 'GOLD', 60000, 84600, 34, 'RBI via SBI', ASHA),
    inv('Infosys shares', 'STOCK', 45000, 51200, 14, 'Zerodha', MEERA),
    inv('EPF balance', 'EPF', 520000, 520000, 48, 'EPFO', ASHA),
  ]

  const policies: InsurancePolicy[] = [
    { provider: 'Star Health', number: 'SH-FF-2210934', type: 'HEALTH', cover: 1000000, premium: 24000, freq: 'YEARLY', expiry: daysAhead(140), owner: ASHA },
    { provider: 'HDFC Life Click 2 Protect', number: 'HL-TRM-77810', type: 'TERM_LIFE', cover: 10000000, premium: 15600, freq: 'YEARLY', expiry: daysAhead(4200), owner: ASHA },
    { provider: 'LIC Jeevan Anand', number: 'LIC-55120983', type: 'LIFE', cover: 1500000, premium: 6200, freq: 'QUARTERLY', expiry: daysAhead(3100), owner: VIKRAM },
    { provider: 'ICICI Lombard (Creta)', number: 'IL-MTR-90321', type: 'VEHICLE', cover: 820000, premium: 14800, freq: 'YEARLY', expiry: daysAhead(12), owner: VIKRAM },
  ].map((p) => ({ id: id('pol'), household_id: household.id, owner_id: p.owner, provider: p.provider, policy_number: p.number, policy_type: p.type as InsurancePolicy['policy_type'], coverage_amount: p.cover, premium_amount: p.premium, premium_frequency: p.freq as InsurancePolicy['premium_frequency'], expiry_date: p.expiry, created_at: household.created_at }))

  const fy = financialYear(now)
  const taxDocs: TaxDocument[] = [
    ['PPF deposit', '80C', 100000, ASHA], ['ELSS SIP statement', '80C', 36000, ASHA], ['LIC premium receipts', '80C', 24800, VIKRAM],
    ['Star Health premium', '80D_SELF', 24000, ASHA], ["Parents' health cover", '80D_PARENTS', 18500, VIKRAM], ['NPS Tier-I contribution', '80CCD_1B', 50000, ASHA],
  ].map(([document_name, section, amount, owner]) => ({ id: id('tax'), household_id: household.id, owner_id: owner as string, document_name: document_name as string, section: section as TaxDocument['section'], amount: amount as number, financial_year: fy, created_at: ts(daysAgo(20)) }))

  return {
    household, members,
    expenses: expenses.sort((a, b) => b.expense_date.localeCompare(a.expense_date)),
    incomes, splits, settlements: [], reimbursements, budgets, bills, wallet, goals, contributions,
    groceryLists: [weekList, festiveList], groceryItems, chores, chat,
    vehicles: [creta, activa], vehicleExpenses, trips: [goa, dubai], tripExpenses, investments, policies, taxDocs,
  }
}
