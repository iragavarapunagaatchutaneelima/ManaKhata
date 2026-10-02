'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Download, FileJson, LogOut, Monitor, Moon, RotateCcw, Sun, Trash2 } from 'lucide-react'
import { Button, Card, CardHeader, Field, Modal, PageHeader, Segmented, confirmAction } from '@/components/ui'
import { useHousehold } from '@/store/ledger'
import { useSession } from '@/store/session'
import { resetDemo } from '@/lib/backend'
import { saveFile } from '@/lib/download'
import { toCSV } from '@/lib/finance'
import { category } from '@/lib/categories'
import { REPO_URL } from '@/lib/config'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const router = useRouter()
  const { data, me, mode, mutate, memberName } = useHousehold()
  const email = useSession((s) => s.email)
  const signOut = useSession((s) => s.signOut)
  const updatePassword = useSession((s) => s.updatePassword)
  const startDemo = useSession((s) => s.startDemo)
  const userId = useSession((s) => s.userId)
  const { theme, setTheme } = useTheme()
  const [name, setName] = useState(me?.full_name ?? '')
  const [password, setPassword] = useState('')
  const [pwBusy, setPwBusy] = useState(false)
  const [deleting, setDeleting] = useState(false)

  if (!data || !me) return null

  function exportJSON() {
    saveFile(`kinfold-export-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ exportedAt: new Date().toISOString(), ...data }, null, 2), 'application/json')
  }
  function exportCSV() {
    const csv = toCSV(data!.expenses.map((e) => ({ Date: e.expense_date, Description: e.description, Category: category(e.category).label, Amount: e.amount, PaidBy: memberName(e.paid_by), Visibility: e.visibility, Notes: e.notes ?? '' })))
    saveFile('kinfold-expenses.csv', csv)
  }

  async function changePassword() {
    if (password.length < 8) return toast.error('Use at least 8 characters.')
    setPwBusy(true)
    try { await updatePassword(password); setPassword(''); toast.success('Password updated') } catch (e) { toast.error((e as Error).message) } finally { setPwBusy(false) }
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Settings" subtitle={email ?? undefined} />

      <Card className="mb-5">
        <CardHeader title="Profile" />
        <div className="grid gap-4 px-5 pb-5 sm:grid-cols-2">
          <Field label="Full name">
            <div className="flex gap-2">
              <input className="field" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
              <Button variant="secondary" disabled={!name.trim() || name.trim() === me.full_name} onClick={() => mutate((b) => b.updateProfile({ full_name: name.trim() }), 'Name updated')}>Save</Button>
            </div>
          </Field>
          <Field label="Email"><input className="field" value={email ?? ''} disabled /></Field>
        </div>
      </Card>

      <Card className="mb-5">
        <CardHeader title="Appearance" subtitle="Kinfold follows your device by default." />
        <div className="px-5 pb-5">
          <Segmented value={(theme as 'system' | 'light' | 'dark') ?? 'system'} onChange={setTheme} options={[
            { value: 'system', label: <span className="inline-flex items-center gap-1.5"><Monitor size={14} />System</span> },
            { value: 'light', label: <span className="inline-flex items-center gap-1.5"><Sun size={14} />Light</span> },
            { value: 'dark', label: <span className="inline-flex items-center gap-1.5"><Moon size={14} />Dark</span> },
          ]} />
        </div>
      </Card>

      {mode === 'live' && (
        <Card className="mb-5">
          <CardHeader title="Password" />
          <div className="flex flex-wrap gap-2 px-5 pb-5">
            <input className="field max-w-xs" type="password" autoComplete="new-password" placeholder="New password (8+ characters)" value={password} onChange={(e) => setPassword(e.target.value)} />
            <Button variant="secondary" loading={pwBusy} onClick={changePassword}>Update password</Button>
          </div>
        </Card>
      )}

      <Card className="mb-5">
        <CardHeader title="Your data" subtitle="Download everything you can see in this household, at any time." />
        <div className="flex flex-wrap gap-2 px-5 pb-5">
          <Button variant="secondary" icon={<Download size={16} />} onClick={exportCSV}>Expenses (CSV)</Button>
          <Button variant="secondary" icon={<FileJson size={16} />} onClick={exportJSON}>Everything (JSON)</Button>
        </div>
      </Card>

      {mode === 'demo' && (
        <Card className="mb-5">
          <CardHeader title="Demo household" subtitle="You are exploring sample data stored only in this browser." />
          <div className="flex flex-wrap gap-2 px-5 pb-5">
            <Link href="/demo"><Button variant="secondary">Switch person</Button></Link>
            <Button variant="secondary" icon={<RotateCcw size={16} />} onClick={async () => {
              if (await confirmAction({ title: 'Reset the demo?', body: 'Restores the original sample data.', confirmLabel: 'Reset' })) { resetDemo(); startDemo(userId ?? undefined); toast.success('Demo reset') }
            }}>Reset demo data</Button>
            <Link href="/auth/register"><Button>Create a real account</Button></Link>
          </div>
        </Card>
      )}

      <Card className="mb-5">
        <CardHeader title="About" />
        <ul className="divide-y divide-line text-sm">
          <li><Link href="/terms" className="block px-5 py-3 hover:bg-surface-2">Terms of Service</Link></li>
          <li><Link href="/privacy" className="block px-5 py-3 hover:bg-surface-2">Privacy Policy</Link></li>
          <li><a href={`${REPO_URL}/blob/main/LICENSE`} className="block px-5 py-3 hover:bg-surface-2">Open-source licence (MIT)</a></li>
          <li className="px-5 py-3 text-ink-3">Kinfold v2.0 · {mode === 'demo' ? 'demo mode' : 'cloud sync on'}</li>
        </ul>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" icon={<LogOut size={16} />} onClick={async () => { await signOut(); router.replace(mode === 'demo' ? '/' : '/auth/login') }}>{mode === 'demo' ? 'Leave demo' : 'Sign out'}</Button>
        {mode === 'live' && <Button variant="ghost" className="text-negative" icon={<Trash2 size={16} />} onClick={() => setDeleting(true)}>Delete account</Button>}
      </div>

      <DeleteAccount open={deleting} onClose={() => setDeleting(false)} />
    </div>
  )
}

function DeleteAccount({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const deleteAccount = useSession((s) => s.deleteAccount)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)

  async function run() {
    setBusy(true)
    try {
      await deleteAccount()
      toast.success('Your account has been deleted')
      router.replace('/')
    } catch (e) {
      toast.error((e as Error).message)
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Delete your account permanently?"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button variant="danger" loading={busy} disabled={text !== 'DELETE'} onClick={run}>Delete forever</Button></>}>
      <div className="space-y-3 text-sm text-ink-2">
        <p>This deletes your login and profile and removes you from your household. If you are the household head, the role passes to another adult; if you are the only member, the whole household and its data are deleted.</p>
        <p>Shared entries you created remain visible to the rest of your family without your name. This cannot be undone — download your data first if you need it.</p>
        <Field label="Type DELETE to confirm"><input className="field" value={text} onChange={(e) => setText(e.target.value)} /></Field>
      </div>
    </Modal>
  )
}
