'use client'

import { useEffect } from 'react'
import { useTheme } from 'next-themes'
import { themeById } from '@/lib/themes'

/**
 * Android-only glue, a no-op in the browser:
 *  - hardware back button navigates back, and exits the app from the dashboard/login
 *  - status bar colour follows the selected theme
 */
export default function NativeBridge() {
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    let remove: (() => void) | undefined
    ;(async () => {
      const { Capacitor } = await import('@capacitor/core')
      if (!Capacitor.isNativePlatform()) return
      const { App } = await import('@capacitor/app')
      const handle = await App.addListener('backButton', () => {
        const path = window.location.pathname.replace(/\/$/, '')
        if (path === '' || path === '/dashboard' || path === '/auth/login') App.exitApp()
        else window.history.back()
      })
      remove = () => { handle.remove() }
    })()
    return () => remove?.()
  }, [])

  useEffect(() => {
    ;(async () => {
      const { Capacitor } = await import('@capacitor/core')
      if (!Capacitor.isNativePlatform()) return
      const { StatusBar, Style } = await import('@capacitor/status-bar')
      const dark = themeById(resolvedTheme)?.dark ?? true
      // Match the status bar to the active theme's background colour.
      const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#0A0E1C'
      await StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light })
      await StatusBar.setBackgroundColor({ color: bg })
    })().catch(() => {})
  }, [resolvedTheme])

  return null
}
