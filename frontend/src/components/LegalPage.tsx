import Link from 'next/link'
import type { ReactNode } from 'react'
import { Logo } from './Logo'
import { LEGAL_UPDATED } from '@/lib/config'

export function LegalPage({ title, intro, children }: { title: string; intro: ReactNode; children: ReactNode }) {
  return (
    <div className="safe-top min-h-dvh bg-bg">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <Link href="/"><Logo size={26} /></Link>
          <nav className="flex gap-4 text-sm font-semibold text-ink-2"><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link></nav>
        </div>
      </header>
      <article className="mx-auto max-w-3xl px-5 py-10 text-[15px] leading-relaxed text-ink-2
        [&_h2]:mt-9 [&_h2]:mb-2 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ink
        [&_ul]:my-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_p]:my-3 [&_a]:font-semibold [&_a]:text-primary [&_strong]:text-ink">
        <h1 className="font-display text-3xl font-bold text-ink">{title}</h1>
        <p className="!mt-2 text-sm text-ink-3">Last updated: {LEGAL_UPDATED}</p>
        <div className="mt-6 rounded-[14px] border border-line bg-surface p-4 text-[14px]">{intro}</div>
        {children}
      </article>
    </div>
  )
}
