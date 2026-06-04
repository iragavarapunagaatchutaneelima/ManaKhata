import axios, { AxiosInstance, AxiosResponse } from 'axios'
import type { ApiResponse } from '@/types'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
const DEMO_PASSWORD = 'Demo@1234'

const demoUsers = [
  { userId: 1, fullName: 'Mario', email: 'demo@manaKhata.app', role: 'HOUSEHEAD', isHousehead: true, walletBalance: 45000 },
  { userId: 2, fullName: 'Ria', email: 'ria@manaKhata.app', role: 'PARENT', isHousehead: false, walletBalance: 18500 },
  { userId: 3, fullName: 'Max', email: 'max@manaKhata.app', role: 'ADULT_CHILD', isHousehead: false, walletBalance: 7200 },
  { userId: 4, fullName: 'Lucy', email: 'lucy@manaKhata.app', role: 'STUDENT', isHousehead: false, walletBalance: 5200 },
  { userId: 5, fullName: 'Jack', email: 'jack@manaKhata.app', role: 'STUDENT', isHousehead: false, walletBalance: 3000 },
] as const

const demoMembers = demoUsers.map((user) => ({
  id: user.userId,
  fullName: user.fullName,
  email: user.email,
  role: user.role,
  isHousehead: user.isHousehead,
  walletBalance: user.walletBalance,
  monthlyIncome: user.isHousehead ? 95000 : user.role === 'PARENT' ? 52000 : 0,
  phone: user.userId === 1 ? '+91 98765 43210' : undefined,
  canViewHousehold: true,
  canViewAnalytics: user.role !== 'STUDENT',
  canManageExpenses: user.role !== 'STUDENT',
}))

const demoExpenses = [
  { id: 1, amount: 2450, description: 'Monthly groceries', category: 'GROCERIES', expenseType: 'VARIABLE', visibility: 'HOUSEHOLD', expenseDate: '2026-05-20', isShared: true, isReimbursable: false, paidForHousehold: true, createdAt: new Date().toISOString() },
  { id: 2, amount: 1800, description: 'Fuel refill', category: 'PETROL', expenseType: 'VEHICLE', visibility: 'HOUSEHOLD', expenseDate: '2026-05-18', isShared: true, isReimbursable: true, paidForHousehold: true, createdAt: new Date().toISOString() },
  { id: 3, amount: 999, description: 'Internet bill', category: 'INTERNET', expenseType: 'FIXED', visibility: 'HOUSEHOLD', expenseDate: '2026-05-15', isShared: true, isReimbursable: false, paidForHousehold: true, createdAt: new Date().toISOString() },
  { id: 4, amount: 1250, description: 'Medical supplies', category: 'MEDICAL', expenseType: 'EMERGENCY', visibility: 'HOUSEHOLD', expenseDate: '2026-05-12', isShared: false, isReimbursable: false, paidForHousehold: false, createdAt: new Date().toISOString() },
  { id: 5, amount: 4200, description: 'Electricity smart meter recharge', category: 'ELECTRICITY', expenseType: 'FIXED', visibility: 'HOUSEHOLD', expenseDate: '2026-05-10', isShared: true, isReimbursable: false, paidForHousehold: true, createdAt: new Date().toISOString() },
  { id: 6, amount: 6500, description: 'School term books and stationery', category: 'EDUCATION', expenseType: 'VARIABLE', visibility: 'HOUSEHOLD', expenseDate: '2026-05-09', isShared: false, isReimbursable: true, paidForHousehold: true, createdAt: new Date().toISOString() },
  { id: 7, amount: 2199, description: 'OTT and music subscriptions', category: 'SUBSCRIPTION', expenseType: 'FIXED', visibility: 'HOUSEHOLD', expenseDate: '2026-05-07', isShared: true, isReimbursable: false, paidForHousehold: true, createdAt: new Date().toISOString() },
  { id: 8, amount: 3100, description: 'Weekend dinner with family', category: 'FOOD', expenseType: 'VARIABLE', visibility: 'HOUSEHOLD', expenseDate: '2026-05-04', isShared: true, isReimbursable: false, paidForHousehold: true, createdAt: new Date().toISOString() },
  { id: 9, amount: 12000, description: 'SIP mutual fund auto debit', category: 'INVESTMENT', expenseType: 'FIXED', visibility: 'PERSONAL', expenseDate: '2026-05-03', isShared: false, isReimbursable: false, paidForHousehold: false, createdAt: new Date().toISOString() },
  { id: 10, amount: 1750, description: 'Car wash and accessories', category: 'VEHICLE', expenseType: 'VEHICLE', visibility: 'HOUSEHOLD', expenseDate: '2026-05-02', isShared: true, isReimbursable: false, paidForHousehold: true, createdAt: new Date().toISOString() },
]

