// Data access for one household. Two implementations share one interface:
//   LiveBackend  – Supabase (real accounts; security enforced by RLS + SQL functions)
//   DemoBackend  – the sample family, kept in this browser's localStorage. It applies
//                  the same rules as the SQL functions so the demo behaves like the app.

import type {
  ChoreStatus, Collection, ID, LedgerData, Member, Role, RowOf, WalletKind, WalletTransaction,
} from './model'
import { TABLES, isManagerRole } from './model'
import { supabase } from './supabase'
import { buildDemoLedger, DEMO_HOUSEHOLD_ID } from './demo-seed'
import { addMonths, fromMinor, monthKey, parseISODate, toISODate, toMinor, today } from './money'
import { walletBalance } from './finance'

export type NewRow<C extends Collection> = Partial<RowOf<C>>

export interface MemberPatch { role?: Role; monthly_income?: number; can_view_analytics?: boolean; can_manage_expenses?: boolean }

export interface Backend {
  readonly mode: 'demo' | 'live'
  readonly userId: ID
  readonly householdId: ID
  load(): Promise<LedgerData>
  insert<C extends Collection>(c: C, row: NewRow<C>): Promise<RowOf<C>>
  insertMany<C extends Collection>(c: C, rows: NewRow<C>[]): Promise<RowOf<C>[]>
  update<C extends Collection>(c: C, id: ID, patch: NewRow<C>): Promise<RowOf<C>>
  remove(c: Collection, id: ID): Promise<void>
  walletTopUp(amount: number, note?: string): Promise<void>
  walletWithdraw(amount: number, note?: string): Promise<void>
  walletTransfer(to: ID, amount: number, note?: string): Promise<void>
  decideReimbursement(id: ID, action: 'APPROVE' | 'REJECT' | 'SETTLE'): Promise<void>
  setChoreStatus(id: ID, status: ChoreStatus): Promise<void>
  settleUp(debtor: ID, creditor: ID, note?: string): Promise<number>
  /** Clear all open splits between two people (both directions); records one net settlement. */
  settlePair(debtor: ID, creditor: ID, note?: string): Promise<number>
  payBill(id: ID, paidOn?: string): Promise<void>
  updateMember(userId: ID, patch: MemberPatch): Promise<void>
  removeMember(userId: ID): Promise<void>
  transferHeadship(userId: ID): Promise<void>
  regenerateInvite(): Promise<string>
  updateHousehold(patch: { name?: string; currency?: string }): Promise<void>
  updateProfile(patch: { full_name?: string; phone?: string | null }): Promise<void>
}

// ─────────────────────────────────────────────────────────────────────────────
// Live (Supabase)
// ─────────────────────────────────────────────────────────────────────────────

const PAGE = 1000

async function fetchAll<T>(table: string, householdId: ID, order: string): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase().from(table).select('*').eq('household_id', householdId)
      .order(order, { ascending: false }).range(from, from + PAGE - 1)
    if (error) throw error
    rows.push(...(data as T[]))
    if (!data || data.length < PAGE) return rows
  }
}

const ORDER: Partial<Record<Collection, string>> = {
  expenses: 'expense_date', incomes: 'income_date', trips: 'start_date', bills: 'next_due_date', vehicleExpenses: 'expense_date', tripExpenses: 'expense_date',
}

export class LiveBackend implements Backend {
  readonly mode = 'live' as const
  constructor(readonly userId: ID, readonly householdId: ID) {}

