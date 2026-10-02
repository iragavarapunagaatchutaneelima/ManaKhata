import type { Metadata, Viewport } from 'next'
import { Inter, Fraunces } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Toaster } from 'react-hot-toast'
import NativeBridge from '@/components/NativeBridge'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

// Serif for headings: gives the plain "ledger book" feel without decoration.
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  weight: ['500', '600', '700'],
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f2ea' },
    { media: '(prefers-color-scheme: dark)', color: '#141714' },
  ],
}

export const metadata: Metadata = {
  title: 'ManaKhata — Our Household Account',
  description: 'AI-powered collaborative household financial operating system. Manage family finances, track expenses, reimbursements, assets, and get intelligent insights.',
  keywords: 'household finance, family budget, expense tracker, reimbursement, AI financial advisor, India',
  openGraph: {
    title: 'ManaKhata — Our Household Account',
    description: 'The financial brain of your household.',
    type: 'website',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="premium-surface antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
        >
          <NativeBridge />
          {children}
        </ThemeProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '500',
            },
            success: { iconTheme: { primary: '#1f7a57', secondary: 'white' } },
            error:   { iconTheme: { primary: '#b3261e', secondary: 'white' } },
          }}
        />
      </body>
    </html>
  )
}
