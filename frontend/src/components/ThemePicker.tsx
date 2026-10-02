'use client'

import { useSyncExternalStore } from 'react'
import { useTheme } from 'next-themes'
import { Check, Monitor } from 'lucide-react'
import { THEMES } from '@/lib/themes'
import { cx } from './ui'

const subscribe = () => () => {}
/** true only after hydration, so the selected state never mismatches the server HTML. */
const useHydrated = () => useSyncExternalStore(subscribe, () => true, () => false)

export function ThemePicker({ onPicked }: { onPicked?: () => void }) {
  const { theme, setTheme } = useTheme()
  const hydrated = useHydrated()
  const current = hydrated ? theme ?? 'dark' : null
  const pick = (id: string) => { setTheme(id); onPicked?.() }

  return (
    <div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {THEMES.map((t) => {
          const active = current === t.id
          return (
            <button key={t.id} type="button" onClick={() => pick(t.id)} aria-pressed={active}
              className={cx('group overflow-hidden rounded-[14px] border-2 text-left transition',
                active ? 'border-primary' : 'border-line hover:border-line-strong')}>
              {/* Mini preview of the theme */}
              <div className="flex h-16 gap-1.5 p-2" style={{ background: t.swatch[0] }}>
                <div className="flex flex-1 flex-col justify-between rounded-[7px] p-1.5" style={{ background: t.swatch[1] }}>
                  <div className="h-1.5 w-8 rounded-full" style={{ background: t.swatch[2] }} />
                  <div className="flex gap-1">
                    <div className="h-3 w-6 rounded-[4px]" style={{ background: t.swatch[2] }} />
                    <div className="h-3 w-3 rounded-[4px]" style={{ background: t.swatch[3] }} />
                  </div>
                </div>
                <div className="w-3 rounded-[5px]" style={{ background: t.swatch[3] }} />
              </div>
              <div className="flex items-center justify-between gap-2 bg-surface px-3 py-2">
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-semibold text-ink">{t.name}</div>
                  <div className="truncate text-[11.5px] text-ink-3">{t.dark ? 'Dark' : 'Light'}{t.id === 'dark' && ' · default'}</div>
                </div>
                {active && <Check size={16} className="shrink-0 text-primary" />}
              </div>
            </button>
          )
        })}
      </div>
      <button type="button" onClick={() => pick('system')}
        className={cx('mt-2.5 flex w-full items-center gap-3 rounded-[12px] border-2 px-3 py-2.5 text-left transition',
          current === 'system' ? 'border-primary' : 'border-line hover:border-line-strong')}>
        <Monitor size={18} className="text-ink-2" />
        <div className="flex-1">
          <div className="text-[13px] font-semibold text-ink">Match my device</div>
          <div className="text-[11.5px] text-ink-3">Midnight when your phone or computer is in dark mode, Daylight otherwise</div>
        </div>
        {current === 'system' && <Check size={16} className="text-primary" />}
      </button>
    </div>
  )
}
