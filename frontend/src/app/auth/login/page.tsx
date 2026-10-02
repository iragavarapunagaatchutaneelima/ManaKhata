'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, ArrowRight, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('demo@manaKhata.app')
  const [password, setPassword] = useState('Demo@1234')
  const [showPass, setShowPass] = useState(false)
  const { login, isLoading, isAuthenticated, hasHydrated } = useAuthStore()
  const router = useRouter()

  // Already signed in (e.g. the installed app reopening): go straight to the dashboard.
  useEffect(() => {
    if (hasHydrated && isAuthenticated) router.replace('/dashboard')
  }, [hasHydrated, isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login(email, password)
      toast.success('Welcome back! 🎉')
      router.replace('/dashboard')
    } catch (err: any) {
      toast.error(err.message || 'Login failed. Please check your credentials.')
    }
  }

  const demoLogins = [
    { label: 'Mario (Head)', email: 'demo@manaKhata.app',  role: 'HOUSEHEAD' },
    { label: 'Ria',          email: 'ria@manaKhata.app',   role: 'PARENT' },
    { label: 'Max',          email: 'max@manaKhata.app',   role: 'ADULT_CHILD' },
    { label: 'Lucy',         email: 'lucy@manaKhata.app',  role: 'STUDENT' },
  ]

  return (
    <div className="premium-app-shell min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden">

        <div className="relative z-10 flex items-center gap-3">
          <div className="premium-logo w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xl text-white">M</div>
          <span className="font-display font-bold text-2xl text-[color:var(--text-primary)]">ManaKhata</span>
        </div>

        <div className="relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="font-display font-bold text-4xl text-[color:var(--text-primary)] mb-6 leading-snug">
              The Financial Brain<br />
              <span className="text-gradient-brand">of Your Household</span>
            </h2>
            <p className="text-[color:var(--text-secondary)] text-lg leading-relaxed mb-8">
              AI-powered insights, reimbursement tracking, shared asset management, 
              and family financial collaboration — all in one premium platform.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2">
              {['AI Insights', 'Reimbursements', 'Family Wallets', 'Vehicle Tracking', 'Health Score', 'Investments'].map(f => (
                <span key={f} className="px-3 py-1.5 rounded-full bg-[var(--surface-2)] border border-[color:var(--border-color)] text-[color:var(--text-secondary)] text-sm flex items-center gap-1.5">
                  <Sparkles size={12} className="text-brand-400" /> {f}
                </span>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="relative z-10 text-[color:var(--text-muted)] text-sm">
          © 2026 ManaKhata
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="premium-logo w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white">M</div>
            <span className="font-display font-bold text-xl text-[color:var(--text-primary)]">ManaKhata</span>
          </div>

          <div className="glass-card p-8">
            <h1 className="font-display font-bold text-2xl text-[color:var(--text-primary)] mb-1">Welcome back</h1>
            <p className="text-[color:var(--text-muted)] text-sm mb-8">Sign in to your household account</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[color:var(--text-secondary)] text-sm font-medium mb-1.5">Email address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)]" />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="input-field pl-10"
                   
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[color:var(--text-secondary)] text-sm font-medium mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)]" />
                  <input
                    id="login-password"
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="input-field pl-10 pr-10"
                   
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)] hover:text-[color:var(--text-secondary)] transition-colors"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                id="login-submit"
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full py-3 text-base disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-[color:var(--border-color)] border-t-current rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Sign In <ArrowRight size={16} />
                  </span>
                )}
              </button>
            </form>

            {/* Demo logins */}
            <div className="mt-6">
              <p className="text-[color:var(--text-muted)] text-xs text-center mb-3">— Quick demo access —</p>
              <div className="grid grid-cols-2 gap-2">
                {demoLogins.map(demo => (
                  <button
                    key={demo.email}
                    id={`demo-${demo.label.toLowerCase()}`}
                    type="button"
                    onClick={() => { setEmail(demo.email); setPassword('Demo@1234') }}
                    className="px-3 py-2 rounded-xl text-xs font-medium border border-[color:var(--border-color)] bg-[var(--surface-2)] text-[color:var(--text-secondary)] hover:bg-[var(--sidebar-hover)] hover:text-[color:var(--text-secondary)] transition-all text-left"
                  >
                    <div className="text-[color:var(--text-secondary)] font-semibold">{demo.label}</div>
                    <div className="text-[color:var(--text-muted)] text-[10px] truncate">{demo.email}</div>
                  </button>
                ))}
              </div>
            </div>

            <p className="text-center text-[color:var(--text-muted)] text-sm mt-6">
              New household?{' '}
              <Link href="/auth/register" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
                Create account
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
