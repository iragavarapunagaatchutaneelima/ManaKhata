// Kinfold mark: a square with its top-right corner folded over in saffron,
// like the corner of a page you want to come back to.
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <path d="M6 2h14l10 10v14a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4Z" fill="var(--primary)" />
      <path d="M20 2v6a4 4 0 0 0 4 4h6L20 2Z" fill="var(--saffron)" />
      <path d="M9 10v12M9 16l7-6M11.5 14l5 8" stroke="var(--on-primary)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

export function Logo({ size = 32, withText = true }: { size?: number; withText?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark size={size} />
      {withText && <span className="font-display font-extrabold tracking-tight text-ink" style={{ fontSize: size * 0.62 }}>Kinfold</span>}
    </span>
  )
}
