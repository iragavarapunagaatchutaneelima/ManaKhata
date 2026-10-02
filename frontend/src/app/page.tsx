'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowRight, BarChart3, Bell, Check, Code2, Goal, Landmark, Lock, PiggyBank, ShieldCheck, Smartphone, Split, Users, Wallet,
} from 'lucide-react'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui'
import { useSession } from '@/store/session'
import { REPO_URL } from '@/lib/config'

const FEATURES = [
  { icon: Users, title: 'One shared ledger', body: 'Everyone in the family records spending in one place. Mark anything private and it stays yours.' },
  { icon: Split, title: 'Fair splits, fewer payments', body: 'Split bills equally or by amount. Kinfold nets everything out and suggests the fewest payments to settle up.' },
  { icon: PiggyBank, title: 'Budgets that warn early', body: 'Monthly limits per category with a month-end projection, so you know before you overspend.' },
  { icon: Bell, title: 'Bills never sneak up', body: 'Rent, EMIs, school fees and subscriptions with due dates. One tap records the payment.' },
  { icon: Wallet, title: 'Pocket money & chores', body: 'Give allowances, reward chores and let kids see their own wallet — real money skills at home.' },
  { icon: Goal, title: 'Goals, trips & vehicles', body: 'Save toward goals with a monthly target, track trips in any currency, and see your car’s real km/l.' },
  { icon: Landmark, title: 'Wealth & tax in one view', body: 'Investments, insurance cover and an 80C / 80D tax-saver tracker with the legal limits built in.' },
  { icon: BarChart3, title: 'Reports you can trust', body: 'Trends, category breakdowns, a financial health score and CSV export — all from your own numbers.' },
]

const FAQ = [
  ['Is Kinfold free?', 'Yes. Kinfold is free to use, and its source code is published under the MIT licence.'],
  ['Does Kinfold connect to my bank?', 'No. You add entries yourself, so Kinfold never asks for bank logins, card numbers or UPI PINs.'],
  ['Who can see my expenses?', 'Only members of your household, and only entries marked shared. Private entries are visible to you alone — enforced by the database, not just the app.'],
  ['Can I try it without signing up?', 'Yes — the demo household is fully interactive. Your changes stay in your browser and never reach our servers.'],
  ['Can I delete my data?', 'Any time, from Settings → Delete account. You can also export your transactions as CSV first.'],
]

