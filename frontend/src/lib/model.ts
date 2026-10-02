// Kinfold domain model. Row types mirror the Postgres tables in
// supabase/migrations exactly (snake_case), so the same shapes flow from
// Supabase in live mode and from the browser-stored demo household.

export type ID = string
export type ISODate = string // 'YYYY-MM-DD'
export type ISODateTime = string

export type Role = 'HOUSEHEAD' | 'PARENT' | 'ADULT_CHILD' | 'STUDENT'

export interface Profile {
  id: ID
  full_name: string
  email: string | null
  phone: string | null
  created_at: ISODateTime
  updated_at: ISODateTime
}

export interface Household {
  id: ID
  name: string
  currency: string
  invite_code: string
  created_by: ID
  created_at: ISODateTime
}

export interface HouseholdMember {
  household_id: ID
  user_id: ID
  role: Role
  monthly_income: number
  can_view_analytics: boolean
  can_manage_expenses: boolean
  joined_at: ISODateTime
}

/** Member row joined with the person's profile, for display. */
export interface Member extends HouseholdMember {
  full_name: string
  email: string | null
}

export type Visibility = 'HOUSEHOLD' | 'PERSONAL'
export type PaymentMethod = 'UPI' | 'CARD' | 'CASH' | 'BANK' | 'WALLET' | 'OTHER'

export interface Expense {
  id: ID
  household_id: ID
  paid_by: ID
  created_by: ID
  amount: number
  description: string
  category: string
  visibility: Visibility
  expense_date: ISODate
  payment_method: PaymentMethod
  is_reimbursable: boolean
  notes: string | null
  bill_id: ID | null
  created_at: ISODateTime
}

export interface Income {
  id: ID
  household_id: ID
  user_id: ID
  amount: number
  source: string
  income_date: ISODate
  notes: string | null
  created_at: ISODateTime
}

export interface ExpenseSplit {
  id: ID
  household_id: ID
  expense_id: ID
  owed_by: ID
  owed_to: ID
  amount: number
  settled_at: ISODateTime | null
  created_at: ISODateTime
}

export interface Settlement {
  id: ID
  household_id: ID
  from_user: ID
  to_user: ID
  amount: number
  note: string | null
  created_by: ID
  created_at: ISODateTime
}

export type ReimbursementStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SETTLED'

export interface Reimbursement {
  id: ID
  household_id: ID
  requested_by: ID
  amount: number
  description: string
  category: string
  paid_date: ISODate
  status: ReimbursementStatus
  decided_by: ID | null
  decided_at: ISODateTime | null
  settled_at: ISODateTime | null
  created_at: ISODateTime
}

export interface Budget {
  id: ID
  household_id: ID
  user_id: ID | null // null = whole-household budget
  category: string
  monthly_limit: number
  alert_at_percent: number
  created_at: ISODateTime
}

export type BillFrequency = 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY'

export interface RecurringBill {
  id: ID
  household_id: ID
  name: string
  amount: number
  category: string
  frequency: BillFrequency
  next_due_date: ISODate
  owner_id: ID | null
  is_active: boolean
  created_by: ID
  created_at: ISODateTime
}

export type WalletKind = 'TOP_UP' | 'ALLOCATION' | 'TRANSFER' | 'CHORE_REWARD' | 'WITHDRAWAL'

export interface WalletTransaction {
  id: ID
  household_id: ID
  from_user: ID | null
  to_user: ID | null
  amount: number
  kind: WalletKind
  note: string | null
  created_by: ID
  created_at: ISODateTime
}

export interface Goal {
  id: ID
  household_id: ID
  name: string
  description: string | null
  target_amount: number
  target_date: ISODate | null
  created_by: ID
  created_at: ISODateTime
}

export interface GoalContribution {
  id: ID
  household_id: ID
  goal_id: ID
  user_id: ID
  amount: number
  note: string | null
  created_at: ISODateTime
}

export interface GroceryList {
  id: ID
  household_id: ID
  name: string
  created_by: ID
  completed_at: ISODateTime | null
  expense_id: ID | null
  created_at: ISODateTime
}

export interface GroceryItem {
  id: ID
  household_id: ID
  list_id: ID
  name: string
  quantity: number
  unit: string
  estimated_price: number
  category: string | null
  is_checked: boolean
  created_at: ISODateTime
}

export type ChoreStatus = 'PENDING' | 'COMPLETED' | 'APPROVED' | 'REJECTED'

export interface Chore {
  id: ID
  household_id: ID
  title: string
  description: string | null
  reward_amount: number
  assigned_to: ID
  due_date: ISODate | null
  status: ChoreStatus
  created_by: ID
  completed_at: ISODateTime | null
  decided_at: ISODateTime | null
  created_at: ISODateTime
}

export type ChatChannel = 'general' | 'expenses' | 'plans'

