'use client'

import { useEffect } from 'react'
import { useTheme } from 'next-themes'

/**
 * Android-only glue, a no-op in the browser:
 *  - hardware back button navigates back, and exits the app from the dashboard/login
 *  - status bar colour follows the light/dark theme
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
      const dark = resolvedTheme === 'dark'
      await StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light })
      await StatusBar.setBackgroundColor({ color: dark ? '#0A0E1C' : '#F6F7FB' })
    })().catch(() => {})
  }, [resolvedTheme])

  return null
}
