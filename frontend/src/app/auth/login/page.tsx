'use client'

import { useState } from 'react'
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
  const { login, isLoading } = useAuthStore()
  const router = useRouter()

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
    { label: 'Househead', email: 'demo@manaKhata.app',   role: 'HOUSEHEAD' },
    { label: 'Mother',    email: 'sunita@manaKhata.app', role: 'PARENT' },
    { label: 'Son',       email: 'arjun@manaKhata.app',  role: 'ADULT_CHILD' },
    { label: 'Daughter',  email: 'priya@manaKhata.app',  role: 'STUDENT' },
  ]

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden">
        <div className="absolute inset-0 gradient-brand opacity-10" />
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-64 h-64 bg-indigo-400/15 rounded-full blur-3xl" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center font-bold text-xl shadow-glow-brand">M</div>
          <span className="font-display font-bold text-2xl text-white">ManaKhata</span>
        </div>

        <div className="relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="font-display font-bold text-4xl text-white mb-6 leading-snug">
              The Financial Brain<br />
              <span className="text-gradient-brand">of Your Household</span>
            </h2>
            <p className="text-white/50 text-lg leading-relaxed mb-8">
              AI-powered insights, reimbursement tracking, shared asset management, 
              and family financial collaboration — all in one premium platform.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2">
              {['AI Insights', 'Reimbursements', 'Family Wallets', 'Vehicle Tracking', 'Health Score', 'Investments'].map(f => (
                <span key={f} className="px-3 py-1.5 rounded-full bg-white/8 border border-white/10 text-white/60 text-sm flex items-center gap-1.5">
                  <Sparkles size={12} className="text-brand-400" /> {f}
                </span>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="relative z-10 text-white/30 text-sm">
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
            <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center font-bold shadow-glow-brand">M</div>
            <span className="font-display font-bold text-xl text-white">ManaKhata</span>
          </div>

          <div className="glass-card p-8" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
            <h1 className="font-display font-bold text-2xl text-white mb-1">Welcome back</h1>
            <p className="text-white/40 text-sm mb-8">Sign in to your household account</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-white/60 text-sm font-medium mb-1.5">Email address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="input-field pl-10"
                    style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.10)', color: 'white' }}
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/60 text-sm font-medium mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    id="login-password"
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="input-field pl-10 pr-10"
                    style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.10)', color: 'white' }}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
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
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
              <p className="text-white/30 text-xs text-center mb-3">— Quick demo access —</p>
              <div className="grid grid-cols-2 gap-2">
                {demoLogins.map(demo => (
                  <button
                    key={demo.email}
                    id={`demo-${demo.label.toLowerCase()}`}
                    type="button"
                    onClick={() => { setEmail(demo.email); setPassword('Demo@1234') }}
                    className="px-3 py-2 rounded-xl text-xs font-medium border border-white/8 bg-white/4 text-white/50 hover:bg-white/8 hover:text-white/70 transition-all text-left"
                  >
                    <div className="text-white/70 font-semibold">{demo.label}</div>
                    <div className="text-white/30 text-[10px] truncate">{demo.email}</div>
                  </button>
                ))}
              </div>
            </div>

            <p className="text-center text-white/30 text-sm mt-6">
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