export default function Landing() {
  const router = useRouter()
  const status = useSession((s) => s.status)
  const signedIn = status === 'ready'

  return (
    <div className="min-h-dvh bg-bg text-ink">
      <header className="safe-top sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-5">
          <Link href="/" aria-label="Kinfold home"><Logo size={30} /></Link>
          <nav className="ml-6 hidden gap-6 text-sm font-medium text-ink-2 md:flex">
            <a href="#features" className="hover:text-ink">Features</a>
            <a href="#security" className="hover:text-ink">Privacy & security</a>
            <a href="#faq" className="hover:text-ink">FAQ</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {signedIn ? (
              <Button onClick={() => router.push('/dashboard')}>Open Kinfold</Button>
            ) : (
              <>
                <Link href="/auth/login" className="hidden h-10 items-center px-3 text-sm font-semibold text-ink-2 hover:text-ink sm:inline-flex">Sign in</Link>
                <Button onClick={() => router.push('/auth/register')}>Get started</Button>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-14 lg:grid-cols-[1.1fr_1fr] lg:pt-20">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-[12.5px] font-semibold text-ink-2">
            <span className="h-2 w-2 rounded-full bg-saffron" /> Built for Indian families · works anywhere
          </span>
          <h1 className="mt-5 font-display text-[40px] font-extrabold leading-[1.08] tracking-tight sm:text-[54px]">
            Your family’s money,<br /><span className="text-primary">folded into one place.</span>
          </h1>
          <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-ink-2">
            Kinfold is a shared money app for households. Track spending together, split costs fairly, stay ahead of bills and budgets,
            and teach kids about money — on the web and on Android.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" variant="saffron" onClick={() => router.push('/demo')} icon={<ArrowRight size={18} />}>Try the demo — no sign-up</Button>
            <Button size="lg" variant="secondary" onClick={() => router.push('/auth/register')}>Create free account</Button>
          </div>
          <p className="mt-4 text-sm text-ink-3">Already using Kinfold? <Link href="/auth/login" className="font-semibold text-primary">Sign in</Link></p>
        </div>

        {/* Product preview built from real components' styling, not a screenshot */}
        <div className="relative">
          <div className="card card-fold p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[12.5px] font-medium text-ink-3">Sharma Household · this month</div>
                <div className="mt-1 font-display text-3xl font-bold">₹78,420</div>
                <div className="text-[12.5px] text-positive">▼ 6% vs same point last month</div>
              </div>
              <div className="rounded-[12px] bg-positive-soft px-3 py-2 text-right">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-positive">Saved</div>
                <div className="font-display text-lg font-bold text-positive">32%</div>
              </div>
            </div>
            <div className="mt-5 flex h-28 items-end gap-2">
              {[62, 74, 58, 81, 69, 55].map((h, i) => (
                <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                  <div className="w-full rounded-t-[6px] bg-primary" style={{ height: `${h}%`, opacity: i === 5 ? 1 : 0.55 }} />
                  <span className="text-[10px] text-ink-3">{['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'][i]}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 space-y-2.5">
              {[['Groceries', 78, 'bg-warning'], ['Dining out', 46, 'bg-positive'], ['Fuel & transport', 61, 'bg-positive']].map(([label, pct, color]) => (
                <div key={label as string}>
                  <div className="mb-1 flex justify-between text-[12.5px]"><span className="font-medium">{label}</span><span className="text-ink-3">{pct}% of budget</span></div>
                  <div className="h-2 rounded-full bg-surface-3"><div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
          <div className="card absolute -bottom-6 -left-4 hidden w-60 p-4 sm:block">
            <div className="text-[12px] font-semibold text-ink-3">Settle up</div>
            <div className="mt-1 text-sm"><b>Meera</b> pays <b>Asha</b> <span className="font-semibold text-primary">₹1,840</span></div>
            <div className="mt-1 text-[11.5px] text-ink-3">1 payment instead of 4</div>
          </div>
        </div>
      </section>

      <section id="features" className="border-t border-line bg-surface py-16">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="font-display text-3xl font-bold">Everything a household runs on</h2>
          <p className="mt-2 max-w-2xl text-ink-2">The features people use Splitwise, a budgeting app, a spreadsheet and a family WhatsApp group for — in one app the whole family shares.</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-[16px] border border-line bg-bg p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-primary-soft text-primary"><f.icon size={20} /></div>
                <h3 className="mt-4 text-[15px] font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-2">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 md:grid-cols-3">
          {[
            ['1', 'Create your household', 'Sign up, name your household and set your monthly income.'],
            ['2', 'Invite your family', 'Share the 8-letter invite code. Pick roles: parent, adult or student.'],
            ['3', 'Record as you go', 'Add spending in seconds. Kinfold does the maths — splits, budgets, savings rate.'],
          ].map(([n, title, body]) => (
            <div key={n}>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-saffron font-display font-bold text-[#1d1300]">{n}</div>
              <h3 className="mt-3 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-ink-2">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="security" className="border-y border-line bg-surface py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-bold">Private by design</h2>
            <p className="mt-2 text-ink-2">Family money is personal. Kinfold is built so that only the right people see the right numbers.</p>
            <div className="mt-6 flex items-center gap-3 text-sm text-ink-2"><Smartphone size={18} className="text-primary" /> Web app for any browser, plus an Android app.</div>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {[
              [Lock, 'Database-level access rules', 'Every row is checked against your household membership by Postgres Row Level Security.'],
              [ShieldCheck, 'No bank credentials, ever', 'You enter amounts yourself. We never ask for card numbers, PINs or bank logins.'],
              [Check, 'Private entries stay private', 'Personal expenses are hidden from other members at the database level.'],
              [Check, 'Export or delete anytime', 'Download your transactions as CSV, or permanently delete your account in Settings.'],
            ].map(([Icon, title, body]) => {
              const I = Icon as typeof Lock
              return (
                <li key={title as string} className="rounded-[14px] border border-line bg-bg p-4">
                  <I size={18} className="text-primary" />
                  <div className="mt-2 text-sm font-semibold">{title as string}</div>
                  <p className="mt-1 text-[13px] text-ink-2">{body as string}</p>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      <section id="faq" className="py-16">
        <div className="mx-auto max-w-3xl px-5">
          <h2 className="font-display text-3xl font-bold">Questions</h2>
          <div className="mt-6 divide-y divide-line rounded-[16px] border border-line bg-surface">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group px-5 py-4">
                <summary className="cursor-pointer list-none font-semibold marker:hidden">{q}<span className="float-right text-ink-3 transition group-open:rotate-45">+</span></summary>
                <p className="mt-2 text-sm text-ink-2">{a}</p>
              </details>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button size="lg" variant="saffron" onClick={() => router.push('/demo')}>Try the demo</Button>
            <Button size="lg" onClick={() => router.push('/auth/register')}>Create free account</Button>
          </div>
        </div>
      </section>

      <footer className="safe-bottom border-t border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-5 py-8 text-sm text-ink-3">
          <Logo size={24} />
          <span>© {new Date().getFullYear()} Kinfold contributors</span>
          <nav className="ml-auto flex flex-wrap gap-5">
            <Link href="/terms" className="hover:text-ink">Terms</Link>
            <Link href="/privacy" className="hover:text-ink">Privacy</Link>
            <a href={`${REPO_URL}/blob/main/LICENSE`} className="hover:text-ink">MIT licence</a>
            <a href={REPO_URL} className="inline-flex items-center gap-1 hover:text-ink"><Code2 size={14} /> Source</a>
          </nav>
        </div>
      </footer>
    </div>
  )
}
