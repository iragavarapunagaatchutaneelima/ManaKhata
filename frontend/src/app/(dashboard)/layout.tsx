'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut, Menu, Palette, Plus, RotateCcw, Sparkles, X } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { Avatar, Button, ConfirmHost, IconButton, Modal, PageSkeleton, cx, confirmAction } from '@/components/ui'
import { ThemePicker } from '@/components/ThemePicker'
import TransactionModal, { openAddExpense } from '@/components/TransactionModal'
import { ALL_NAV, NAV } from '@/components/nav'
import { useSession } from '@/store/session'
import { useHousehold, useLedger } from '@/store/ledger'
import { resetDemo } from '@/lib/backend'
import { ROLE_LABELS } from '@/lib/categories'

const MOBILE_TABS = [
  { href: '/dashboard', label: 'Home' },
  { href: '/expenses', label: 'Activity' },
  { href: '__add__', label: 'Add' },
  { href: '/splits', label: 'Split' },
  { href: '__more__', label: 'More' },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = (usePathname() || '/').replace(/(.)\/$/, '$1')
  const status = useSession((s) => s.status)
  const mode = useSession((s) => s.mode)
  const signOut = useSession((s) => s.signOut)
  const startDemo = useSession((s) => s.startDemo)
  const loading = useLedger((s) => s.loading)
  const error = useLedger((s) => s.error)
  const refresh = useLedger((s) => s.refresh)
  const { data, me, canSeeAnalytics } = useHousehold()
  // The drawer belongs to the page it was opened on, so navigating closes it.
  const [drawerPath, setDrawerPath] = useState<string | null>(null)
  const drawer = drawerPath === pathname
  const setDrawer = (open: boolean) => setDrawerPath(open ? pathname : null)
  const [themeOpen, setThemeOpen] = useState(false)
  useEffect(() => {
    if (status === 'signedOut') router.replace('/auth/login')
    if (status === 'onboarding') router.replace('/onboarding')
  }, [status, router])

  if (status !== 'ready') return <Splash />

  const visibleNav = NAV.map((g) => ({ ...g, items: g.items.filter((i) => !i.analytics || canSeeAnalytics) })).filter((g) => g.items.length)
  const title = ALL_NAV.find((n) => n.href === pathname)?.label ?? 'ManaKhata'

  async function handleSignOut() {
    if (mode === 'live' && !(await confirmAction({ title: 'Sign out?', body: 'You can sign back in any time.', confirmLabel: 'Sign out' }))) return
    await signOut()
    router.replace(mode === 'demo' ? '/' : '/auth/login')
  }

  async function handleResetDemo() {
    if (!(await confirmAction({ title: 'Reset the demo?', body: 'This restores the sample household and removes changes you made in this browser.', confirmLabel: 'Reset demo' }))) return
    resetDemo()
    startDemo(useSession.getState().userId ?? undefined)
  }

  const sidebar = (
    <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 pb-6" aria-label="Main">
      {visibleNav.map((group) => (
        <div key={group.label} className="mt-5">
          <div className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-[.08em] text-ink-3">{group.label}</div>
          {group.items.map((item) => {
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href}
                className={cx('group relative flex items-center gap-3 rounded-[10px] px-3 py-2 text-[14px] font-medium transition',
                  active ? 'bg-primary-soft text-primary' : 'text-ink-2 hover:bg-surface-2 hover:text-ink')}>
                {active && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-saffron" />}
                <item.icon size={18} strokeWidth={active ? 2.3 : 1.9} />
                {item.label}
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )

  const profileFooter = (
    <div className="border-t border-line p-3">
      <div className="flex items-center gap-3 rounded-[12px] p-2">
        <Avatar name={me?.full_name ?? '?'} size={36} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-ink">{me?.full_name}</div>
          <div className="truncate text-[12px] text-ink-3">{ROLE_LABELS[me?.role ?? ''] ?? ''} · {data?.household.name}</div>
        </div>
        <IconButton label={mode === 'demo' ? 'Leave demo' : 'Sign out'} onClick={handleSignOut}><LogOut size={17} /></IconButton>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-dvh bg-bg">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col border-r border-line bg-surface lg:flex">
        <div className="px-5 pt-5"><Link href="/dashboard"><Logo size={30} /></Link></div>
        {sidebar}
        {profileFooter}
      </aside>

      {/* Mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-overlay" onClick={() => setDrawer(false)} />
          <aside className="safe-top absolute inset-y-0 left-0 flex w-[82%] max-w-[300px] flex-col bg-surface shadow-[var(--shadow-lg)]">
            <div className="flex items-center justify-between px-5 pt-5"><Logo size={28} /><IconButton label="Close menu" onClick={() => setDrawer(false)}><X size={18} /></IconButton></div>
            {sidebar}
            {profileFooter}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {mode === 'demo' && (
          <div className="safe-top border-b border-saffron/30 bg-saffron-soft px-4 py-2 text-[13px] text-saffron-ink">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1">
              <span className="inline-flex items-center gap-1.5 font-semibold"><Sparkles size={14} /> Demo household</span>
              <span className="hidden sm:inline">You’re viewing as {me?.full_name}. Changes stay in this browser only.</span>
              <span className="ml-auto flex items-center gap-3 font-semibold">
                <Link href="/demo" className="underline-offset-2 hover:underline">Switch person</Link>
                <button onClick={handleResetDemo} className="inline-flex items-center gap-1 underline-offset-2 hover:underline"><RotateCcw size={12} />Reset</button>
                <Link href="/auth/register" className="underline-offset-2 hover:underline">Create your account →</Link>
              </span>
            </div>
          </div>
        )}

        <header className={cx('sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-surface/90 px-3 backdrop-blur sm:px-5', mode !== 'demo' && 'safe-top')}>
          <IconButton className="lg:hidden" label="Open menu" onClick={() => setDrawer(true)}><Menu size={20} /></IconButton>
          <div className="lg:hidden"><Logo size={24} withText={false} /></div>
          <h1 className="truncate font-display text-[16px] font-bold text-ink lg:text-[17px]">{title}</h1>
          <div className="ml-auto flex items-center gap-1">
            <Button size="sm" className="hidden sm:inline-flex" icon={<Plus size={16} />} onClick={() => openAddExpense()}>Add</Button>
            <IconButton label="Change theme" onClick={() => setThemeOpen(true)}><Palette size={18} /></IconButton>
            <Link href="/settings" aria-label="Settings" className="ml-1"><Avatar name={me?.full_name ?? '?'} size={30} /></Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-5 sm:px-6 lg:pb-10">
          {error && !data ? (
            <div className="card mx-auto mt-10 max-w-md p-6 text-center">
              <h2 className="font-display text-lg font-bold">Couldn’t load your household</h2>
              <p className="mt-1 text-sm text-ink-3">{error}</p>
              <Button className="mt-4" onClick={() => refresh()}>Try again</Button>
            </div>
          ) : loading || !data ? <PageSkeleton /> : children}
        </main>
      </div>

      {/* Phone bottom bar */}
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur lg:hidden" aria-label="Quick">
        <div className="mx-auto flex max-w-md items-end justify-around px-2">
          {MOBILE_TABS.map((t) => {
            if (t.href === '__add__') {
              return (
                <button key={t.href} onClick={() => openAddExpense()} aria-label="Add expense"
                  className="-mt-5 mb-1 flex h-14 w-14 items-center justify-center rounded-[18px] bg-primary text-on-primary shadow-[var(--shadow-lg)] ring-4 ring-bg">
                  <Plus size={26} />
                </button>
              )
            }
            const item = ALL_NAV.find((n) => n.href === t.href)
            const Icon = t.href === '__more__' ? Menu : item!.icon
            const active = pathname === t.href
            return (
              <button key={t.href} onClick={() => (t.href === '__more__' ? setDrawer(true) : router.push(t.href))}
                className={cx('flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold', active ? 'text-primary' : 'text-ink-3')}>
                <Icon size={21} strokeWidth={active ? 2.4 : 1.9} />
                {t.label}
              </button>
            )
          })}
        </div>
      </nav>

      <TransactionModal />
      <ConfirmHost />
      <Modal open={themeOpen} onClose={() => setThemeOpen(false)} title="Theme" description="Pick a look for ManaKhata. Saved on this device." wide>
        <ThemePicker onPicked={() => setThemeOpen(false)} />
      </Modal>
    </div>
  )
}

function Splash() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg">
      <div className="flex flex-col items-center gap-4">
        <Logo size={40} />
        <div className="h-1 w-32 overflow-hidden rounded-full bg-surface-3"><div className="h-full w-1/3 animate-[pulse_1s_ease-in-out_infinite] rounded-full bg-primary" /></div>
      </div>
    </div>
  )
}
