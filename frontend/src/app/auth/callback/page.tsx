'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/Logo'
import { useSession } from '@/store/session'

// Email confirmation links land here; the Supabase client reads the session from the URL.
export default function AuthCallback() {
  const router = useRouter()
  const status = useSession((s) => s.status)

  useEffect(() => {
    if (status === 'ready') router.replace('/dashboard')
    if (status === 'onboarding') router.replace('/onboarding')
    if (status === 'signedOut') {
      const t = setTimeout(() => router.replace('/auth/login'), 2500)
      return () => clearTimeout(t)
    }
  }, [status, router])

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
      <Logo size={36} />
      <p className="text-sm text-ink-2">{status === 'signedOut' ? 'This link has expired or was already used. Taking you to sign in…' : 'Confirming your email…'}</p>
    </div>
  )
}
