import Link from 'next/link'
import type { ReactNode } from 'react'
import { Logo } from './Logo'

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="safe-top flex min-h-dvh flex-col bg-bg">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-5">
        <Link href="/" aria-label="ManaKhata home"><Logo size={28} /></Link>
        <Link href="/demo" className="text-sm font-semibold text-primary">Try the demo</Link>
      </header>
      <main className="flex flex-1 items-start justify-center px-5 pb-10 pt-4 sm:items-center">
        <div className="w-full max-w-[420px]">
          <div className="card card-fold p-6 sm:p-8">
            <h1 className="font-display text-2xl font-bold text-ink">{title}</h1>
            {subtitle && <p className="mt-1.5 text-sm text-ink-3">{subtitle}</p>}
            <div className="mt-6">{children}</div>
          </div>
          {footer && <div className="mt-5 text-center text-sm text-ink-3">{footer}</div>}
        </div>
      </main>
      <footer className="safe-bottom pb-5 text-center text-[12.5px] text-ink-3">
        <Link href="/terms" className="hover:text-ink">Terms</Link> · <Link href="/privacy" className="hover:text-ink">Privacy</Link>
      </footer>
    </div>
  )
}
