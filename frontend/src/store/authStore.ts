import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'
import api from '@/lib/api'

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: any) => Promise<void>
  logout: () => void
  updateUser: (data: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const res = await api.login(email, password)
          if (res.success) {
            const userData: User = res.data
            localStorage.setItem('mk_token', userData.token)
            localStorage.setItem('mk_refresh', userData.refreshToken)
            set({ user: userData, isAuthenticated: true })
          } else {
            throw new Error(res.message || 'Login failed')
          }
        } finally {
          set({ isLoading: false })
        }
      },

      register: async (data) => {
        set({ isLoading: true })
        try {
          const res = await api.register(data)
          if (res.success) {
            const userData: User = res.data
            localStorage.setItem('mk_token', userData.token)
            localStorage.setItem('mk_refresh', userData.refreshToken)
            set({ user: userData, isAuthenticated: true })
          } else {
            throw new Error(res.message || 'Registration failed')
          }
        } finally {
          set({ isLoading: false })
        }
      },

      logout: () => {
        localStorage.removeItem('mk_token')
        localStorage.removeItem('mk_refresh')
        set({ user: null, isAuthenticated: false })
      },

      updateUser: (data) => {
        const current = get().user
        if (current) set({ user: { ...current, ...data } })
      },
    }),
    {
      name: 'mk_auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
)
