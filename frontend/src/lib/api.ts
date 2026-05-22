import axios, { AxiosInstance, AxiosResponse } from 'axios'
import type { ApiResponse } from '@/types'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
const DEMO_PASSWORD = 'Demo@1234'

const demoUsers = [
  { userId: 1, fullName: 'Rajesh Sharma', email: 'demo@manaKhata.app', role: 'HOUSEHEAD', isHousehead: true, walletBalance: 45000 },
  { userId: 2, fullName: 'Sunita Sharma', email: 'sunita@manaKhata.app', role: 'PARENT', isHousehead: false, walletBalance: 18500 },
  { userId: 3, fullName: 'Arjun Sharma', email: 'arjun@manaKhata.app', role: 'ADULT_CHILD', isHousehead: false, walletBalance: 7200 },
  { userId: 4, fullName: 'Priya Sharma', email: 'priya@manaKhata.app', role: 'STUDENT', isHousehead: false, walletBalance: 5200 },
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
    { memberId: 1, name: 'Rajesh Sharma', role: 'HOUSEHEAD', spent: 24800, walletBalance: 45000 },
    { memberId: 2, name: 'Sunita Sharma', role: 'PARENT', spent: 17100, walletBalance: 18500 },
    { memberId: 3, name: 'Arjun Sharma', role: 'ADULT_CHILD', spent: 9800, walletBalance: 7200 },
    { memberId: 4, name: 'Priya Sharma', role: 'STUDENT', spent: 6700, walletBalance: 5200 },
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
  return !error?.response || error.code === 'ERR_NETWORK' || error.message === 'Network Error'
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

    this.instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('mk_token')
          localStorage.removeItem('mk_refresh')
          localStorage.removeItem('mk_user')
          if (typeof window !== 'undefined') window.location.href = '/auth/login'
        }
        return Promise.reject(error)
      }
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
        householdName: 'Sharma Household',
        inviteCode: 'SHARMA01',
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
        household: { id: 1, name: 'Sharma Household', inviteCode: 'SHARMA01', address: 'Jubilee Hills', city: 'Hyderabad', currency: 'INR' },
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
      return demoResponse({ total: 22150, categoryBreakdown: householdAnalytics.categoryBreakdown })
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
      return demoResponse({ content: [], totalElements: 0, totalPages: 0, size, number: page, first: true, last: true })
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
        { id: 1, name: 'Family Car', registrationNumber: 'TS09AB1234', vehicleType: 'CAR', make: 'Hyundai', model: 'Creta', year: 2022, fuelType: 'Petrol', mileageKmpl: 15, totalFuelCost: 9100, totalMaintenanceCost: 4200, isShared: true, isActive: true, owner: { id: 1, fullName: 'Rajesh Sharma' } },
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
