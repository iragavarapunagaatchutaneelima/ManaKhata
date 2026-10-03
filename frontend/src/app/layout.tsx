import type { Metadata, Viewport } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Toaster } from 'react-hot-toast'
import NativeBridge from '@/components/NativeBridge'
import AppBoot from '@/components/AppBoot'
import { DEFAULT_THEME, THEME_IDS } from '@/lib/themes'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta', display: 'swap', weight: ['500', '600', '700', '800'] })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#0A0E1C',
}

export const metadata: Metadata = {
  title: { default: 'ManaKhata — the family money app', template: '%s · ManaKhata' },
  description: 'ManaKhata brings your household’s money into one shared place: expenses, budgets, bills, splits, pocket money, goals and insights for the whole family.',
  applicationName: 'ManaKhata',
  keywords: ['family budget', 'household expenses', 'expense sharing', 'split bills', 'pocket money', 'India', 'personal finance'],
  openGraph: {
    title: 'ManaKhata — the family money app',
    description: "Your family's money, in one shared khata.",
    type: 'website',
    siteName: 'ManaKhata',
  },
  manifest: '/manifest.json',
  icons: { icon: '/icon-192x192.png', apple: '/apple-touch-icon.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${jakarta.variable}`}>
      <body>
        <ThemeProvider attribute="data-theme" themes={THEME_IDS} defaultTheme={DEFAULT_THEME} enableSystem disableTransitionOnChange storageKey="manakhata.theme">
          <NativeBridge />
          <AppBoot />
          {children}
        </ThemeProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3500,
            style: {
              background: 'var(--surface)',
              color: 'var(--ink)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              fontSize: '14px',
              boxShadow: 'var(--shadow-lg)',
            },
            success: { iconTheme: { primary: 'var(--positive)', secondary: 'var(--surface)' } },
            error: { iconTheme: { primary: 'var(--negative)', secondary: 'var(--surface)' } },
          }}
        />
      </body>
    </html>
  )
}
