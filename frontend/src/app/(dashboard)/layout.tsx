'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Home, Receipt, RefreshCcw, Wallet, Car,
  PiggyBank, Brain, BarChart3, Plane, MessageSquare, Settings,
  ChevronLeft, ChevronRight, Bell, Sun, Moon, Menu, X, LogOut, User,
  ShoppingCart, SplitSquareVertical, Bot, Target, CheckSquare, Briefcase, HeartPulse,
  Award, FileText
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { getRoleBadge } from '@/hooks/useUtils'
import { useWebSocket } from '@/hooks/useWebSocket'
import FloatingCalculator from '@/components/ui/FloatingCalculator'
import toast from 'react-hot-toast'
import { useTheme } from 'next-themes'
import StatementDownloader from '@/components/StatementDownloader'

const navItems = [
  { href: '/dashboard',       icon: LayoutDashboard, label: 'Dashboard',      group: 'main' },
  { href: '/household',       icon: Home,            label: 'Household',      group: 'main' },
  { href: '/grocery',         icon: ShoppingCart,    label: 'Groceries',      group: 'main' },
  { href: '/chores',          icon: CheckSquare,     label: 'Chores',         group: 'main' },
  { href: '/expenses',        icon: Receipt,         label: 'Expenses',       group: 'finance' },
  { href: '/reimbursements',  icon: RefreshCcw,      label: 'Reimburse',      group: 'finance' },
  { href: '/splits',          icon: SplitSquareVertical, label: 'Split IOUs', group: 'finance' },
  { href: '/wallet',          icon: Wallet,          label: 'Wallet',         group: 'finance' },
  { href: '/budget',          icon: PiggyBank,       label: 'Budget',         group: 'finance' },
  { href: '/goals',           icon: Target,          label: 'Savings Goals',  group: 'finance' },
  { href: '/investments',     icon: Briefcase,       label: 'Investments',    group: 'finance' },
  { href: '/medical',         icon: HeartPulse,      label: 'Medical Vault',  group: 'finance' },
  { href: '/tax',             icon: FileText,        label: 'Tax Assistant',  group: 'finance' },
  { href: '/vehicles',        icon: Car,             label: 'Vehicles',       group: 'assets' },
  { href: '/trips',           icon: Plane,           label: 'Trips',          group: 'assets' },
  { href: '/ai-advisor',      icon: Brain,           label: 'AI Advisor',     group: 'intelligence' },
  { href: '/analytics',       icon: BarChart3,       label: 'Analytics',      group: 'intelligence' },
  { href: '/chat',            icon: MessageSquare,   label: 'Family Chat',    group: 'social' },
  { href: '/achievements',    icon: Award,           label: 'Achievements',   group: 'social' },
  { href: '/integrations',    icon: Bot,             label: 'Integrations',   group: 'account' },
  { href: '/settings',        icon: Settings,        label: 'Settings',       group: 'account' },
]

