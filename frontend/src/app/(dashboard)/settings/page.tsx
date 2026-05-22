'use client'

import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency } from '@/hooks/useUtils'
import { useRouter } from 'next/navigation'
import { LogOut, User, Shield, Bell, Moon, Palette, Globe, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { getRoleBadge } from '@/hooks/useUtils'

export default function SettingsPage() {
  const { user, logout } = useAuthStore()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    router.replace('/auth/login')
  }

  const settingsSections = [
    {
      title: 'Profile',
      icon: User,
      items: [
        { label: 'Full Name', value: user?.fullName, editable: true },
        { label: 'Email', value: user?.email },
        { label: 'Role', value: user?.role?.replace('_', ' ') },
        { label: 'Household', value: user?.householdName },
      ]
    },
    {
      title: 'Preferences',
      icon: Palette,
      items: [
        { label: 'Currency', value: 'INR (₹)', editable: true },
        { label: 'Language', value: 'English (India)' },
        { label: 'Timezone', value: 'IST (UTC+5:30)' },
      ]
    },
    {
      title: 'Notifications',
      icon: Bell,
      items: [
        { label: 'Budget Alerts', value: 'Enabled', toggle: true },
        { label: 'Reimbursement Updates', value: 'Enabled', toggle: true },
        { label: 'AI Insights', value: 'Weekly', toggle: true },
      ]
    },
    {
      title: 'Security',
      icon: Shield,
      items: [
        { label: 'Authentication', value: 'JWT · 24h session' },
        { label: 'Password', value: '••••••••', editable: true },
        { label: 'Last Login', value: new Date().toLocaleDateString('en-IN') },
      ]
    },
  ]

  const badge = user ? getRoleBadge(user.role) : null

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Profile Card */}
      <motion.div className="glass-card p-6 relative overflow-hidden"
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="absolute inset-0 gradient-brand opacity-[0.06]" />
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-20 h-20 rounded-3xl gradient-brand flex items-center justify-center text-white font-bold text-3xl shadow-glow-brand">
            {user?.fullName?.charAt(0)}
          </div>
          <div>
            <h2 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>
              {user?.fullName}
              {user?.isHousehead && <span className="ml-2 text-gold-500">👑</span>}
            </h2>
            <p style={{ color: 'var(--text-muted)' }} className="text-sm">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              {badge && <span className={`badge ${badge.className}`}>{badge.label}</span>}
              <span className="badge badge-muted">{user?.householdName}</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-2 md:grid-cols-3 gap-3 mt-6 pt-5 border-t"
          style={{ borderColor: 'var(--border-color)' }}>
          {[
            { icon: '💳', label: 'Wallet Balance', value: formatCurrency(user?.walletBalance ?? 0) },
            { icon: '🏠', label: 'Invite Code', value: user?.inviteCode },
            { icon: '🔑', label: 'User ID', value: `#${user?.userId}` },
          ].map(item => (
            <div key={item.label} className="p-3 rounded-xl" style={{ background: 'var(--bg-primary)' }}>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.label}</div>
              <div className="font-semibold mt-0.5 font-mono" style={{ color: 'var(--text-primary)' }}>{item.value}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Settings Sections */}
      {settingsSections.map((section, si) => {
        const Icon = section.icon
        return (
          <motion.div key={section.title} className="glass-card overflow-hidden"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: si * 0.08 }}>
            <div className="flex items-center gap-2 p-5 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <Icon size={16} className="text-brand-400" />
              <h3 className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                {section.title}
              </h3>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
              {section.items.map(item => (
                <div key={item.label} className="flex items-center justify-between p-4 hover:bg-brand-500/4 transition-colors">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.value}</span>
                    {(item as any).editable && (
                      <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                    )}
                    {(item as any).toggle && (
                      <div className="w-8 h-4 rounded-full bg-brand-500 relative cursor-pointer">
                        <span className="absolute top-0.5 left-[14px] w-3 h-3 rounded-full bg-white" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )
      })}

      {/* Danger Zone */}
      <motion.div className="glass-card p-6"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}>
        <h3 className="font-display font-semibold text-sm text-rose-400 mb-4">Danger Zone</h3>
        <button
          id="logout-btn"
          onClick={handleLogout}
          className="flex items-center gap-2 px-5 py-3 rounded-xl border border-rose-500/20 bg-rose-500/8 text-rose-400 font-medium text-sm hover:bg-rose-500/15 transition-colors"
        >
          <LogOut size={16} /> Sign Out
        </button>
      </motion.div>
    </div>
  )
}
