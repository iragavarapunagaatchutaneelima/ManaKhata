import { beforeEach, describe, expect, it } from 'vitest'
import { DemoBackend, resetDemo } from './backend'
import { DEMO_PEOPLE } from './demo-seed'
import { netBalances, walletBalance } from './finance'
import { today } from './money'

// The demo backend must enforce the same rules as the SQL functions in
// supabase/migrations, so the demo behaves like a real household.
const [ASHA, VIKRAM, MEERA, RAVI] = DEMO_PEOPLE.map((p) => p.id)

describe('demo backend rules', () => {
  beforeEach(() => resetDemo())

  it('hides other people’s private expenses', async () => {
    const asha = await new DemoBackend(ASHA).load()
    const meera = await new DemoBackend(MEERA).load()
    expect(asha.expenses.some((e) => e.visibility === 'PERSONAL' && e.paid_by === MEERA)).toBe(false)
    expect(meera.expenses.some((e) => e.visibility === 'PERSONAL' && e.paid_by === MEERA)).toBe(true)
  })

  it('blocks wallet overdrafts and records transfers', async () => {
    const ravi = new DemoBackend(RAVI)
    const before = walletBalance((await ravi.load()).wallet, RAVI)
    await expect(ravi.walletTransfer(ASHA, before + 1)).rejects.toThrow('Not enough balance')
    await ravi.walletTransfer(ASHA, 100, 'test')
    expect(walletBalance((await ravi.load()).wallet, RAVI)).toBe(before - 100)
  })

  it('only managers create chores and approve them, paying the reward', async () => {
    const ravi = new DemoBackend(RAVI)
    await expect(ravi.insert('chores', { title: 'x', assigned_to: RAVI, reward_amount: 10 })).rejects.toThrow()
    const vikram = new DemoBackend(VIKRAM)
    const chore = await vikram.insert('chores', { title: 'Sweep', assigned_to: RAVI, reward_amount: 50 })
    await ravi.setChoreStatus(chore.id, 'COMPLETED')
    await expect(ravi.setChoreStatus(chore.id, 'APPROVED')).rejects.toThrow()
    const raviBefore = walletBalance((await ravi.load()).wallet, RAVI)
    await vikram.setChoreStatus(chore.id, 'APPROVED')
    expect(walletBalance((await ravi.load()).wallet, RAVI)).toBe(raviBefore + 50)
  })

  it('settle-up clears a pair’s open splits', async () => {
    const asha = new DemoBackend(ASHA)
    const data = await asha.load()
    const owed = netBalances(data.splits).get(ASHA) ?? 0
    expect(owed).toBeLessThan(0) // Asha owes Meera for shared groceries this month
    await asha.settleUp(ASHA, MEERA)
    await asha.settleUp(MEERA, ASHA)
    const after = await asha.load()
    expect(after.splits.filter((s) => !s.settled_at && [s.owed_by, s.owed_to].includes(ASHA) && [s.owed_by, s.owed_to].includes(MEERA))).toHaveLength(0)
    expect(after.settlements.length).toBeGreaterThan(0)
  })

  it('paying a bill records the expense and moves the due date', async () => {
    const asha = new DemoBackend(ASHA)
    const bill = (await asha.load()).bills.find((b) => b.frequency === 'MONTHLY')!
    await asha.payBill(bill.id)
    const after = await asha.load()
    expect(after.expenses[0]).toMatchObject({ bill_id: bill.id, amount: bill.amount, expense_date: today() })
    expect(after.bills.find((b) => b.id === bill.id)!.next_due_date > bill.next_due_date).toBe(true)
  })

  it('students cannot approve reimbursements', async () => {
    const ravi = new DemoBackend(RAVI)
    const pending = (await ravi.load()).reimbursements.find((r) => r.status === 'PENDING')!
    await expect(ravi.decideReimbursement(pending.id, 'APPROVE')).rejects.toThrow('Only the household head or a parent')
  })
})