const groupLabels: Record<string, string> = {
  main: 'Overview',
  finance: 'Finance',
  assets: 'Assets',
  intelligence: 'Intelligence',
  social: 'Social',
  account: 'Account',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { theme, setTheme, systemTheme } = useTheme()
  const [notifications, setNotifications] = useState(3)
  const [mounted, setMounted] = useState(false)
  
  // Initialize Real-time WebSocket connection
  useWebSocket()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isAuthenticated || !user) router.replace('/auth/login')
  }, [isAuthenticated, user, router])

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    router.replace('/auth/login')
  }

  if (!user) return null

  const badge = getRoleBadge(user.role)
  const groups = [...new Set(navItems.map(n => n.group))]

  const SidebarContent = ({ mobile = false }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 p-4 mb-2 ${collapsed && !mobile ? 'justify-center' : ''}`}>
        <div className="premium-logo w-9 h-9 min-w-[36px] rounded-xl flex items-center justify-center font-bold text-lg text-white">
          M
        </div>
        {(!collapsed || mobile) && (
          <div>
            <div className="font-display font-bold text-[15px]" style={{ color: 'var(--text-primary)' }}>ManaKhata</div>
            <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Our Household Account</div>
          </div>
        )}
      </div>

      {/* Nav Groups */}
      <nav className="flex-1 overflow-y-auto px-2 space-y-0.5">
        {groups.map(group => {
          const items = navItems.filter(n => n.group === group)
          return (
            <div key={group}>
              {(!collapsed || mobile) && (
                <div className="px-3 py-2 mt-3 mb-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                  {groupLabels[group]}
                </div>
              )}
              {collapsed && !mobile && <div className="my-3 h-px mx-3" style={{ background: 'var(--border-color)' }} />}
              {items.map(item => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    id={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                    onClick={() => setMobileOpen(false)}
                    className={`sidebar-item ${isActive ? 'active' : ''} ${collapsed && !mobile ? 'justify-center px-2' : ''}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon size={18} className="min-w-[18px]" />
                    {(!collapsed || mobile) && <span>{item.label}</span>}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* User Profile */}
      <div className="p-3 mt-2 border-t" style={{ borderColor: 'var(--sidebar-border)' }}>
        <div className={`flex items-center gap-3 p-2 rounded-xl ${collapsed && !mobile ? 'justify-center' : ''}`}
          style={{ background: 'var(--sidebar-hover)' }}>
          <div className="premium-logo w-8 h-8 min-w-[32px] rounded-full flex items-center justify-center text-white font-bold text-sm">
            {user.fullName.charAt(0)}
          </div>
          {(!collapsed || mobile) && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user.fullName}</div>
              <span className={`badge ${badge.className} text-[10px]`}>{badge.label}</span>
            </div>
          )}
          {(!collapsed || mobile) && (
            <button onClick={handleLogout} className="text-rose-400 hover:text-rose-300 transition-colors p-1" title="Logout">
              <LogOut size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="premium-app-shell flex h-screen overflow-hidden text-slate-100">
      <div className="liquid-blob left-[-8rem] top-[8rem] bg-sky-400/35" />
      <div className="liquid-blob right-[-10rem] top-[-6rem] bg-blue-600/30" />
      <div className="liquid-blob bottom-[-10rem] left-[45%] bg-cyan-900/35" />
      {/* Desktop Sidebar */}
      <aside
        className="sidebar premium-sidebar hidden lg:flex flex-col h-full relative z-20 transition-all duration-300"
        style={{ width: collapsed ? '64px' : '220px' }}
      >
        <SidebarContent />
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full flex items-center justify-center shadow-md z-30 transition-colors"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/60 z-30 lg:hidden"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="sidebar premium-sidebar fixed left-0 top-0 h-full z-40 lg:hidden flex flex-col"
              style={{ width: '240px' }}
              initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            >
              <div className="absolute top-4 right-4">
                <button onClick={() => setMobileOpen(false)} style={{ color: 'var(--text-muted)' }}>
                  <X size={20} />
                </button>
              </div>
              <SidebarContent mobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="premium-topbar h-16 flex items-center gap-4 px-4 md:px-6 flex-shrink-0 border-b"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          {/* Mobile menu button */}
          <button className="lg:hidden p-2 rounded-lg" style={{ color: 'var(--text-muted)' }}
            onClick={() => setMobileOpen(true)}>
            <Menu size={20} />
          </button>

          {/* Page title */}
          <div className="flex-1">
            <h1 className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
              {navItems.find(n => n.href === pathname)?.label || 'ManaKhata'}
            </h1>
            {user.householdName && (
              <p className="text-xs hidden sm:block" style={{ color: 'var(--text-muted)' }}>{user.householdName}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <StatementDownloader className="hidden sm:block" />
            
            {/* Theme toggle */}
            <button
              id="theme-toggle"
              onClick={() => {
                const currentTheme = theme === 'system' ? systemTheme : theme;
                setTheme(currentTheme === 'dark' ? 'light' : 'dark')
              }}
              className="p-2 rounded-xl transition-colors"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}
            >
              {mounted && (theme === 'dark' || (theme === 'system' && systemTheme === 'dark')) ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Notifications */}
            <button
              id="notification-bell"
              className="relative p-2 rounded-xl transition-colors"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}
              onClick={() => setNotifications(0)}
            >
              <Bell size={16} />
              {notifications > 0 && <span className="notification-dot" />}
            </button>

            {/* User avatar */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl cursor-pointer"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <div className="premium-logo w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs">
                {user.fullName.charAt(0)}
              </div>
              <span className="hidden sm:block text-sm font-medium truncate max-w-28" style={{ color: 'var(--text-primary)' }}>
                {user.fullName.split(' ')[0]}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6 page-enter">
          {children}
        </main>
      </div>

      {/* Floating Calculator */}
      <FloatingCalculator />
    </div>
  )
}
