'use client'

import { useState } from 'react'
import { Bot, MessageCircle, Copy, CheckCircle2, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'

export default function IntegrationsPage() {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const generateToken = async () => {
    setLoading(true)
    // Simulate backend generating an integration token
    await new Promise(r => setTimeout(r, 1000))
    setToken(`mk_${Math.random().toString(36).substr(2, 9)}_${user?.userId || 99}`)
    setLoading(false)
    toast.success('Integration token generated!')
  }

  const copyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success('Copied to clipboard')
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>
          🔌 Integrations
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Connect ManaKhata to your favorite apps for automated expense logging.
        </p>
      </div>

      <div className="glass-card p-6 border border-emerald-500/30 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4">
          <span className="badge badge-brand">BETA</span>
        </div>
        
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#25D366]/20 flex items-center justify-center flex-shrink-0">
            <MessageCircle size={28} className="text-[#25D366]" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
              WhatsApp Bot (AI Logging)
            </h2>
            <p className="text-sm mt-1 max-w-lg" style={{ color: 'var(--text-muted)' }}>
              Send a quick message like "Paid 500 for swiggy" to our verified WhatsApp bot, and our AI will automatically parse the merchant, amount, and category, and log it to your account instantly!
            </p>

            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs">1</span>
                Generate your secure linking token
              </div>
              
              {!token ? (
                <button
                  onClick={generateToken}
                  disabled={loading}
                  className="btn-primary ml-9"
                >
                  {loading ? 'Generating...' : 'Generate Token'}
                </button>
              ) : (
                <div className="ml-9 flex items-center gap-2">
                  <div className="px-4 py-2 rounded-lg font-mono text-sm bg-black/40 border border-white/10 text-emerald-400">
                    {token}
                  </div>
                  <button onClick={copyToken} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                    {copied ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Copy size={16} style={{ color: 'var(--text-muted)' }} />}
                  </button>
                </div>
              )}

              <div className="flex items-center gap-3 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs">2</span>
                Message the bot
              </div>
              <div className="ml-9 text-sm" style={{ color: 'var(--text-muted)' }}>
                Send the token to <strong className="text-white">+91 98765 43210</strong> on WhatsApp to link your device.
                <a href="#" className="flex items-center gap-1 text-brand-400 hover:text-brand-300 mt-2 font-medium">
                  Open WhatsApp <ArrowRight size={14} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-6 border border-blue-500/20 opacity-70">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#0088cc]/20 flex items-center justify-center flex-shrink-0">
            <Bot size={28} className="text-[#0088cc]" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
              Telegram Bot
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Similar to WhatsApp, but for Telegram. Currently in development and rolling out in Phase 2.
            </p>
            <div className="mt-3">
              <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded bg-white/5 text-white/40">Coming Soon</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