const householdAnalytics = {
  monthlyTrend: [
    { month: 'Dec', year: 2025, total: 68000 },
    { month: 'Jan', year: 2026, total: 72500 },
    { month: 'Feb', year: 2026, total: 64200 },
    { month: 'Mar', year: 2026, total: 70100 },
    { month: 'Apr', year: 2026, total: 66300 },
    { month: 'May', year: 2026, total: 58400 },
  ],
  categoryBreakdown: [
    { category: 'GROCERIES', amount: 18200 },
    { category: 'PETROL', amount: 9100 },
    { category: 'ELECTRICITY', amount: 4200 },
    { category: 'MEDICAL', amount: 3600 },
    { category: 'ENTERTAINMENT', amount: 5200 },
  ],
  memberSpending: [
    { memberId: 1, name: 'Mario', role: 'HOUSEHEAD', spent: 24800, walletBalance: 45000 },
    { memberId: 2, name: 'Ria', role: 'PARENT', spent: 17100, walletBalance: 18500 },
    { memberId: 3, name: 'Max', role: 'ADULT_CHILD', spent: 9800, walletBalance: 7200 },
    { memberId: 4, name: 'Lucy', role: 'STUDENT', spent: 6700, walletBalance: 5200 },
    { memberId: 5, name: 'Jack', role: 'STUDENT', spent: 4000, walletBalance: 3000 },
  ],
  pendingReimbursements: 4800,
  totalMonthlyIncome: 147000,
  currentMonthTotal: 58400,
  netSavings: 88600,
}

function demoResponse<T>(data: T, message = 'Demo data loaded'): ApiResponse<T> {
  return { success: true, message, data, timestamp: new Date().toISOString() }
}

function shouldUseDemo(error: any) {
  // Fall back to demo data for: network errors, 401 Unauthorized (expired/invalid JWT), 403 Forbidden
  if (!error?.response || error.code === 'ERR_NETWORK' || error.message === 'Network Error') return true
  if (error.response?.status === 401 || error.response?.status === 403) {
    // Clear stale tokens silently so next real login works
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mk_token')
      localStorage.removeItem('mk_refresh')
    }
    return true
  }
  return false
}

class ApiClient {
  private instance: AxiosInstance

