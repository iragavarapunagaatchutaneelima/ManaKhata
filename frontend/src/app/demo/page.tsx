'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Info } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { Avatar, Badge } from '@/components/ui'
import { DEMO_PEOPLE } from '@/lib/demo-seed'
import { ROLE_LABELS } from '@/lib/categories'
import { formatMoney } from '@/lib/money'
import { useSession } from '@/store/session'

export default function DemoPicker() {
  const router = useRouter()
  const startDemo = useSession((s) => s.startDemo)
  const mode = useSession((s) => s.mode)
  const current = useSession((s) => s.userId)

  return (
    <div className="safe-top min-h-dvh bg-bg px-5 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <Link href="/"><Logo size={28} /></Link>
          <Link href="/" className="inline-flex items-center gap-1 text-sm font-semibold text-ink-2"><ArrowLeft size={16} /> Back</Link>
        </div>

        <h1 className="mt-10 font-display text-3xl font-bold">Explore the demo household</h1>
        <p className="mt-2 text-ink-2">
          Meet the Sharmas — six months of realistic family finances. Pick who you want to be; each person sees what their role allows.
        </p>

        <div className="mt-6 space-y-3">
          {DEMO_PEOPLE.map((p) => (
            <button key={p.id} onClick={() => { startDemo(p.id); router.push('/dashboard') }}
              className="card flex w-full items-center gap-4 p-4 text-left transition hover:border-primary">
              <Avatar name={p.name} size={44} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-ink">{p.name}</span>
                  <Badge tone={p.role === 'HOUSEHEAD' ? 'saffron' : 'primary'}>{ROLE_LABELS[p.role]}</Badge>
                  {mode === 'demo' && current === p.id && <Badge tone="positive">current</Badge>}
                </div>
                <div className="mt-0.5 text-[13px] text-ink-3">{p.blurb}{p.income > 0 && ` · earns ${formatMoney(p.income)}/month`}</div>
              </div>
              <ArrowRight size={18} className="shrink-0 text-ink-3" />
            </button>
          ))}
        </div>

        <div className="mt-6 flex gap-3 rounded-[14px] border border-line bg-surface p-4 text-[13px] text-ink-2">
          <Info size={18} className="mt-0.5 shrink-0 text-primary" />
          <p>
            The demo runs entirely in your browser. Anything you add or change is stored only on this device and is never sent to our servers.
            Ready for the real thing? <Link href="/auth/register" className="font-semibold text-primary">Create your free account</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}
