'use client'

import { create } from 'zustand'
import { useMemo } from 'react'
import toast from 'react-hot-toast'
import type { Backend } from '@/lib/backend'
import { LiveBackend } from '@/lib/backend'
import type { Collection, ID, LedgerData, Member } from '@/lib/model'
import { TABLES, isManagerRole } from '@/lib/model'
import { friendlyError, supabase } from '@/lib/supabase'
import { useSession } from './session'

interface LedgerState {
  data: LedgerData | null
  loading: boolean
  error: string | null
  backend: Backend | null
  attach(backend: Backend | null): Promise<void>
  refresh(): Promise<void>
  /**
   * Run a change, then reload. Errors become a toast and the promise resolves to
   * undefined, so screens can simply `await mutate(...)`.
   */
  mutate<T>(fn: (b: Backend) => Promise<T>, success?: string): Promise<T | undefined>
}

let channel: ReturnType<ReturnType<typeof supabase>['channel']> | null = null
let refreshTimer: ReturnType<typeof setTimeout> | null = null

export const useLedger = create<LedgerState>((set, get) => ({
  data: null,
  loading: false,
  error: null,
  backend: null,

  async attach(backend) {
    if (channel) { supabase().removeChannel(channel); channel = null }
    set({ backend, data: null, error: null })
    if (!backend) return
    await get().refresh()

    // Live households: reload when any family member changes something.
    if (backend instanceof LiveBackend) {
      const hid = backend.householdId
      const scheduleRefresh = () => {
        if (refreshTimer) clearTimeout(refreshTimer)
        refreshTimer = setTimeout(() => { get().refresh() }, 400)
      }
      channel = supabase().channel(`household:${hid}`)
      for (const table of [...new Set(Object.values(TABLES)), 'household_members']) {
        channel.on('postgres_changes', { event: '*', schema: 'public', table, filter: `household_id=eq.${hid}` }, scheduleRefresh)
      }
      channel.subscribe()
    }
  },

  async refresh() {
    const backend = get().backend
    if (!backend) return
    set({ loading: get().data === null })
    try {
      const data = await backend.load()
      if (get().backend === backend) set({ data, loading: false, error: null })
    } catch (err) {
      set({ loading: false, error: friendlyError(err) })
    }
  },

  async mutate(fn, success) {
    const backend = get().backend
    if (!backend) return undefined
    try {
      const result = await fn(backend)
      await get().refresh()
      if (success) toast.success(success)
      return result
    } catch (err) {
      toast.error(friendlyError(err))
      return undefined
    }
  },
}))

/** Convenience view over the loaded ledger for the signed-in person. */
export function useHousehold() {
  const data = useLedger((s) => s.data)
  const mutate = useLedger((s) => s.mutate)
  const userId = useSession((s) => s.userId)
  const mode = useSession((s) => s.mode)

  return useMemo(() => {
    const members = data?.members ?? []
    const byId = new Map(members.map((m) => [m.user_id, m]))
    const me = userId ? byId.get(userId) : undefined
    return {
      data,
      mutate,
      mode,
      userId: userId ?? '',
      me,
      members,
      currency: data?.household.currency ?? 'INR',
      isManager: isManagerRole(me?.role),
      isHead: me?.role === 'HOUSEHEAD',
      canSeeAnalytics: !!me && (isManagerRole(me.role) || me.can_view_analytics),
      memberName: (id: ID | null | undefined) => (id ? byId.get(id)?.full_name ?? 'Former member' : '—'),
      firstName: (id: ID | null | undefined) => (id ? (byId.get(id)?.full_name ?? 'Former member').split(' ')[0] : '—'),
      member: (id: ID | null | undefined): Member | undefined => (id ? byId.get(id) : undefined),
    }
  }, [data, mutate, mode, userId])
}

export type { Collection }
