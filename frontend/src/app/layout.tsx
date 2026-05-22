import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'ManaKhata — Our Household Account',
  description: 'AI-powered collaborative household financial operating system. Manage family finances, track expenses, reimbursements, assets, and get intelligent insights.',
  keywords: 'household finance, family budget, expense tracker, reimbursement, AI financial advisor',
  openGraph: {
    title: 'ManaKhata — Our Household Account',
    description: 'The financial brain of your household.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
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
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
            },
            success: { iconTheme: { primary: '#10b981', secondary: 'white' } },
            error:   { iconTheme: { primary: '#f43f5e', secondary: 'white' } },
          }}
        />
      </body>
    </html>
  )
}
