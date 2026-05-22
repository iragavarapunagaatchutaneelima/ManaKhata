import axios, { AxiosInstance, AxiosResponse } from 'axios'
import type { ApiResponse } from '@/types'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

class ApiClient {
  private instance: AxiosInstance

  constructor() {
    this.instance = axios.create({
      baseURL: BASE_URL,
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
    })

    // Request interceptor — attach JWT
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

    // Response interceptor — handle 401
    this.instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('mk_token')
          localStorage.removeItem('mk_refresh')
          localStorage.removeItem('mk_user')
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login'
          }
        }
        return Promise.reject(error)
      }
    )
  }

  // ─── Auth ────────────────────────────────────────────────────────────────
  async login(email: string, password: string) {
    const res: AxiosResponse<ApiResponse<any>> = await this.instance.post('/api/auth/login', { email, password })
    return res.data
  }

  async register(data: any) {
    const res: AxiosResponse<ApiResponse<any>> = await this.instance.post('/api/auth/register', data)
    return res.data
  }

  // ─── Household ────────────────────────────────────────────────────────────
  async getHousehold() {
    const res: AxiosResponse<ApiResponse<any>> = await this.instance.get('/api/household')
    return res.data
  }

  async getMembers() {
    const res: AxiosResponse<ApiResponse<any>> = await this.instance.get('/api/household/members')
    return res.data
  }

  async updatePermissions(memberId: number, permissions: Record<string, boolean>) {
    const res: AxiosResponse<ApiResponse<any>> = await this.instance.patch(`/api/household/members/${memberId}/permissions`, permissions)
    return res.data
  }

  async allocateWallet(memberId: number, amount: number) {
    const res: AxiosResponse<ApiResponse<any>> = await this.instance.post('/api/household/wallet/allocate', { memberId, amount })
    return res.data
  }

  // ─── Expenses ─────────────────────────────────────────────────────────────
  async getMyExpenses(page = 0, size = 20) {
    const res: AxiosResponse<ApiResponse<any>> = await this.instance.get(`/api/expenses?page=${page}&size=${size}`)
    return res.data
  }

  async getHouseholdExpenses(page = 0, size = 20) {
    const res: AxiosResponse<ApiResponse<any>> = await this.instance.get(`/api/expenses/household?page=${page}&size=${size}`)
    return res.data
  }

  async createExpense(data: any) {
    const res: AxiosResponse<ApiResponse<any>> = await this.instance.post('/api/expenses', data)
    return res.data
  }

  async updateExpense(id: number, data: any) {
    const res: AxiosResponse<ApiResponse<any>> = await this.instance.put(`/api/expenses/${id}`, data)
    return res.data
  }

  async deleteExpense(id: number) {
    const res: AxiosResponse<ApiResponse<any>> = await this.instance.delete(`/api/expenses/${id}`)
    return res.data
  }

  async getExpenseSummary(year?: number, month?: number) {
    const params = new URLSearchParams()
    if (year) params.append('year', year.toString())
    if (month) params.append('month', month.toString())
    const res: AxiosResponse<ApiResponse<any>> = await this.instance.get(`/api/expenses/summary?${params}`)
    return res.data
  }

  // ─── Reimbursements ───────────────────────────────────────────────────────
  async getReimbursements(filter?: string, page = 0, size = 20) {
    const params = new URLSearchParams({ page: page.toString(), size: size.toString() })
    if (filter) params.append('filter', filter)
    const res: AxiosResponse<ApiResponse<any>> = await this.instance.get(`/api/reimbursements?${params}`)
    return res.data
  }

  async createReimbursement(data: any) {
    const res: AxiosResponse<ApiResponse<any>> = await this.instance.post('/api/reimbursements', data)
    return res.data
  }

  async approveReimbursement(id: number) {
    const res: AxiosResponse<ApiResponse<any>> = await this.instance.patch(`/api/reimbursements/${id}/approve`)
    return res.data
  }

  async settleReimbursement(id: number) {
    const res: AxiosResponse<ApiResponse<any>> = await this.instance.patch(`/api/reimbursements/${id}/settle`)
    return res.data
  }

  async rejectReimbursement(id: number) {
    const res: AxiosResponse<ApiResponse<any>> = await this.instance.patch(`/api/reimbursements/${id}/reject`)
    return res.data
  }

  async getReimbursementSummary() {
    const res: AxiosResponse<ApiResponse<any>> = await this.instance.get('/api/reimbursements/summary')
    return res.data
  }

  // ─── Vehicles ─────────────────────────────────────────────────────────────
  async getVehicles() {
    const res: AxiosResponse<ApiResponse<any>> = await this.instance.get('/api/vehicles')
    return res.data
  }

  async getVehicleDetail(id: number) {
    const res: AxiosResponse<ApiResponse<any>> = await this.instance.get(`/api/vehicles/${id}`)
    return res.data
  }

  async addVehicle(data: any) {
    const res: AxiosResponse<ApiResponse<any>> = await this.instance.post('/api/vehicles', data)
    return res.data
  }

  async addVehicleExpense(vehicleId: number, data: any) {
    const res: AxiosResponse<ApiResponse<any>> = await this.instance.post(`/api/vehicles/${vehicleId}/expenses`, data)
    return res.data
  }

  // ─── Budgets ──────────────────────────────────────────────────────────────
  async getMyBudgets(month?: number, year?: number) {
    const params = new URLSearchParams()
    if (month) params.append('month', month.toString())
    if (year) params.append('year', year.toString())
    const res: AxiosResponse<ApiResponse<any>> = await this.instance.get(`/api/budgets?${params}`)
    return res.data
  }

  async getHouseholdBudgets(month?: number, year?: number) {
    const params = new URLSearchParams()
    if (month) params.append('month', month.toString())
    if (year) params.append('year', year.toString())
    const res: AxiosResponse<ApiResponse<any>> = await this.instance.get(`/api/budgets/household?${params}`)
    return res.data
  }

  async createBudget(data: any) {
    const res: AxiosResponse<ApiResponse<any>> = await this.instance.post('/api/budgets', data)
    return res.data
  }

  // ─── Analytics ────────────────────────────────────────────────────────────
  async getHouseholdAnalytics() {
    const res: AxiosResponse<ApiResponse<any>> = await this.instance.get('/api/analytics/household')
    return res.data
  }

  async getPersonalAnalytics() {
    const res: AxiosResponse<ApiResponse<any>> = await this.instance.get('/api/analytics/personal')
    return res.data
  }

  // ─── AI ───────────────────────────────────────────────────────────────────
  async getAiInsights() {
    const res: AxiosResponse<ApiResponse<any>> = await this.instance.get('/api/ai/insights')
    return res.data
  }

  async getHealthScore() {
    const res: AxiosResponse<ApiResponse<any>> = await this.instance.get('/api/ai/health-score')
    return res.data
  }

  async getPredictions() {
    const res: AxiosResponse<ApiResponse<any>> = await this.instance.get('/api/ai/predictions')
    return res.data
  }

  async getInvestmentAdvice() {
    const res: AxiosResponse<ApiResponse<any>> = await this.instance.get('/api/ai/investments')
    return res.data
  }
}

export const api = new ApiClient()
export default api
