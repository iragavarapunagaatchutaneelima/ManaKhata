'use client'

import { useEffect } from 'react'
import Link from 'next/link'

// Keeps one broken screen from taking down the whole app shell.
export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[ManaKhata] page error:', error)
  }, [error])

  return (
    <div className="max-w-md mx-auto mt-16 glass-card p-8 text-center">
      <h2 className="font-display font-bold text-xl mb-2" style={{ color: 'var(--text-primary)' }}>
        This page hit a problem
      </h2>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        Your data is safe. Try again, or go back to the dashboard.
      </p>
      <div className="flex gap-3 justify-center">
        <button onClick={reset} className="btn-primary">Try again</button>
        <Link href="/dashboard" className="btn-ghost">Dashboard</Link>
      </div>
    </div>
  )
}
