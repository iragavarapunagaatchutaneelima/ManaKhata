'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { create } from 'zustand'
import { Loader2, X } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { formatMoney } from '@/lib/money'

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

// ── Button ───────────────────────────────────────────────────────────────────

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'saffron'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-strong shadow-sm',
  saffron: 'bg-saffron text-[#1d1300] hover:brightness-95 shadow-sm',
  secondary: 'bg-surface text-ink border border-line-strong hover:bg-surface-2',
  ghost: 'text-ink-2 hover:bg-surface-2 hover:text-ink',
  danger: 'bg-negative text-white hover:brightness-95',
}

export function Button({
  variant = 'primary', size = 'md', loading, icon, children, className, disabled, ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' | 'lg'; loading?: boolean; icon?: ReactNode }) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold transition disabled:opacity-55 disabled:cursor-not-allowed select-none whitespace-nowrap',
        size === 'sm' ? 'h-9 px-3 text-[13px]' : size === 'lg' ? 'h-12 px-6 text-[15px]' : 'h-10 px-4 text-sm',
        VARIANTS[variant], className,
      )}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : icon}
      {children}
    </button>
  )
}

export function IconButton({ label, children, className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button {...rest} aria-label={label} title={label}
      className={cx('inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-ink-2 hover:bg-surface-2 hover:text-ink transition disabled:opacity-40', className)}>
      {children}
    </button>
  )
}

// ── Layout ───────────────────────────────────────────────────────────────────

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-[26px] font-bold leading-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-3">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Card({ children, className, fold, ...rest }: React.HTMLAttributes<HTMLDivElement> & { fold?: boolean }) {
  return <div {...rest} className={cx('card', fold && 'card-fold', className)}>{children}</div>
}

export function CardHeader({ title, subtitle, action }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[13px] text-ink-3">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function Stat({ label, value, hint, tone, icon }: { label: string; value: ReactNode; hint?: ReactNode; tone?: 'positive' | 'negative' | 'primary' | 'saffron'; icon?: ReactNode }) {
  const toneClass = tone === 'positive' ? 'text-positive' : tone === 'negative' ? 'text-negative' : tone === 'primary' ? 'text-primary' : tone === 'saffron' ? 'text-saffron-ink' : 'text-ink'
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2 text-[13px] font-medium text-ink-3">
        <span>{label}</span>
        {icon && <span className="text-ink-3">{icon}</span>}
      </div>
      <div className={cx('mt-2 font-display text-[22px] sm:text-2xl font-bold leading-none', toneClass)}>{value}</div>
      {hint && <div className="mt-2 text-[12.5px] text-ink-3">{hint}</div>}
    </Card>
  )
}

export function Badge({ tone = 'neutral', children, className }: { tone?: 'neutral' | 'primary' | 'positive' | 'negative' | 'warning' | 'saffron'; children: ReactNode; className?: string }) {
  const t = {
    neutral: 'bg-surface-3 text-ink-2',
    primary: 'bg-primary-soft text-primary',
    positive: 'bg-positive-soft text-positive',
    negative: 'bg-negative-soft text-negative',
    warning: 'bg-warning-soft text-warning',
    saffron: 'bg-saffron-soft text-saffron-ink',
  }[tone]
  return <span className={cx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-semibold', t, className)}>{children}</span>
}

export function Money({ amount, currency = 'INR', tone = 'none', decimals, sign, className }: { amount: number; currency?: string; tone?: 'auto' | 'in' | 'out' | 'none'; decimals?: boolean; sign?: boolean; className?: string }) {
  const color = tone === 'in' ? 'text-positive' : tone === 'out' ? 'text-ink' : tone === 'auto' ? (amount < 0 ? 'text-negative' : amount > 0 ? 'text-positive' : 'text-ink') : ''
  const value = tone === 'out' ? -Math.abs(amount) : amount
  return <span className={cx('tabular-nums', color, className)}>{formatMoney(value, currency, { decimals, sign: sign ?? tone === 'in' })}</span>
}

export function Progress({ value, tone = 'primary', className }: { value: number; tone?: 'primary' | 'positive' | 'warning' | 'negative' | 'saffron'; className?: string }) {
  const color = { primary: 'bg-primary', positive: 'bg-positive', warning: 'bg-warning', negative: 'bg-negative', saffron: 'bg-saffron' }[tone]
  return (
    <div className={cx('h-2 w-full overflow-hidden rounded-full bg-surface-3', className)} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cx('h-full rounded-full transition-[width] duration-500', color)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  )
}

export function Avatar({ name, size = 32, className }: { name: string; size?: number; className?: string }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '?'
  const palette = ['#3B4BC8', '#E59A1C', '#16855A', '#C2562E', '#6C5BD4', '#2E7BC4', '#B4519E']
  const color = palette[[...name].reduce((h, c) => h + c.charCodeAt(0), 0) % palette.length]
  return (
    <span className={cx('inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white', className)}
      style={{ width: size, height: size, fontSize: size * 0.38, background: color }} aria-hidden="true">
      {initials}
    </span>
  )
}

export function EmptyState({ icon, title, body, action }: { icon?: ReactNode; title: string; body?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      {icon && <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">{icon}</div>}
      <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
      {body && <p className="mt-1 max-w-sm text-sm text-ink-3">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('skeleton', className)} />
}

export function PageSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-56" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}</div>
      <Skeleton className="h-72" />
    </div>
  )
}

// ── Forms ────────────────────────────────────────────────────────────────────

export function Field({ label, hint, error, children, className }: { label: string; hint?: ReactNode; error?: string | null; children: ReactNode; className?: string }) {
  return (
    <label className={cx('block', className)}>
      <span className="mb-1.5 block text-[13px] font-semibold text-ink-2">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-[12.5px] text-negative">{error}</span> : hint ? <span className="mt-1 block text-[12.5px] text-ink-3">{hint}</span> : null}
    </label>
  )
}

export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={() => onChange(!checked)}
      className={cx('relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:opacity-50', checked ? 'bg-primary' : 'bg-surface-3 border border-line-strong')}>
      <span className={cx('inline-block h-5 w-5 rounded-full bg-white shadow transition', checked ? 'translate-x-[22px]' : 'translate-x-[2px]')} />
    </button>
  )
}