  constructor() {
    this.instance = axios.create({
      baseURL: BASE_URL,
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
    })

    this.instance.interceptors.request.use(
      (config) => {
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('mk_token')
          if (token) config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )
  }

  async login(email: string, password: string) {
    try {
      const res: AxiosResponse<ApiResponse<any>> = await this.instance.post('/api/auth/login', { email, password })
      return res.data
    } catch (error: any) {
      if (!shouldUseDemo(error)) throw error
      const demoUser = demoUsers.find((user) => user.email.toLowerCase() === email.toLowerCase())
      if (!demoUser || password !== DEMO_PASSWORD) {
        throw new Error('Invalid demo credentials. Use one of the quick demo accounts.')
      }
      return demoResponse({
        ...demoUser,
        householdId: 1,
        householdName: 'Mario Family',
        inviteCode: 'MARIO01',
        token: `demo-token-${demoUser.userId}`,
        refreshToken: `demo-refresh-${demoUser.userId}`,
      }, 'Signed in with hosted demo data')
    }
  }

  async register(data: any) {
    try {
      const res: AxiosResponse<ApiResponse<any>> = await this.instance.post('/api/auth/register', data)
      return res.data
    } catch (error: any) {
      if (!shouldUseDemo(error)) throw error
      return demoResponse({
        userId: 99,
        fullName: data.fullName,
        email: data.email,
        role: data.role || 'HOUSEHEAD',
        isHousehead: true,
        householdId: 1,
        householdName: data.householdName || 'Demo Household',
        inviteCode: data.inviteCode || 'DEMO2026',
        walletBalance: 0,
        token: 'demo-token-new-user',
        refreshToken: 'demo-refresh-new-user',
      }, 'Account created in demo mode')
    }
  }

  async getHousehold() {
    try {
      const res: AxiosResponse<ApiResponse<any>> = await this.instance.get('/api/household')
      return res.data
    } catch (error: any) {
      if (!shouldUseDemo(error)) throw error
      return demoResponse({
        household: { id: 1, name: 'Mario Family', inviteCode: 'MARIO01', address: '12, Green Park Colony', city: 'New Delhi', currency: 'INR' },
        members: demoMembers,
      })
    }
  }

  async getMembers() {
    try {
      const res: AxiosResponse<ApiResponse<any>> = await this.instance.get('/api/household/members')
      return res.data
    } catch (error: any) {
      if (!shouldUseDemo(error)) throw error
      return demoResponse(demoMembers)
    }
  }

  async updatePermissions(memberId: number, permissions: Record<string, boolean>) {
    try {
      const res: AxiosResponse<ApiResponse<any>> = await this.instance.patch(`/api/household/members/${memberId}/permissions`, permissions)
      return res.data
    } catch (error: any) {
      if (!shouldUseDemo(error)) throw error
      return demoResponse({ memberId, ...permissions }, 'Permission updated in demo mode')
    }
  }

  async allocateWallet(memberId: number, amount: number) {
    try {
      const res: AxiosResponse<ApiResponse<any>> = await this.instance.post('/api/household/wallet/allocate', { memberId, amount })
      return res.data
    } catch (error: any) {
      if (!shouldUseDemo(error)) throw error
      return demoResponse({ memberId, amount }, 'Wallet allocation saved in demo mode')
    }
  }

  async getMyExpenses(page = 0, size = 20) {
    try {
      const res: AxiosResponse<ApiResponse<any>> = await this.instance.get(`/api/expenses?page=${page}&size=${size}`)
      return res.data
    } catch (error: any) {
      if (!shouldUseDemo(error)) throw error
      return demoResponse({ content: demoExpenses.slice(0, size), totalElements: demoExpenses.length, totalPages: 1, size, number: page, first: true, last: true })
    }
  }

  async getHouseholdExpenses(page = 0, size = 20) {
    return this.getMyExpenses(page, size)
  }

  async createExpense(data: any) {
    try {
      const res: AxiosResponse<ApiResponse<any>> = await this.instance.post('/api/expenses', data)
      return res.data
    } catch (error: any) {
      if (!shouldUseDemo(error)) throw error
      return demoResponse({ id: Date.now(), ...data, createdAt: new Date().toISOString() }, 'Expense added in demo mode')
    }
  }

  async updateExpense(id: number, data: any) {
    try {
      const res: AxiosResponse<ApiResponse<any>> = await this.instance.put(`/api/expenses/${id}`, data)
      return res.data
    } catch (error: any) {
      if (!shouldUseDemo(error)) throw error
      return demoResponse({ id, ...data }, 'Expense updated in demo mode')
    }
  }

  async deleteExpense(id: number) {
    try {
      const res: AxiosResponse<ApiResponse<any>> = await this.instance.delete(`/api/expenses/${id}`)
      return res.data
    } catch (error: any) {
      if (!shouldUseDemo(error)) throw error
      return demoResponse({ id }, 'Expense removed in demo mode')
    }
  }

  async getExpenseSummary(year?: number, month?: number) {
    try {
      const params = new URLSearchParams()
      if (year) params.append('year', year.toString())
      if (month) params.append('month', month.toString())
      const res: AxiosResponse<ApiResponse<any>> = await this.instance.get(`/api/expenses/summary?${params}`)
      return res.data
    } catch (error: any) {
      if (!shouldUseDemo(error)) throw error
      return demoResponse({
        total: 22150,
        personalTotal: 22150,
        householdTotal: 58400,
        categoryBreakdown: householdAnalytics.categoryBreakdown,
      })
    }
  }

  async getReimbursements(filter?: string, page = 0, size = 20) {
    try {
      const params = new URLSearchParams({ page: page.toString(), size: size.toString() })
      if (filter) params.append('filter', filter)
      const res: AxiosResponse<ApiResponse<any>> = await this.instance.get(`/api/reimbursements?${params}`)
      return res.data
    } catch (error: any) {
      if (!shouldUseDemo(error)) throw error
      const content = [
        { id: 1, amount: 2500, description: 'AC repair technician charges', category: 'MAINTENANCE', status: 'PENDING', paidDate: '2026-05-26', isHouseholdExpense: true, payer: { id: 3, fullName: 'Max' }, createdAt: new Date().toISOString() },
        { id: 2, amount: 1800, description: 'Weekly grocery run', category: 'GROCERIES', status: 'PENDING', paidDate: '2026-05-24', isHouseholdExpense: true, payer: { id: 4, fullName: 'Lucy' }, createdAt: new Date().toISOString() },
        { id: 3, amount: 4200, description: 'Cook salary advance', category: 'HOUSEHOLD', status: 'APPROVED', paidDate: '2026-05-18', isHouseholdExpense: true, payer: { id: 2, fullName: 'Ria' }, approvedBy: { id: 1, fullName: 'Mario' }, createdAt: new Date().toISOString() },
        { id: 4, amount: 3500, description: 'Electricity bill reimbursement', category: 'ELECTRICITY', status: 'SETTLED', paidDate: '2026-04-28', settledDate: '2026-05-01', isHouseholdExpense: true, payer: { id: 3, fullName: 'Max' }, approvedBy: { id: 1, fullName: 'Mario' }, createdAt: new Date().toISOString() },
      ]
      const filtered = filter ? content.filter((item) => item.status === filter.toUpperCase()) : content
      return demoResponse({ content: filtered, totalElements: filtered.length, totalPages: 1, size, number: page, first: true, last: true })
    }
  }

  async createReimbursement(data: any) {
    try {
      const res: AxiosResponse<ApiResponse<any>> = await this.instance.post('/api/reimbursements', data)
      return res.data
    } catch (error: any) {
      if (!shouldUseDemo(error)) throw error
      return demoResponse({ id: Date.now(), ...data }, 'Reimbursement submitted in demo mode')
    }
  }

  async approveReimbursement(id: number) { return this.demoMutation(`/api/reimbursements/${id}/approve`, 'patch', { id }) }
  async settleReimbursement(id: number) { return this.demoMutation(`/api/reimbursements/${id}/settle`, 'patch', { id }) }
  async rejectReimbursement(id: number) { return this.demoMutation(`/api/reimbursements/${id}/reject`, 'patch', { id }) }

  async getReimbursementSummary() {
    try {
      const res: AxiosResponse<ApiResponse<any>> = await this.instance.get('/api/reimbursements/summary')
      return res.data
    } catch (error: any) {
      if (!shouldUseDemo(error)) throw error
      return demoResponse({ pending: 4800, approved: 2500, settled: 12000 })
    }
  }

  async getVehicles() {
    try {
      const res: AxiosResponse<ApiResponse<any>> = await this.instance.get('/api/vehicles')
      return res.data
    } catch (error: any) {
      if (!shouldUseDemo(error)) throw error
      return demoResponse([
        { id: 1, name: 'Family Car', registrationNumber: 'TS09AB1234', vehicleType: 'CAR', make: 'Hyundai', model: 'Creta', year: 2022, fuelType: 'Petrol', mileageKmpl: 15, totalFuelCost: 9100, totalMaintenanceCost: 4200, isShared: true, isActive: true, owner: { id: 1, fullName: 'Mario' } },
        { id: 2, name: 'Mario\'s Scooty', registrationNumber: 'DL-3C-AB-1234', vehicleType: 'SCOOTY', make: 'Honda', model: 'Activa', year: 2021, fuelType: 'Petrol', mileageKmpl: 45, totalFuelCost: 2000, totalMaintenanceCost: 500, isShared: true, isActive: true, owner: { id: 1, fullName: 'Mario' } },
        { id: 3, name: 'Max\'s Bike', registrationNumber: 'DL-3C-EF-9012', vehicleType: 'BIKE', make: 'Royal Enfield', model: 'Classic 350', year: 2022, fuelType: 'Petrol', mileageKmpl: 35, totalFuelCost: 5000, totalMaintenanceCost: 1000, isShared: false, isActive: true, owner: { id: 3, fullName: 'Max' } },
        { id: 4, name: 'Jack\'s Bike', registrationNumber: 'DL-3C-GH-3456', vehicleType: 'BIKE', make: 'Yamaha', model: 'MT-15', year: 2023, fuelType: 'Petrol', mileageKmpl: 40, totalFuelCost: 3000, totalMaintenanceCost: 500, isShared: false, isActive: true, owner: { id: 5, fullName: 'Jack' } },
      ])
    }
  }

  async getVehicleDetail(id: number) {
    const res = await this.getVehicles()
    return demoResponse((res.data || []).find((vehicle: any) => vehicle.id === id) || res.data?.[0])
  }

  async addVehicle(data: any) { return this.demoMutation('/api/vehicles', 'post', { id: Date.now(), ...data }) }
  async addVehicleExpense(vehicleId: number, data: any) { return this.demoMutation(`/api/vehicles/${vehicleId}/expenses`, 'post', { vehicleId, ...data }) }

  async getMyBudgets(month?: number, year?: number) {
    try {
      const params = new URLSearchParams()
      if (month) params.append('month', month.toString())
      if (year) params.append('year', year.toString())
      const res: AxiosResponse<ApiResponse<any>> = await this.instance.get(`/api/budgets?${params}`)
      return res.data
    } catch (error: any) {
      if (!shouldUseDemo(error)) throw error
      return demoResponse([
        { id: 1, category: 'GROCERIES', monthlyLimit: 12000, currentSpent: 8200, month: 5, year: 2026, budgetType: 'HOUSEHOLD', alertAtPercent: 80, isActive: true },
        { id: 2, category: 'PETROL', monthlyLimit: 7000, currentSpent: 5100, month: 5, year: 2026, budgetType: 'HOUSEHOLD', alertAtPercent: 80, isActive: true },
        { id: 3, category: 'ENTERTAINMENT', monthlyLimit: 5000, currentSpent: 2200, month: 5, year: 2026, budgetType: 'PERSONAL', alertAtPercent: 75, isActive: true },
      ])
    }
  }

  async getHouseholdBudgets(month?: number, year?: number) {
    return this.getMyBudgets(month, year)
  }

  async createBudget(data: any) { return this.demoMutation('/api/budgets', 'post', { id: Date.now(), ...data }) }

  async getHouseholdAnalytics() {
    try {
      const res: AxiosResponse<ApiResponse<any>> = await this.instance.get('/api/analytics/household')
      return res.data
    } catch (error: any) {
      if (!shouldUseDemo(error)) throw error
      return demoResponse(householdAnalytics)
    }
  }

  async getPersonalAnalytics() {
    try {
      const res: AxiosResponse<ApiResponse<any>> = await this.instance.get('/api/analytics/personal')
      return res.data
    } catch (error: any) {
      if (!shouldUseDemo(error)) throw error
      return demoResponse({
        monthlyTrend: [
          { month: 'Dec', year: 2025, total: 26500 },
          { month: 'Jan', year: 2026, total: 28100 },
          { month: 'Feb', year: 2026, total: 24200 },
          { month: 'Mar', year: 2026, total: 27400 },
          { month: 'Apr', year: 2026, total: 25300 },
          { month: 'May', year: 2026, total: 22150 },
        ],
        currentMonthSpend: 22150,
        monthlyIncome: 95000,
        savings: 72850,
        walletBalance: 45000,
        pendingReimbursements: 1800,
      })
    }
  }

  async getAiInsights() {
    try {
      const res: AxiosResponse<ApiResponse<any>> = await this.instance.get('/api/ai/insights')
      return res.data
    } catch (error: any) {
      if (!shouldUseDemo(error)) throw error
      return demoResponse([
        { type: 'POSITIVE', title: 'Savings are strong', message: 'Your household is saving more than 55% of income this month.', category: 'SAVINGS', icon: '💰', priority: 1 },
        { type: 'TIP', title: 'Fuel spending trend', message: 'Vehicle expenses are steady. Keep logging fuel expenses for better mileage insights.', category: 'VEHICLE', icon: '⛽', priority: 2 },
        { type: 'ALERT', title: 'Budget watch', message: 'Groceries are close to the monthly alert threshold.', category: 'GROCERIES', icon: '🛒', priority: 3 },
      ])
    }
  }

  async getHealthScore() {
    try {
      const res: AxiosResponse<ApiResponse<any>> = await this.instance.get('/api/ai/health-score')
      return res.data
    } catch (error: any) {
      if (!shouldUseDemo(error)) throw error
      return demoResponse({
        score: 86,
        grade: 'A',
        status: 'Healthy',
        savingsRatio: 76,
        expenseStability: 82,
        emergencyReadiness: 88,
        investmentBalance: 72,
        strengths: ['High savings ratio', 'Stable recurring expenses'],
        improvements: ['Increase investment allocation', 'Review grocery budget'],
        breakdown: { savings: 86, stability: 82, emergency: 88, investments: 72 },
      })
    }
  }

  async getPredictions() {
    try {
      const res: AxiosResponse<ApiResponse<any>> = await this.instance.get('/api/ai/predictions')
      return res.data
    } catch (error: any) {
      if (!shouldUseDemo(error)) throw error
      return demoResponse([
        { category: 'GROCERIES', predictedAmount: 12800, lastMonthAmount: 11800, changePercent: 8, trend: 'UP', reason: 'Weekend purchase frequency increased.' },
        { category: 'PETROL', predictedAmount: 7200, lastMonthAmount: 7400, changePercent: -3, trend: 'STABLE', reason: 'Vehicle usage is consistent.' },
      ])
    }
  }

  async getInvestmentAdvice() {
    try {
      const res: AxiosResponse<ApiResponse<any>> = await this.instance.get('/api/ai/investments')
      return res.data
    } catch (error: any) {
      if (!shouldUseDemo(error)) throw error
      return demoResponse({
        monthlySurplus: 72850,
        recommendedInvestment: 36000,
        riskProfile: 'Balanced',
        recommendations: [
          { name: 'Index Mutual Fund', type: 'Equity', suggestedAmount: 18000, expectedReturn: '10-12%', riskLevel: 'Medium', description: 'Core long-term wealth allocation.', icon: '📈' },
          { name: 'Recurring Deposit', type: 'Debt', suggestedAmount: 10000, expectedReturn: '6-7%', riskLevel: 'Low', description: 'Stable savings for short-term goals.', icon: '🏦' },
        ],
        allocation: { equity: 50, debt: 30, emergency: 20 },
      })
    }
  }

  async getWallet() {
    try {
      const res: AxiosResponse<ApiResponse<any>> = await this.instance.get('/api/wallet')
      return res.data
    } catch (error: any) {
      if (!shouldUseDemo(error)) throw error
      return demoResponse({
        balance: 45000,
        transactions: [
          { id: 1, type: 'CREDIT', amount: 10000, description: 'Salary credit', date: '2026-05-01', createdAt: new Date().toISOString() },
          { id: 2, type: 'DEBIT',  amount: 2450,  description: 'Monthly groceries', date: '2026-05-20', createdAt: new Date().toISOString() },
          { id: 3, type: 'DEBIT',  amount: 1800,  description: 'Fuel refill', date: '2026-05-18', createdAt: new Date().toISOString() },
        ],
        monthlyInflow: 95000,
        monthlyOutflow: 22150,
      })
    }
  }

  async transferWallet(toMemberId: number, amount: number, note?: string) {
    return this.demoMutation('/api/wallet/transfer', 'post', { toMemberId, amount, note })
  }



  async getChatMessages(householdId?: number) {
    try {
      const res: AxiosResponse<ApiResponse<any>> = await this.instance.get('/api/chat/messages')
      return res.data
    } catch (error: any) {
      if (!shouldUseDemo(error)) throw error
      return demoResponse([
        { id: 1, message: 'Groceries done! Spent ₹2,450 today.', sender: { id: 1, fullName: 'Mario' }, createdAt: new Date(Date.now() - 3600000).toISOString() },
        { id: 2, message: 'Noted! I\'ll add the fuel expense.', sender: { id: 2, fullName: 'Ria' }, createdAt: new Date(Date.now() - 1800000).toISOString() },
        { id: 3, message: 'Should we plan the Switzerland trip this August?', sender: { id: 3, fullName: 'Max' }, createdAt: new Date(Date.now() - 600000).toISOString() },
      ])
    }
  }

  async sendChatMessage(message: string) {
    return this.demoMutation('/api/chat/messages', 'post', {
      id: Date.now(),
      message,
      createdAt: new Date().toISOString(),
    })
  }

  async createExpenseSplit(data: { expenseId: number; owedByUserId: number; amount: number; note?: string }) {
    return this.demoMutation('/api/splits', 'post', { id: Date.now(), ...data, isSettled: false, createdAt: new Date().toISOString() })
  }

  async getMySplits() {
    try {
      const res: AxiosResponse<ApiResponse<any>> = await this.instance.get('/api/splits')
      return res.data
    } catch (error: any) {
      if (!shouldUseDemo(error)) throw error
      return demoResponse([
        { id: 1, owedBy: { id: 2, fullName: 'Ria' }, owedTo: { id: 1, fullName: 'Mario' }, amount: 1225, note: 'Split for: Monthly groceries', isSettled: false, createdAt: new Date(Date.now() - 172800000).toISOString(), expense: { description: 'Monthly groceries', category: 'GROCERIES' } },
        { id: 2, owedBy: { id: 3, fullName: 'Max' }, owedTo: { id: 1, fullName: 'Mario' }, amount: 900, note: 'Split for: Fuel refill', isSettled: false, createdAt: new Date(Date.now() - 86400000).toISOString(), expense: { description: 'Fuel refill', category: 'PETROL' } },
        { id: 3, owedBy: { id: 1, fullName: 'Mario' }, owedTo: { id: 2, fullName: 'Ria' }, amount: 500, note: 'Split for: Medical supplies', isSettled: true, createdAt: new Date(Date.now() - 604800000).toISOString(), expense: { description: 'Medical supplies', category: 'MEDICAL' } },
      ])
    }
  }

  async settleSplit(id: number) {
    return this.demoMutation(`/api/splits/${id}/settle`, 'patch', { id, isSettled: true })
  }

  async getGroceryLists() {
    try {
      const res: AxiosResponse<ApiResponse<any>> = await this.instance.get('/api/grocery')
      return res.data
    } catch (error: any) {
      if (!shouldUseDemo(error)) throw error
      return demoResponse([
        {
          id: 1, name: 'Weekly Vegetables & Fruits', isCompleted: false,
          createdBy: { id: 1, fullName: 'Mario' },
          createdAt: new Date().toISOString(),
          items: [
            { id: 1, name: 'Tomatoes', quantity: 2, unit: 'kg', estimatedPrice: 60, isChecked: true, category: 'Vegetables' },
            { id: 2, name: 'Onions', quantity: 1, unit: 'kg', estimatedPrice: 40, isChecked: false, category: 'Vegetables' },
            { id: 3, name: 'Bananas', quantity: 12, unit: 'pcs', estimatedPrice: 60, isChecked: false, category: 'Fruits' },
            { id: 4, name: 'Milk', quantity: 2, unit: 'L', estimatedPrice: 100, isChecked: false, category: 'Dairy' },
            { id: 5, name: 'Bread', quantity: 1, unit: 'pcs', estimatedPrice: 45, isChecked: true, category: 'Bakery' },
          ]
        },
        {
          id: 2, name: 'Monthly Staples', isCompleted: true,
          createdBy: { id: 2, fullName: 'Ria' },
          createdAt: new Date(Date.now() - 604800000).toISOString(),
          items: [
            { id: 6, name: 'Rice (5kg)', quantity: 1, unit: 'bag', estimatedPrice: 320, isChecked: true, category: 'Grains' },
            { id: 7, name: 'Dal', quantity: 2, unit: 'kg', estimatedPrice: 180, isChecked: true, category: 'Pulses' },
          ]
        },
      ])
    }
  }

  async createGroceryList(name: string) {
    return this.demoMutation('/api/grocery', 'post', {
      id: Date.now(), name, isCompleted: false,
      createdBy: { id: 1, fullName: 'Mario' },
      items: [], createdAt: new Date().toISOString()
    })
  }

  async addGroceryItem(listId: number, item: { name: string; quantity?: number; unit?: string; estimatedPrice?: number; category?: string }) {
    return this.demoMutation(`/api/grocery/${listId}/items`, 'post', {
      id: Date.now(), ...item, isChecked: false
    })
  }

  async toggleGroceryItem(itemId: number) {
    return this.demoMutation(`/api/grocery/items/${itemId}/check`, 'patch', { id: itemId })
  }

  async completeGroceryList(listId: number) {
    return this.demoMutation(`/api/grocery/${listId}/complete`, 'patch', { id: listId, isCompleted: true })
  }

  async deleteGroceryList(listId: number) {
    return this.demoMutation(`/api/grocery/${listId}`, 'delete', { id: listId })
  }

  async getGoals() {
    try {
      const res: AxiosResponse<ApiResponse<any>> = await this.instance.get('/api/goals')
      return res.data
    } catch (error: any) {
      if (!shouldUseDemo(error)) throw error
      return demoResponse([
        { id: 1, name: 'Goa Vacation Fund', description: 'Family trip in December', targetAmount: 50000, currentAmount: 32500, targetDate: '2027-12-01', contributions: [
          { amount: 20000, contributor: { fullName: 'Mario' }, contributionDate: new Date().toISOString() },
          { amount: 12500, contributor: { fullName: 'Ria' }, contributionDate: new Date().toISOString() }
        ] },
        { id: 2, name: 'New Smart TV', description: 'Sony Bravia 55 inch', targetAmount: 65000, currentAmount: 15000, targetDate: '2027-05-15', contributions: [
          { amount: 15000, contributor: { fullName: 'Mario' }, contributionDate: new Date().toISOString() }
        ] }
      ])
    }
  }

  async createGoal(data: { name: string; description: string; targetAmount: number; targetDate?: string }) {
    return this.demoMutation('/api/goals', 'post', {
      id: Date.now(), ...data, currentAmount: 0, contributions: []
    })
  }

  async addGoalContribution(goalId: number, data: { amount: number; note?: string }) {
    return this.demoMutation(`/api/goals/${goalId}/contribute`, 'post', {
      id: Date.now(), ...data, contributor: { fullName: 'Mario' }, contributionDate: new Date().toISOString()
    })
  }

  async getChores() {
    try {
      const res: AxiosResponse<ApiResponse<any>> = await this.instance.get('/api/chores')
      return res.data
    } catch (error: any) {
      if (!shouldUseDemo(error)) throw error
      return demoResponse([
        { id: 1, title: 'Wash the Family Car', description: 'Inside and outside', rewardAmount: 200, status: 'PENDING', dueDate: new Date().toISOString(), assignedTo: { id: 3, fullName: 'Max' } },
        { id: 2, title: 'Clean the garage', description: 'Organize tools and sweep floor', rewardAmount: 500, status: 'COMPLETED', dueDate: new Date(Date.now() - 86400000).toISOString(), assignedTo: { id: 4, fullName: 'Lucy' } },
        { id: 3, title: 'Mow the lawn', description: 'Front and back yard', rewardAmount: 300, status: 'APPROVED', dueDate: new Date(Date.now() - 172800000).toISOString(), assignedTo: { id: 3, fullName: 'Max' } }
      ])
    }
  }

  async createChore(data: { title: string; description?: string; rewardAmount: number; assignedToId: number; dueDate?: string }) {
    return this.demoMutation('/api/chores', 'post', {
      id: Date.now(), ...data, status: 'PENDING'
    })
  }

  async updateChoreStatus(choreId: number, status: 'PENDING' | 'COMPLETED' | 'APPROVED' | 'REJECTED') {
    return this.demoMutation(`/api/chores/${choreId}/status`, 'patch', { status })
  }

  async getInvestments() {
    try {
      const res: AxiosResponse<ApiResponse<any>> = await this.instance.get('/api/investments')
      return res.data
    } catch (error: any) {
      if (!shouldUseDemo(error)) throw error
      return demoResponse([
        { id: 1, name: 'HDFC Midcap Opportunities', assetType: 'MUTUAL_FUND', investedAmount: 50000, currentValue: 62000, investmentDate: new Date(Date.now() - 31536000000).toISOString(), platformOrBroker: 'Zerodha', owner: { fullName: 'Mario' } },
        { id: 2, name: 'Reliance Industries', assetType: 'STOCK', investedAmount: 25000, currentValue: 28500, investmentDate: new Date(Date.now() - 15768000000).toISOString(), platformOrBroker: 'Groww', owner: { fullName: 'Ria' } },
        { id: 3, name: 'SBI Fixed Deposit', assetType: 'FIXED_DEPOSIT', investedAmount: 100000, currentValue: 105000, investmentDate: new Date(Date.now() - 20000000000).toISOString(), platformOrBroker: 'SBI Yono', owner: { fullName: 'Mario' } }
      ])
    }
  }

  async createInvestment(data: { name: string; assetType: string; investedAmount: number; currentValue?: number; investmentDate?: string; platformOrBroker?: string }) {
    return this.demoMutation('/api/investments', 'post', {
      id: Date.now(), ...data, owner: { fullName: 'Mario' }, currentValue: data.currentValue || data.investedAmount
    })
  }

  async getPolicies() {
    try {
      const res: AxiosResponse<ApiResponse<any>> = await this.instance.get('/api/medical/policies')
      return res.data
    } catch (error: any) {
      if (!shouldUseDemo(error)) throw error
      return demoResponse([
        { id: 1, provider: 'Star Health', policyNumber: 'SH-123456789', policyType: 'Family Floater', coverageAmount: 1000000, premiumAmount: 24500, expiryDate: new Date(Date.now() + 15768000000).toISOString(), owner: { fullName: 'Mario' } },
        { id: 2, provider: 'LIC India', policyNumber: 'LIC-987654321', policyType: 'Term Life', coverageAmount: 10000000, premiumAmount: 18000, expiryDate: new Date(Date.now() + 5000000000).toISOString(), owner: { fullName: 'Mario' } }
      ])
    }
  }

  async createPolicy(data: { provider: string; policyNumber: string; policyType: string; coverageAmount: number; premiumAmount?: number; expiryDate?: string }) {
    return this.demoMutation('/api/medical/policies', 'post', {
      id: Date.now(), ...data, owner: { fullName: 'Mario' }
    })
  }

  async getBadges() {
    try {
      const res = await this.instance.get('/api/badges')
      return res.data
    } catch (error: any) {
      if (!shouldUseDemo(error)) throw error
      return demoResponse([
        { id: 1, name: 'First Goal Reached', description: 'You successfully completed your first savings goal.', icon: 'Trophy', earnedDate: new Date().toISOString() },
        { id: 2, name: 'Chore Master', description: 'Completed 10 chores on time.', icon: 'Star', earnedDate: new Date(Date.now() - 86400000).toISOString() }
      ])
    }
  }

  async getTaxDocuments() {
    try {
      const res = await this.instance.get('/api/tax')
      return res.data
    } catch (error: any) {
      if (!shouldUseDemo(error)) throw error
      return demoResponse([
        { id: 1, documentName: 'LIC Premium Receipt', category: '80C', amount: 50000, financialYear: '2023-2024', dateUploaded: new Date().toISOString() },
        { id: 2, documentName: 'Health Insurance', category: '80D', amount: 25000, financialYear: '2023-2024', dateUploaded: new Date(Date.now() - 86400000).toISOString() }
      ])
    }
  }

  async createTaxDocument(data: any) {
    return this.demoMutation('/api/tax', 'post', {
      id: Date.now(), ...data, dateUploaded: new Date().toISOString()
    })
  }

  async getTrips() {
    try {
      const res = await this.instance.get('/api/trips')
      return res.data
    } catch (error: any) {
      if (!shouldUseDemo(error)) throw error
      return demoResponse([
        { id: 1, destination: 'Goa', startDate: new Date(Date.now() + 864000000).toISOString(), endDate: new Date(Date.now() + 1296000000).toISOString(), budget: 50000, baseCurrency: 'INR' },
        { id: 2, destination: 'Dubai', startDate: new Date(Date.now() - 2592000000).toISOString(), endDate: new Date(Date.now() - 1728000000).toISOString(), budget: 150000, baseCurrency: 'AED' }
      ])
    }
  }

  async createTrip(data: any) {
    return this.demoMutation('/api/trips', 'post', {
      id: Date.now(), ...data
    })
  }

  async getTripExpenses(tripId: number) {
    try {
      const res = await this.instance.get(`/api/trips/${tripId}/expenses`)
      return res.data
    } catch (error: any) {
      if (!shouldUseDemo(error)) throw error
      return demoResponse([
        { id: 1, description: 'Flight Tickets', amount: 15000, currencyCode: 'INR', exchangeRate: 1.0, expenseDate: new Date().toISOString(), paidBy: { fullName: 'Mario' } },
        { id: 2, description: 'Hotel Booking', amount: 25000, currencyCode: 'INR', exchangeRate: 1.0, expenseDate: new Date().toISOString(), paidBy: { fullName: 'Ria' } }
      ])
    }
  }

  async createTripExpense(tripId: number, data: any) {
    return this.demoMutation(`/api/trips/${tripId}/expenses`, 'post', {
      id: Date.now(), ...data, expenseDate: new Date().toISOString(), paidBy: { fullName: 'Mario' }
    })
  }

  async getHouseholdMembers() {
    try {
      const res: AxiosResponse<ApiResponse<any>> = await this.instance.get('/api/household/members')
      return res.data
    } catch (error: any) {
      if (!shouldUseDemo(error)) throw error
      return demoResponse([
        { id: 1, fullName: 'Mario', role: 'HOUSEHEAD' },
        { id: 2, fullName: 'Ria', role: 'PARENT' },
        { id: 3, fullName: 'Max', role: 'ADULT_CHILD' },
        { id: 4, fullName: 'Lucy', role: 'STUDENT' },
        { id: 5, fullName: 'Jack', role: 'STUDENT' }
      ])
    }
  }

  private async demoMutation(path: string, method: 'post' | 'patch' | 'put' | 'delete', data?: any) {
    try {
      const res: AxiosResponse<ApiResponse<any>> = await this.instance[method](path, data)
      return res.data
    } catch (error: any) {
      if (!shouldUseDemo(error)) throw error
      return demoResponse(data || {}, 'Saved in demo mode')
    }
  }
}

export const api = new ApiClient()
export default api
