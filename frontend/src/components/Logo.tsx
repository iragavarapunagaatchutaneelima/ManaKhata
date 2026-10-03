// ManaKhata mark: a khata (ledger) page with a saffron margin rule and a rupee sign.
// Same geometry as scripts/generate-icons.mjs, which renders the app icons.
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect x="2" y="2" width="28" height="28" rx="7" fill="var(--primary)" />
      <rect x="7.5" y="8" width="2.6" height="16" rx="1.3" fill="var(--saffron)" />
      <path d="M13 8.5H24.5M13 12.75H24.5M14 8.5h3.25a4.25 4.25 0 0 1 0 8.5H14l8.5 6.5"
        fill="none" stroke="var(--on-primary)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Logo({ size = 32, withText = true }: { size?: number; withText?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark size={size} />
      {withText && (
        <span className="font-display font-extrabold tracking-tight text-ink" style={{ fontSize: size * 0.62 }}>
          Mana<span className="text-primary">Khata</span>
        </span>
      )}
    </span>
  )
}