export function Segmented<T extends string>({ value, onChange, options, className }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; className?: string }) {
  return (
    <div className={cx('inline-flex rounded-[10px] border border-line bg-surface-2 p-0.5', className)} role="tablist">
      {options.map((o) => (
        <button key={o.value} type="button" role="tab" aria-selected={value === o.value} onClick={() => onChange(o.value)}
          className={cx('rounded-[8px] px-3 py-1.5 text-[13px] font-semibold transition', value === o.value ? 'bg-surface text-ink shadow-sm' : 'text-ink-3 hover:text-ink')}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

// ── Modal ────────────────────────────────────────────────────────────────────

export function Modal({ open, onClose, title, description, children, footer, wide }: {
  open: boolean; onClose: () => void; title: string; description?: ReactNode; children: ReactNode; footer?: ReactNode; wide?: boolean
}) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#0A0E1C]/50 backdrop-blur-[2px]" />
        <Dialog.Content
          className={cx(
            'fixed z-50 flex max-h-[92dvh] w-full flex-col bg-surface shadow-[var(--shadow-lg)] outline-none',
            'bottom-0 left-0 rounded-t-[20px] sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[18px]',
            wide ? 'sm:max-w-2xl' : 'sm:max-w-lg',
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
            <div>
              <Dialog.Title className="font-display text-[17px] font-bold text-ink">{title}</Dialog.Title>
              {description ? <Dialog.Description className="mt-0.5 text-[13px] text-ink-3">{description}</Dialog.Description> : <Dialog.Description className="sr-only">{title}</Dialog.Description>}
            </div>
            <Dialog.Close asChild><IconButton label="Close"><X size={18} /></IconButton></Dialog.Close>
          </div>
          <div className="scrollbar-thin overflow-y-auto px-5 py-4">{children}</div>
          {footer && <div className="safe-bottom flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// ── Confirm (promise-based) ──────────────────────────────────────────────────

interface ConfirmRequest { title: string; body?: string; confirmLabel?: string; danger?: boolean; resolve: (ok: boolean) => void }
const useConfirmStore = create<{ req: ConfirmRequest | null }>(() => ({ req: null }))

export function confirmAction(opts: Omit<ConfirmRequest, 'resolve'>): Promise<boolean> {
  return new Promise((resolve) => useConfirmStore.setState({ req: { ...opts, resolve } }))
}

export function ConfirmHost() {
  const req = useConfirmStore((s) => s.req)
  const close = (ok: boolean) => { req?.resolve(ok); useConfirmStore.setState({ req: null }) }
  return (
    <Modal open={!!req} onClose={() => close(false)} title={req?.title ?? ''}
      footer={<>
        <Button variant="secondary" onClick={() => close(false)}>Cancel</Button>
        <Button variant={req?.danger ? 'danger' : 'primary'} onClick={() => close(true)}>{req?.confirmLabel ?? 'Confirm'}</Button>
      </>}>
      <p className="text-sm text-ink-2">{req?.body}</p>
    </Modal>
  )
}