export interface ChatMessage {
  id: ID
  household_id: ID
  sender_id: ID
  channel: ChatChannel
  content: string
  created_at: ISODateTime
}

export type VehicleType = 'CAR' | 'BIKE' | 'SCOOTER' | 'CYCLE' | 'EV' | 'OTHER'

export interface Vehicle {
  id: ID
  household_id: ID
  owner_id: ID | null
  name: string
  registration_number: string | null
  vehicle_type: VehicleType
  make: string | null
  model: string | null
  year: number | null
  fuel_type: string | null
  is_shared: boolean
  created_at: ISODateTime
}

export type VehicleExpenseType = 'FUEL' | 'SERVICE' | 'REPAIR' | 'INSURANCE' | 'TYRES' | 'PUC' | 'PARKING_TOLL' | 'WASH' | 'OTHER'

export interface VehicleExpense {
  id: ID
  household_id: ID
  vehicle_id: ID
  expense_type: VehicleExpenseType
  amount: number
  odometer_km: number | null
  litres: number | null
  expense_date: ISODate
  notes: string | null
  created_at: ISODateTime
}

export interface Trip {
  id: ID
  household_id: ID
  destination: string
  start_date: ISODate
  end_date: ISODate
  budget: number
  base_currency: string
  created_at: ISODateTime
}

export interface TripExpense {
  id: ID
  household_id: ID
  trip_id: ID
  description: string
  amount: number
  currency_code: string
  exchange_rate: number // 1 unit of currency_code in the trip's base currency
  paid_by: ID
  expense_date: ISODate
  created_at: ISODateTime
}

export type AssetType =
  | 'MUTUAL_FUND' | 'STOCK' | 'FIXED_DEPOSIT' | 'RECURRING_DEPOSIT' | 'PPF' | 'EPF'
  | 'NPS' | 'GOLD' | 'REAL_ESTATE' | 'CRYPTO' | 'BOND' | 'OTHER'

export interface Investment {
  id: ID
  household_id: ID
  owner_id: ID | null
  name: string
  asset_type: AssetType
  invested_amount: number
  current_value: number
  investment_date: ISODate | null
  platform: string | null
  created_at: ISODateTime
}

export type PolicyType = 'HEALTH' | 'TERM_LIFE' | 'LIFE' | 'VEHICLE' | 'HOME' | 'TRAVEL' | 'OTHER'

export interface InsurancePolicy {
  id: ID
  household_id: ID
  owner_id: ID | null
  provider: string
  policy_number: string | null
  policy_type: PolicyType
  coverage_amount: number
  premium_amount: number
  premium_frequency: 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
  expiry_date: ISODate | null
  created_at: ISODateTime
}

export type TaxSection = '80C' | '80D_SELF' | '80D_PARENTS' | '80CCD_1B' | '24B' | '80E' | '80G' | '80TTA' | 'HRA' | 'OTHER'

export interface TaxDocument {
  id: ID
  household_id: ID
  owner_id: ID
  document_name: string
  section: TaxSection
  amount: number
  financial_year: string
  created_at: ISODateTime
}

/** Everything the app loads for one household. */
export interface LedgerData {
  household: Household
  members: Member[]
  expenses: Expense[]
  incomes: Income[]
  splits: ExpenseSplit[]
  settlements: Settlement[]
  reimbursements: Reimbursement[]
  budgets: Budget[]
  bills: RecurringBill[]
  wallet: WalletTransaction[]
  goals: Goal[]
  contributions: GoalContribution[]
  groceryLists: GroceryList[]
  groceryItems: GroceryItem[]
  chores: Chore[]
  chat: ChatMessage[]
  vehicles: Vehicle[]
  vehicleExpenses: VehicleExpense[]
  trips: Trip[]
  tripExpenses: TripExpense[]
  investments: Investment[]
  policies: InsurancePolicy[]
  taxDocs: TaxDocument[]
}

/** Maps each LedgerData collection to its database table. */
export const TABLES = {
  expenses: 'expenses',
  incomes: 'incomes',
  splits: 'expense_splits',
  settlements: 'settlements',
  reimbursements: 'reimbursements',
  budgets: 'budgets',
  bills: 'recurring_bills',
  wallet: 'wallet_transactions',
  goals: 'goals',
  contributions: 'goal_contributions',
  groceryLists: 'grocery_lists',
  groceryItems: 'grocery_items',
  chores: 'chores',
  chat: 'chat_messages',
  vehicles: 'vehicles',
  vehicleExpenses: 'vehicle_expenses',
  trips: 'trips',
  tripExpenses: 'trip_expenses',
  investments: 'investments',
  policies: 'insurance_policies',
  taxDocs: 'tax_documents',
} as const

export type Collection = keyof typeof TABLES
export type RowOf<C extends Collection> = LedgerData[C][number]

export const isManagerRole = (role: Role | undefined) => role === 'HOUSEHEAD' || role === 'PARENT'
