'use client'

import { create } from 'zustand'
import type { Backend } from '@/lib/backend'
import { DemoBackend, LiveBackend, resetDemo } from '@/lib/backend'
import { DEMO_PEOPLE } from '@/lib/demo-seed'
import { SITE_URL } from '@/lib/config'
import { friendlyError, supabase } from '@/lib/supabase'
import type { Role } from '@/lib/model'

export type SessionStatus = 'loading' | 'signedOut' | 'onboarding' | 'ready'

const MODE_KEY = 'kinfold.mode'
const PERSONA_KEY = 'kinfold.demo.persona'

interface SessionState {
  status: SessionStatus
  mode: 'demo' | 'live' | null
  userId: string | null
  email: string | null
  fullName: string
  backend: Backend | null
  /** True after a password-reset link signs the user in. */
  recovering: boolean
  init(): Promise<void>
  startDemo(personaId?: string): void
  signIn(email: string, password: string): Promise<void>
  signUp(fullName: string, email: string, password: string): Promise<{ needsConfirmation: boolean }>
  signOut(): Promise<void>
  sendPasswordReset(email: string): Promise<void>
  updatePassword(password: string): Promise<void>
  createHousehold(name: string, currency: string, monthlyIncome: number): Promise<void>
  joinHousehold(code: string, role: Exclude<Role, 'HOUSEHEAD'>, monthlyIncome: number): Promise<void>
  deleteAccount(): Promise<void>
}

const storage = {
  get: (k: string) => { try { return localStorage.getItem(k) } catch { return null } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v) } catch { /* ignore */ } },
  del: (k: string) => { try { localStorage.removeItem(k) } catch { /* ignore */ } },
}

let authListener = false

export const useSession = create<SessionState>((set, get) => {
  async function resolveLive(userId: string, email: string | null, metaName?: string) {
    const [{ data: membership, error }, { data: profile }] = await Promise.all([
      supabase().from('household_members').select('household_id').eq('user_id', userId).maybeSingle(),
      supabase().from('profiles').select('full_name').eq('id', userId).maybeSingle(),
    ])
    if (error) throw error
    const fullName = profile?.full_name || metaName || email?.split('@')[0] || ''
    if (!membership) {
      set({ status: 'onboarding', mode: 'live', userId, email, fullName, backend: null })
      return
    }
    set({ status: 'ready', mode: 'live', userId, email, fullName, backend: new LiveBackend(userId, membership.household_id) })
  }

  return {
    status: 'loading',
    mode: null,
    userId: null,
    email: null,
    fullName: '',
    backend: null,
    recovering: false,

    async init() {
      if (storage.get(MODE_KEY) === 'demo') {
        const persona = DEMO_PEOPLE.find((p) => p.id === storage.get(PERSONA_KEY)) ?? DEMO_PEOPLE[0]
        set({ status: 'ready', mode: 'demo', userId: persona.id, email: persona.email, fullName: persona.name, backend: new DemoBackend(persona.id) })
        return
      }
      if (!authListener) {
        authListener = true
        supabase().auth.onAuthStateChange((event, session) => {
          if (get().mode === 'demo') return
          if (event === 'PASSWORD_RECOVERY') set({ recovering: true })
          if (event === 'SIGNED_OUT') set({ status: 'signedOut', mode: null, userId: null, email: null, backend: null })
          if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user && get().userId !== session.user.id) {
            resolveLive(session.user.id, session.user.email ?? null, session.user.user_metadata?.full_name).catch(() => set({ status: 'signedOut' }))
          }
        })
      }
      const { data } = await supabase().auth.getSession()
      const user = data.session?.user
      if (!user) { set({ status: 'signedOut', mode: null }); return }
      try {
        await resolveLive(user.id, user.email ?? null, user.user_metadata?.full_name)
      } catch {
        set({ status: 'signedOut', mode: null })
      }
    },

    startDemo(personaId) {
      const persona = DEMO_PEOPLE.find((p) => p.id === personaId) ?? DEMO_PEOPLE[0]
      storage.set(MODE_KEY, 'demo')
      storage.set(PERSONA_KEY, persona.id)
      set({ status: 'ready', mode: 'demo', userId: persona.id, email: persona.email, fullName: persona.name, backend: new DemoBackend(persona.id) })
    },

    async signIn(email, password) {
      storage.del(MODE_KEY)
      const { data, error } = await supabase().auth.signInWithPassword({ email: email.trim(), password })
      if (error) throw new Error(friendlyError(error))
      await resolveLive(data.user.id, data.user.email ?? null, data.user.user_metadata?.full_name)
    },

    async signUp(fullName, email, password) {
      storage.del(MODE_KEY)
      const { data, error } = await supabase().auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim() }, emailRedirectTo: `${SITE_URL}/auth/callback` },
      })
      if (error) throw new Error(friendlyError(error))
      if (!data.session) return { needsConfirmation: true }
      await resolveLive(data.user!.id, data.user!.email ?? null, fullName)
      return { needsConfirmation: false }
    },

    async signOut() {
      if (get().mode === 'demo') {
        storage.del(MODE_KEY)
        storage.del(PERSONA_KEY)
      } else {
        await supabase().auth.signOut()
      }
      set({ status: 'signedOut', mode: null, userId: null, email: null, fullName: '', backend: null })
    },

    async sendPasswordReset(email) {
      const { error } = await supabase().auth.resetPasswordForEmail(email.trim(), { redirectTo: `${SITE_URL}/auth/reset` })
      if (error) throw new Error(friendlyError(error))
    },

    async updatePassword(password) {
      const { error } = await supabase().auth.updateUser({ password })
      if (error) throw new Error(friendlyError(error))
      set({ recovering: false })
    },

    async createHousehold(name, currency, monthlyIncome) {
      const { error } = await supabase().rpc('create_household', { p_name: name, p_currency: currency, p_monthly_income: monthlyIncome })
      if (error) throw new Error(friendlyError(error))
      const { userId, email, fullName } = get()
      await resolveLive(userId!, email, fullName)
    },

    async joinHousehold(code, role, monthlyIncome) {
      const { error } = await supabase().rpc('join_household', { p_code: code, p_role: role, p_monthly_income: monthlyIncome })
      if (error) throw new Error(friendlyError(error))
      const { userId, email, fullName } = get()
      await resolveLive(userId!, email, fullName)
    },

    async deleteAccount() {
      if (get().mode === 'demo') {
        resetDemo()
        await get().signOut()
        return
      }
      const { error } = await supabase().rpc('delete_my_account')
      if (error) throw new Error(friendlyError(error))
      await supabase().auth.signOut({ scope: 'local' })
      set({ status: 'signedOut', mode: null, userId: null, email: null, fullName: '', backend: null })
    },
  }
})