  private async rpc<T = unknown>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
    const { data, error } = await supabase().rpc(fn, args)
    if (error) throw error
    return data as T
  }

  async loadCollection<C extends Collection>(c: C): Promise<RowOf<C>[]> {
    if (c === 'chat') {
      const { data, error } = await supabase().from('chat_messages').select('*').eq('household_id', this.householdId)
        .order('created_at', { ascending: false }).limit(500)
      if (error) throw error
      return (data as RowOf<C>[]).reverse()
    }
    return fetchAll<RowOf<C>>(TABLES[c], this.householdId, ORDER[c] ?? 'created_at')
  }

  async loadMembers(): Promise<Member[]> {
    const { data: rows, error } = await supabase().from('household_members').select('*').eq('household_id', this.householdId)
    if (error) throw error
    const ids = (rows ?? []).map((r) => r.user_id)
    const { data: profiles, error: pErr } = await supabase().from('profiles').select('id, full_name, email').in('id', ids)
    if (pErr) throw pErr
    const byId = new Map((profiles ?? []).map((p) => [p.id, p]))
    return (rows ?? []).map((r) => ({ ...r, full_name: byId.get(r.user_id)?.full_name || 'Member', email: byId.get(r.user_id)?.email ?? null }))
      .sort((a, b) => a.joined_at.localeCompare(b.joined_at)) as Member[]
  }

  async load(): Promise<LedgerData> {
    const { data: household, error } = await supabase().from('households').select('*').eq('id', this.householdId).single()
    if (error) throw error
    const keys = Object.keys(TABLES) as Collection[]
    const [members, ...lists] = await Promise.all([this.loadMembers(), ...keys.map((k) => this.loadCollection(k))])
    const data = { household, members } as unknown as LedgerData
    keys.forEach((k, i) => { (data as unknown as Record<string, unknown>)[k] = lists[i] })
    return data
  }

  async insert<C extends Collection>(c: C, row: NewRow<C>): Promise<RowOf<C>> {
    const { data, error } = await supabase().from(TABLES[c]).insert({ ...row, household_id: this.householdId }).select().single()
    if (error) throw error
    return data as RowOf<C>
  }

  async insertMany<C extends Collection>(c: C, rows: NewRow<C>[]): Promise<RowOf<C>[]> {
    if (!rows.length) return []
    const { data, error } = await supabase().from(TABLES[c]).insert(rows.map((r) => ({ ...r, household_id: this.householdId }))).select()
    if (error) throw error
    return data as RowOf<C>[]
  }

  async update<C extends Collection>(c: C, id: ID, patch: NewRow<C>): Promise<RowOf<C>> {
    const { data, error } = await supabase().from(TABLES[c]).update(patch as never).eq('id', id).select().single()
    if (error) throw error
    return data as RowOf<C>
  }

  async remove(c: Collection, id: ID): Promise<void> {
    const { error, count } = await supabase().from(TABLES[c]).delete({ count: 'exact' }).eq('id', id)
    if (error) throw error
    if (count === 0) throw new Error("You don't have permission to delete this.")
  }

  walletTopUp(amount: number, note?: string) { return this.rpc<void>('wallet_top_up', { p_amount: amount, p_note: note ?? null }) }
  walletWithdraw(amount: number, note?: string) { return this.rpc<void>('wallet_withdraw', { p_amount: amount, p_note: note ?? null }) }
  walletTransfer(to: ID, amount: number, note?: string) { return this.rpc<void>('wallet_transfer', { p_to: to, p_amount: amount, p_note: note ?? null }) }
  decideReimbursement(id: ID, action: 'APPROVE' | 'REJECT' | 'SETTLE') { return this.rpc<void>('decide_reimbursement', { p_id: id, p_action: action }) }
  setChoreStatus(id: ID, status: ChoreStatus) { return this.rpc<void>('set_chore_status', { p_id: id, p_status: status }) }
  async settleUp(debtor: ID, creditor: ID, note?: string) { return Number(await this.rpc('settle_up', { p_debtor: debtor, p_creditor: creditor, p_note: note ?? null })) }
  async settlePair(debtor: ID, creditor: ID, note?: string) { return Number(await this.rpc('settle_pair', { p_debtor: debtor, p_creditor: creditor, p_note: note ?? null })) }
  async payBill(id: ID, paidOn?: string) { await this.rpc('pay_bill', { p_bill: id, p_paid_on: paidOn ?? today() }) }
  updateMember(userId: ID, p: MemberPatch) {
    return this.rpc<void>('update_member', {
      p_user: userId, p_role: p.role ?? null, p_monthly_income: p.monthly_income ?? null,
      p_can_view_analytics: p.can_view_analytics ?? null, p_can_manage_expenses: p.can_manage_expenses ?? null,
    })
  }
  removeMember(userId: ID) { return this.rpc<void>('remove_member', { p_user: userId }) }
  transferHeadship(userId: ID) { return this.rpc<void>('transfer_headship', { p_user: userId }) }
  regenerateInvite() { return this.rpc<string>('regenerate_invite_code') }
  async updateHousehold(patch: { name?: string; currency?: string }) {
    const { error, count } = await supabase().from('households').update(patch, { count: 'exact' }).eq('id', this.householdId)
    if (error) throw error
    if (count === 0) throw new Error('Only the household head or a parent can change household settings.')
  }
  async updateProfile(patch: { full_name?: string; phone?: string | null }) {
    const { error } = await supabase().from('profiles').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', this.userId)
    if (error) throw error
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Demo (browser storage)
// ─────────────────────────────────────────────────────────────────────────────

const DEMO_KEY = 'manakhata.demo.v4'

interface DemoState { month: string; data: LedgerData }

function readDemo(): LedgerData {
  try {
    const raw = localStorage.getItem(DEMO_KEY)
    if (raw) {
      const state = JSON.parse(raw) as DemoState
      // A new calendar month: rebuild so the demo always shows "this month".
      if (state.month === monthKey(new Date())) return state.data
    }
  } catch { /* storage blocked or corrupted: fall through */ }
  const data = buildDemoLedger()
  writeDemo(data)
  return data
}

function writeDemo(data: LedgerData) {
  try { localStorage.setItem(DEMO_KEY, JSON.stringify({ month: monthKey(new Date()), data } satisfies DemoState)) } catch { /* ignore quota/private mode */ }
}

export function resetDemo() {
  try { localStorage.removeItem(DEMO_KEY) } catch { /* ignore */ }
}

const uid = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`)

const fail = (msg: string): never => { throw new Error(msg) }

export class DemoBackend implements Backend {
  readonly mode = 'demo' as const
  readonly householdId = DEMO_HOUSEHOLD_ID
  private data: LedgerData

  constructor(readonly userId: ID) {
    this.data = readDemo()
  }

  /** Re-read shared state so changes from other tabs or instances are never lost. */
  private sync() { this.data = readDemo() }
  private me() { return this.data.members.find((m) => m.user_id === this.userId) }
  private isManager() { return isManagerRole(this.me()?.role) }
  private save() { writeDemo(this.data) }
  private list<C extends Collection>(c: C) { return this.data[c] as RowOf<C>[] }

  async load(): Promise<LedgerData> {
    this.data = readDemo()
    const visible = this.data.expenses.filter((e) => e.visibility === 'HOUSEHOLD' || e.paid_by === this.userId || e.created_by === this.userId)
    const ids = new Set(visible.map((e) => e.id))
    return structuredClone({ ...this.data, expenses: visible, splits: this.data.splits.filter((s) => ids.has(s.expense_id)) })
  }

  async insert<C extends Collection>(c: C, row: NewRow<C>): Promise<RowOf<C>> { this.sync();
    const [created] = await this.insertMany(c, [row])
    return created
  }

  async insertMany<C extends Collection>(c: C, rows: NewRow<C>[]): Promise<RowOf<C>[]> { this.sync();
    if (c === 'chores' && !this.isManager()) fail("You don't have permission to do that.")
    if (c === 'wallet' || c === 'settlements') fail("You don't have permission to do that.")
    const now = new Date().toISOString()
    const created = rows.map((r) => ({
      id: uid(), household_id: this.householdId, created_at: now, created_by: this.userId,
      ...(c === 'chat' ? { sender_id: this.userId } : {}),
      // Mirror the database's `default auth.uid()` columns.
      ...(c === 'contributions' ? { user_id: this.userId } : {}),
      ...(c === 'taxDocs' ? { owner_id: this.userId } : {}),
      ...(c === 'tripExpenses' ? { paid_by: this.userId } : {}),
      ...(c === 'reimbursements' ? { requested_by: this.userId, status: 'PENDING', decided_by: null, decided_at: null, settled_at: null } : {}),
      ...(c === 'chores' ? { status: 'PENDING', completed_at: null, decided_at: null } : {}),
      ...r,
    })) as unknown as RowOf<C>[]
    if (c === 'budgets') {
      for (const b of created as RowOf<'budgets'>[]) {
        if (this.data.budgets.some((x) => x.category === b.category && x.user_id === (b.user_id ?? null))) fail('A budget for this category already exists.')
      }
    }
    this.list(c).unshift(...created)
    this.save()
    return structuredClone(created)
  }

  async update<C extends Collection>(c: C, id: ID, patch: NewRow<C>): Promise<RowOf<C>> { this.sync();
    const rows = this.list(c) as (RowOf<C> & { id: ID })[]
    const i = rows.findIndex((r) => r.id === id)
    if (i < 0) fail('Not found')
    rows[i] = { ...rows[i], ...patch }
    this.save()
    return structuredClone(rows[i])
  }

  async remove(c: Collection, id: ID): Promise<void> { this.sync();
    const rows = this.list(c) as { id: ID }[]
    const i = rows.findIndex((r) => r.id === id)
    if (i < 0) return
    rows.splice(i, 1)
    // Cascade like the database does.
    if (c === 'expenses') this.data.splits = this.data.splits.filter((s) => s.expense_id !== id)
    if (c === 'goals') this.data.contributions = this.data.contributions.filter((x) => x.goal_id !== id)
    if (c === 'groceryLists') this.data.groceryItems = this.data.groceryItems.filter((x) => x.list_id !== id)
    if (c === 'vehicles') this.data.vehicleExpenses = this.data.vehicleExpenses.filter((x) => x.vehicle_id !== id)
    if (c === 'trips') this.data.tripExpenses = this.data.tripExpenses.filter((x) => x.trip_id !== id)
    this.save()
  }

  private walletTx(from: ID | null, to: ID | null, amount: number, kind: WalletKind, note?: string) {
    const t: WalletTransaction = { id: uid(), household_id: this.householdId, from_user: from, to_user: to, amount: fromMinor(toMinor(amount)), kind, note: note ?? null, created_by: this.userId, created_at: new Date().toISOString() }
    this.data.wallet.unshift(t)
  }

  private requirePositive(amount: number) { if (!(amount > 0)) fail('Amount must be positive') }
  private requireBalance(amount: number) { if (walletBalance(this.data.wallet, this.userId) < amount) fail('Not enough balance in your wallet') }

  async walletTopUp(amount: number, note?: string) { this.sync(); this.requirePositive(amount); this.walletTx(null, this.userId, amount, 'TOP_UP', note); this.save() }
  async walletWithdraw(amount: number, note?: string) { this.sync(); this.requirePositive(amount); this.requireBalance(amount); this.walletTx(this.userId, null, amount, 'WITHDRAWAL', note); this.save() }
  async walletTransfer(to: ID, amount: number, note?: string) { this.sync();
    if (to === this.userId || !this.data.members.some((m) => m.user_id === to)) fail('Pick another member of your household')
    this.requirePositive(amount); this.requireBalance(amount)
    this.walletTx(this.userId, to, amount, this.isManager() ? 'ALLOCATION' : 'TRANSFER', note); this.save()
  }

  async decideReimbursement(id: ID, action: 'APPROVE' | 'REJECT' | 'SETTLE') { this.sync();
    const r = this.data.reimbursements.find((x) => x.id === id)
    if (!r || !this.isManager()) fail('Only the household head or a parent can do this')
    const now = new Date().toISOString()
    if (action === 'APPROVE' && r!.status === 'PENDING') Object.assign(r!, { status: 'APPROVED', decided_by: this.userId, decided_at: now })
    else if (action === 'REJECT' && r!.status === 'PENDING') Object.assign(r!, { status: 'REJECTED', decided_by: this.userId, decided_at: now })
    else if (action === 'SETTLE' && r!.status === 'APPROVED') Object.assign(r!, { status: 'SETTLED', settled_at: now })
    else fail(`Cannot ${action.toLowerCase()} a ${r!.status.toLowerCase()} request`)
    this.save()
  }

  async setChoreStatus(id: ID, status: ChoreStatus) { this.sync();
    const c = this.data.chores.find((x) => x.id === id)
    if (!c) return fail('Chore not found')
    const now = new Date().toISOString()
    if (status === 'COMPLETED') {
      if (c.assigned_to !== this.userId && !this.isManager()) fail('Only the assignee can mark this done')
      if (c.status !== 'PENDING' && c.status !== 'REJECTED') fail(`Chore is already ${c.status.toLowerCase()}`)
      Object.assign(c, { status, completed_at: now })
    } else if (status === 'APPROVED' || status === 'REJECTED') {
      if (!this.isManager()) fail('Only the household head or a parent can review chores')
      if (c.status !== 'COMPLETED') fail('Chore has not been marked done yet')
      if (status === 'APPROVED' && c.reward_amount > 0) {
        if (walletBalance(this.data.wallet, this.userId) < c.reward_amount) fail(`Top up your wallet to pay this reward (₹${c.reward_amount})`)
        this.walletTx(this.userId, c.assigned_to, c.reward_amount, 'CHORE_REWARD', `Chore: ${c.title}`)
      }
      Object.assign(c, { status, decided_at: now })
    } else {
      if (!this.isManager()) fail('Not allowed')
      if (c.status !== 'APPROVED') Object.assign(c, { status: 'PENDING', completed_at: null, decided_at: null })
    }
    this.save()
  }

  async settleUp(debtor: ID, creditor: ID, note?: string) { this.sync();
    if (this.userId !== debtor && this.userId !== creditor && !this.isManager()) fail('Only the people involved can settle this')
    const open = this.data.splits.filter((s) => s.owed_by === debtor && s.owed_to === creditor && !s.settled_at)
    const total = fromMinor(open.reduce((t, s) => t + toMinor(s.amount), 0))
    if (total <= 0) return 0
    const now = new Date().toISOString()
    open.forEach((s) => { s.settled_at = now })
    this.data.settlements.unshift({ id: uid(), household_id: this.householdId, from_user: debtor, to_user: creditor, amount: total, note: note ?? null, created_by: this.userId, created_at: now })
    this.save()
    return total
  }

  async settlePair(debtor: ID, creditor: ID, note?: string) { this.sync();
    if (this.userId !== debtor && this.userId !== creditor && !this.isManager()) fail('Only the people involved can settle this')
    const between = this.data.splits.filter((s) => !s.settled_at &&
      ((s.owed_by === debtor && s.owed_to === creditor) || (s.owed_by === creditor && s.owed_to === debtor)))
    if (!between.length) return 0
    const net = between.reduce((t, s) => t + (s.owed_by === debtor ? toMinor(s.amount) : -toMinor(s.amount)), 0)
    const now = new Date().toISOString()
    between.forEach((s) => { s.settled_at = now })
    if (net !== 0) {
      this.data.settlements.unshift({
        id: uid(), household_id: this.householdId, from_user: net > 0 ? debtor : creditor, to_user: net > 0 ? creditor : debtor,
        amount: fromMinor(Math.abs(net)), note: note ?? null, created_by: this.userId, created_at: now,
      })
    }
    this.save()
    return fromMinor(Math.abs(net))
  }

  async payBill(id: ID, paidOn = today()) { this.sync();
    const b = this.data.bills.find((x) => x.id === id)
    if (!b) return fail('Bill not found')
    this.data.expenses.unshift({
      id: uid(), household_id: this.householdId, paid_by: this.userId, created_by: this.userId, amount: b.amount, description: b.name,
      category: b.category, visibility: 'HOUSEHOLD', expense_date: paidOn, payment_method: 'BANK', is_reimbursable: false, notes: null, bill_id: b.id,
      created_at: new Date().toISOString(),
    })
    const due = parseISODate(b.next_due_date)
    const months = { WEEKLY: 0, MONTHLY: 1, QUARTERLY: 3, YEARLY: 12 }[b.frequency]
    b.next_due_date = b.frequency === 'WEEKLY'
      ? toISODate(new Date(due.getFullYear(), due.getMonth(), due.getDate() + 7))
      : `${addMonths(monthKey(b.next_due_date), months)}-${String(Math.min(due.getDate(), 28)).padStart(2, '0')}`
    this.save()
  }

  async updateMember(userId: ID, p: MemberPatch) { this.sync();
    const m = this.data.members.find((x) => x.user_id === userId)
    if (!m) return fail('Member not found')
    if (userId !== this.userId && !this.isManager()) fail('Not allowed')
    if ((p.role || p.can_view_analytics !== undefined || p.can_manage_expenses !== undefined) && !this.isManager()) fail('Only the household head or a parent can change roles and permissions')
    if (p.role && (p.role === 'HOUSEHEAD' || m.role === 'HOUSEHEAD')) fail('The household head role cannot be changed here')
    Object.assign(m, Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined)))
    this.save()
  }

  async removeMember(): Promise<void> { fail('Members cannot be removed in the demo household.') }
  async transferHeadship(): Promise<void> { fail('Handing over the head role is disabled in the demo.') }
  async regenerateInvite() { if (!this.isManager()) fail('Only the household head or a parent can do this'); return 'DEMO2026' }
  async updateHousehold(patch: { name?: string; currency?: string }) { this.sync();
    if (!this.isManager()) fail('Only the household head or a parent can change household settings.')
    Object.assign(this.data.household, patch); this.save()
  }
  async updateProfile(patch: { full_name?: string; phone?: string | null }) { this.sync();
    const m = this.data.members.find((x) => x.user_id === this.userId)
    if (m && patch.full_name) m.full_name = patch.full_name
    this.save()
  }
}
