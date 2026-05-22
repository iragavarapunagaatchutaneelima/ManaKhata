'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { User, Mail, Lock, Phone, Home, Hash, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import type { UserRole } from '@/types'

const roles: { value: UserRole; label: string; icon: string; desc: string }[] = [
  { value: 'HOUSEHEAD',   label: 'Househead',   icon: '👑', desc: 'Full control — create household' },
  { value: 'PARENT',      label: 'Parent',      icon: '👨‍👩‍👧', desc: 'View household + manage expenses' },
  { value: 'ADULT_CHILD', label: 'Adult Child', icon: '🧑', desc: 'Personal expenses + contributions' },
  { value: 'STUDENT',     label: 'Student',     icon: '🎓', desc: 'Personal expenses only' },
  { value: 'GRANDPARENT', label: 'Grandparent', icon: '👴', desc: 'Simplified view' },
  { value: 'GUEST',       label: 'Guest',       icon: '👤', desc: 'Read-only access' },
]

export default function RegisterPage() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'ADULT_CHILD' as UserRole,
    householdName: '',
    inviteCode: '',
    monthlyIncome: '',
    joinExisting: false,
  })
  const { register, isLoading } = useAuthStore()
  const router = useRouter()

  const update = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }))

  const handleSubmit = async () => {
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    try {
      await register({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone || undefined,
        password: form.password,
        role: form.role,
        householdName: !form.joinExisting ? form.householdName : undefined,
        inviteCode: form.joinExisting ? form.inviteCode : undefined,
        monthlyIncome: form.monthlyIncome ? parseFloat(form.monthlyIncome) : undefined,
      })
      toast.success('Household created! Welcome to ManaKhata 🎉')
      router.replace('/dashboard')
    } catch (err: any) {
      toast.error(err.message || 'Registration failed')
    }
  }

  const inputClass = "input-field" + " [&]:bg-white/6 [&]:border-white/10 [&]:text-white [&::placeholder]:text-white/30"

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center p-6">
      {/* Background glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        className="w-full max-w-lg relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center font-bold text-lg shadow-glow-brand">M</div>
          <span className="font-display font-bold text-xl text-white">ManaKhata</span>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${s <= step ? 'gradient-brand' : 'bg-white/10'}`} />
          ))}
        </div>

        <div className="glass-card p-8" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
          {/* Step 1: Personal Info */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h1 className="font-display font-bold text-2xl text-white mb-1">Create your account</h1>
              <p className="text-white/40 text-sm mb-6">Step 1 of 3 — Personal information</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-white/60 text-sm font-medium mb-1.5">Full Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                    <input id="reg-name" type="text" value={form.fullName} onChange={e => update('fullName', e.target.value)}
                      className="input-field pl-10" style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.10)', color: 'white' }}
                      placeholder="Rajesh Sharma" />
                  </div>
                </div>
                <div>
                  <label className="block text-white/60 text-sm font-medium mb-1.5">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                    <input id="reg-email" type="email" value={form.email} onChange={e => update('email', e.target.value)}
                      className="input-field pl-10" style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.10)', color: 'white' }}
                      placeholder="you@example.com" />
                  </div>
                </div>
                <div>
                  <label className="block text-white/60 text-sm font-medium mb-1.5">Phone (optional)</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                    <input id="reg-phone" type="tel" value={form.phone} onChange={e => update('phone', e.target.value)}
                      className="input-field pl-10" style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.10)', color: 'white' }}
                      placeholder="+91 98765 43210" />
                  </div>
                </div>
                <div>
                  <label className="block text-white/60 text-sm font-medium mb-1.5">Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                    <input id="reg-password" type="password" value={form.password} onChange={e => update('password', e.target.value)}
                      className="input-field pl-10" style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.10)', color: 'white' }}
                      placeholder="Min 8 characters" />
                  </div>
                </div>
                <div>
                  <label className="block text-white/60 text-sm font-medium mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                    <input id="reg-confirm" type="password" value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)}
                      className="input-field pl-10" style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.10)', color: 'white' }}
                      placeholder="••••••••" />
                  </div>
                </div>
              </div>

              <button id="step1-next" onClick={() => setStep(2)} disabled={!form.fullName || !form.email || !form.password}
                className="btn-primary w-full mt-6 py-3 disabled:opacity-40">
                Continue <ArrowRight size={16} />
              </button>
            </motion.div>
          )}

          {/* Step 2: Role Selection */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h1 className="font-display font-bold text-2xl text-white mb-1">Select your role</h1>
              <p className="text-white/40 text-sm mb-6">Step 2 of 3 — Your role in the household</p>

              <div className="grid grid-cols-2 gap-2 mb-6">
                {roles.map(r => (
                  <button key={r.value} id={`role-${r.value}`} type="button" onClick={() => update('role', r.value)}
                    className={`p-4 rounded-xl border text-left transition-all duration-200 ${
                      form.role === r.value
                        ? 'border-brand-500 bg-brand-500/15'
                        : 'border-white/8 bg-white/4 hover:bg-white/8 hover:border-white/15'
                    }`}
                  >
                    <div className="text-2xl mb-1">{r.icon}</div>
                    <div className="text-white font-semibold text-sm">{r.label}</div>
                    <div className="text-white/40 text-xs mt-0.5">{r.desc}</div>
                  </button>
                ))}
              </div>

              <div className="mb-4">
                <label className="block text-white/60 text-sm font-medium mb-1.5">Monthly Income (optional)</label>
                <input id="reg-income" type="number" value={form.monthlyIncome} onChange={e => update('monthlyIncome', e.target.value)}
                  className="input-field" style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.10)', color: 'white' }}
                  placeholder="e.g. 50000" />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-ghost text-white/50 border-white/10 flex-1">
                  <ChevronLeft size={16} /> Back
                </button>
                <button id="step2-next" onClick={() => setStep(3)} className="btn-primary flex-1 py-3">
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Household */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h1 className="font-display font-bold text-2xl text-white mb-1">Your Household</h1>
              <p className="text-white/40 text-sm mb-6">Step 3 of 3 — Set up or join a household</p>

              <div className="flex gap-2 mb-6 p-1 rounded-xl bg-white/5 border border-white/8">
                <button onClick={() => update('joinExisting', false)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${!form.joinExisting ? 'bg-brand-600 text-white shadow' : 'text-white/50'}`}>
                  Create New
                </button>
                <button onClick={() => update('joinExisting', true)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${form.joinExisting ? 'bg-brand-600 text-white shadow' : 'text-white/50'}`}>
                  Join Existing
                </button>
              </div>

              {!form.joinExisting ? (
                <div>
                  <label className="block text-white/60 text-sm font-medium mb-1.5">Household Name</label>
                  <div className="relative">
                    <Home size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                    <input id="reg-household-name" type="text" value={form.householdName} onChange={e => update('householdName', e.target.value)}
                      className="input-field pl-10" style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.10)', color: 'white' }}
                      placeholder="Sharma Family" />
                  </div>
                  <p className="text-white/30 text-xs mt-2">You'll be the Househead with full admin access.</p>
                </div>
              ) : (
                <div>
                  <label className="block text-white/60 text-sm font-medium mb-1.5">Invite Code</label>
                  <div className="relative">
                    <Hash size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                    <input id="reg-invite-code" type="text" value={form.inviteCode} onChange={e => update('inviteCode', e.target.value.toUpperCase())}
                      className="input-field pl-10 uppercase tracking-widest" style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.10)', color: 'white' }}
                      placeholder="SHARMA01" maxLength={8} />
                  </div>
                  <p className="text-white/30 text-xs mt-2">Get the invite code from your household head.</p>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(2)} className="btn-ghost text-white/50 border-white/10 flex-1">
                  <ChevronLeft size={16} /> Back
                </button>
                <button id="register-submit" onClick={handleSubmit} disabled={isLoading}
                  className="btn-primary flex-1 py-3 disabled:opacity-40">
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </span>
                  ) : 'Create Household 🎉'}
                </button>
              </div>
            </motion.div>
          )}

          <p className="text-center text-white/30 text-sm mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
