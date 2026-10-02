'use client'

import { useEffect } from 'react'
import Link from 'next/link'

// Keeps one broken screen from taking down the whole app shell.
export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('[Kinfold] page error:', error) }, [error])

  return (
    <div className="card mx-auto mt-16 max-w-md p-8 text-center">
      <h2 className="font-display text-xl font-bold text-ink">This page hit a problem</h2>
      <p className="mt-2 text-sm text-ink-3">Your data is safe. Try again, or go back to Home.</p>
      <div className="mt-6 flex justify-center gap-3">
        <button onClick={reset} className="h-10 rounded-[10px] bg-primary px-4 text-sm font-semibold text-on-primary">Try again</button>
        <Link href="/dashboard" className="inline-flex h-10 items-center rounded-[10px] border border-line-strong px-4 text-sm font-semibold text-ink">Home</Link>
      </div>
    </div>
  )
}
