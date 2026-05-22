'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'

const features = [
  { icon: '🏠', title: 'Household Management',   desc: 'One hub for every family member\'s finances, roles, and permissions.' },
  { icon: '🔄', title: 'Reimbursement System',   desc: 'Track who paid what for the household. Approve & settle instantly.' },
  { icon: '🤖', title: 'AI Financial Advisor',   desc: 'Smart predictions, investment suggestions, and overspending alerts.' },
  { icon: '📊', title: 'Analytics Dashboard',    desc: 'Visual spending trends, category breakdowns, and member reports.' },
  { icon: '🚗', title: 'Vehicle & Asset Mgmt',  desc: 'Track fuel, maintenance, shared vehicles, and contributor analytics.' },
  { icon: '💰', title: 'Family Wallet System',   desc: 'Allocate allowances, transfer funds, and track every rupee.' },
  { icon: '📈', title: 'Investment Engine',      desc: 'SIP, FD, mutual funds — personalized to your household finances.' },
  { icon: '🛡️', title: 'Financial Health Score', desc: '0-100 score grading your household\'s overall financial health.' },
]

const stats = [
  { value: '26+', label: 'Smart Modules' },
  { value: '₹∞',  label: 'Money Tracked' },
  { value: '5+',  label: 'Family Roles' },
  { value: 'AI',  label: 'Powered Insights' },
]

export default function LandingPage() {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard')
  }, [isAuthenticated, router])

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white overflow-x-hidden">
      {/* Mesh background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-brand-600/10 rounded-full blur-3xl" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center text-white font-bold text-lg shadow-glow-brand">
            M
          </div>
          <span className="font-display font-bold text-xl">ManaKhata</span>
          <span className="hidden sm:block text-xs text-white/40 font-medium">Our Household Account</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="btn-ghost text-white/70 border-white/10 hover:border-white/20">
            Sign In
          </Link>
          <Link href="/auth/register" className="btn-primary">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 text-center px-6 pt-24 pb-20 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-300 text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
            AI-Powered Household Financial OS
          </div>

          <h1 className="font-display font-bold text-5xl md:text-7xl leading-tight mb-6">
            The Financial Brain
            <br />
            <span className="text-gradient-brand">of Your Family</span>
          </h1>

          <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
            ManaKhata goes beyond expense tracking. It's a complete household financial ecosystem — 
            with AI insights, reimbursement workflows, shared asset tracking, and family collaboration.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/register" className="btn-primary text-base px-8 py-3 shadow-glow-brand">
              Start Your Household →
            </Link>
            <Link href="/auth/login" className="btn-ghost text-white/70 border-white/10 px-8 py-3">
              Demo Login
            </Link>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {stats.map((stat) => (
            <div key={stat.label} className="glass-card p-5 text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className="font-display font-bold text-3xl text-gradient-brand">{stat.value}</div>
              <div className="text-white/50 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 px-6 md:px-12 pb-20 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="font-display font-bold text-3xl md:text-4xl mb-4">
            Everything Your Household Needs
          </h2>
          <p className="text-white/50 text-lg">26 intelligent modules in one unified platform</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              className="glass-card p-6 cursor-default"
              style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="font-display font-semibold text-base mb-2">{feature.title}</h3>
              <p className="text-white/45 text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Demo Credentials Banner */}
      <section className="relative z-10 px-6 pb-20">
        <motion.div
          className="max-w-2xl mx-auto glass-card p-8 text-center"
          style={{ background: 'rgba(99,102,241,0.08)', borderColor: 'rgba(99,102,241,0.20)' }}
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <div className="text-2xl mb-3">🎯</div>
          <h3 className="font-display font-bold text-xl mb-2">Try the Demo</h3>
          <p className="text-white/50 text-sm mb-4">Log in as the Sharma family househead to explore all features</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-sm">
            <code className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-brand-300">
              demo@manaKhata.app
            </code>
            <code className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-brand-300">
              Demo@1234
            </code>
          </div>
          <Link href="/auth/login" className="btn-primary mt-5 inline-flex">
            Launch Demo →
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-white/30 text-sm">
        <p>© 2026 ManaKhata — Our Household Account. Built with ❤️ for Indian families.</p>
      </footer>
    </div>
  )
}
