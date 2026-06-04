// ─── Auth Types ────────────────────────────────────────────────────────────
export interface User {
  userId: number
  fullName: string
  email: string
  role: UserRole
  isHousehead: boolean
  householdId: number
  householdName: string
  inviteCode: string
  walletBalance: number
  avatarUrl?: string
  token: string
  refreshToken: string
}

export type UserRole = 
  | 'HOUSEHEAD'
  | 'PARENT'
  | 'ADULT_CHILD'
  | 'STUDENT'
  | 'GRANDPARENT'
  | 'GUEST'

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  fullName: string
  email: string
  phone?: string
  password: string
  householdName?: string
  inviteCode?: string
  role?: UserRole
  monthlyIncome?: number
}

// ─── Expense Types ─────────────────────────────────────────────────────────
export type ExpenseCategory =
  | 'FOOD' | 'GROCERIES' | 'PETROL' | 'TRAVEL' | 'RENT' | 'ELECTRICITY'
  | 'INTERNET' | 'MEDICAL' | 'SHOPPING' | 'EDUCATION' | 'ENTERTAINMENT'
  | 'INVESTMENT' | 'SAVINGS' | 'REPAIRS' | 'MAINTENANCE' | 'EMERGENCY'
  | 'CLOTHING' | 'PERSONAL_CARE' | 'VEHICLE' | 'UTILITIES' | 'SUBSCRIPTION' | 'OTHER'

export type ExpenseType = 'FIXED' | 'VARIABLE' | 'EMERGENCY' | 'SHARED' | 'EVENT' | 'REIMBURSEMENT' | 'ASSET' | 'VEHICLE'
export type ExpenseVisibility = 'PERSONAL' | 'HOUSEHOLD' | 'PARENTS_ONLY' | 'HOUSEHEAD_ONLY'

export interface Expense {
  id: number
  amount: number
  description: string
  category: ExpenseCategory
  expenseType: ExpenseType
  visibility: ExpenseVisibility
  expenseDate: string
  notes?: string
  isShared: boolean
  isReimbursable: boolean
  paidForHousehold: boolean
  vehicleId?: number
  tripId?: number
  tags?: string
  createdAt: string
  user?: { id: number; fullName: string; avatarUrl?: string }
}

export interface ExpenseRequest {
  amount: number
  description: string
  category: ExpenseCategory
  expenseType: ExpenseType
  visibility?: ExpenseVisibility
  expenseDate?: string
  notes?: string
  isShared?: boolean
  isReimbursable?: boolean
  paidForHousehold?: boolean
  vehicleId?: number
  tripId?: number
  tags?: string
}

// ─── Reimbursement Types ───────────────────────────────────────────────────
export type ReimbursementStatus = 'PENDING' | 'APPROVED' | 'SETTLED' | 'REJECTED' | 'CANCELLED'

export interface Reimbursement {
  id: number
  amount: number
  description: string
  category?: string
  status: ReimbursementStatus
  paidDate: string
  settledDate?: string
  notes?: string
  isHouseholdExpense: boolean
  payer: { id: number; fullName: string; avatarUrl?: string }
  reimbursee?: { id: number; fullName: string }
  approvedBy?: { id: number; fullName: string }
  createdAt: string
}

// ─── Vehicle Types ─────────────────────────────────────────────────────────
export type VehicleType = 'BIKE' | 'SCOOTY' | 'CAR' | 'AUTO' | 'TRUCK' | 'CYCLE' | 'OTHER'
export type VehicleExpenseType = 'FUEL' | 'MAINTENANCE' | 'INSURANCE' | 'REPAIR' | 'SERVICE' | 'PUC' | 'ACCESSORIES' | 'WASHING' | 'OTHER'

export interface Vehicle {
  id: number
  name: string
  registrationNumber?: string
  vehicleType: VehicleType
  make?: string
  model?: string
  year?: number
  fuelType?: string
  mileageKmpl?: number
  insuranceExpiry?: string
  pucExpiry?: string
  lastServiceDate?: string
  nextServiceDue?: string
  totalFuelCost: number
  totalMaintenanceCost: number
  isShared: boolean
  imageUrl?: string
  notes?: string
  isActive: boolean
  owner: { id: number; fullName: string }
}

// ─── Budget Types ──────────────────────────────────────────────────────────
export type BudgetType = 'PERSONAL' | 'HOUSEHOLD' | 'SHARED'

export interface Budget {
  id: number
  category: ExpenseCategory
  monthlyLimit: number
  currentSpent: number
  month: number
  year: number
  budgetType: BudgetType
  alertAtPercent: number
  isActive: boolean
}

// ─── Analytics Types ───────────────────────────────────────────────────────
export interface MonthlyTrendItem {
  month: string
  year: number
  total: number
}

export interface CategoryBreakdownItem {
  category: string
  amount: number
}

export interface MemberSpending {
  memberId: number
  name: string
  role: UserRole
  spent: number
  walletBalance: number
}

export interface HouseholdAnalytics {
  monthlyTrend: MonthlyTrendItem[]
  categoryBreakdown: CategoryBreakdownItem[]
  memberSpending: MemberSpending[]
  pendingReimbursements: number
  totalMonthlyIncome: number
  currentMonthTotal: number
  netSavings: number
}

export interface PersonalAnalytics {
  monthlyTrend: MonthlyTrendItem[]
  currentMonthSpend: number
  monthlyIncome: number
  savings: number
  walletBalance: number
  pendingReimbursements: number
}

// ─── AI Types ──────────────────────────────────────────────────────────────
export interface AiInsight {
  type: 'WARNING' | 'TIP' | 'ALERT' | 'POSITIVE'
  title: string
  message: string
  category: string
  amount?: number
  icon: string
  priority: number
}

export interface FinancialHealthScore {
  score: number
  grade: string
  status: string
  savingsRatio: number
  expenseStability: number
  emergencyReadiness: number
  investmentBalance: number
  strengths: string[]
  improvements: string[]
  breakdown: Record<string, number>
}

export interface ExpensePrediction {
  category: string
  predictedAmount: number
  lastMonthAmount: number
  changePercent: number
  trend: 'UP' | 'DOWN' | 'STABLE'
  reason: string
}

export interface InvestmentOption {
  name: string
  type: string
  suggestedAmount: number
  expectedReturn: string
  riskLevel: string
  description: string
  icon: string
}

export interface InvestmentAdvice {
  monthlySurplus: number
  recommendedInvestment: number
  riskProfile: string
  recommendations: InvestmentOption[]
  allocation: Record<string, number>
}

// ─── API Response ─────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  errors?: Record<string, string>
  timestamp: string
}

export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
}

// ─── Household Member ──────────────────────────────────────────────────────
export interface HouseholdMember {
  id: number
  fullName: string
  email: string
  role: UserRole
  isHousehead: boolean
  walletBalance: number
  monthlyIncome?: number
  phone?: string
  gender?: string
  avatarUrl?: string
}
