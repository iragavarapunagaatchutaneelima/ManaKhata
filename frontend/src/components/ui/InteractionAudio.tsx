'use client'

import { useEffect, useRef } from 'react'

export default function InteractionAudio() {
  const audioContextRef = useRef<AudioContext | null>(null)
  const lastPlayedRef = useRef(0)

  useEffect(() => {
    const playClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (!target?.closest('button, a, [role="button"], input, select, textarea')) return

      const now = performance.now()
      if (now - lastPlayedRef.current < 55) return
      lastPlayedRef.current = now

      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AudioContextClass) return

      const context = audioContextRef.current ?? new AudioContextClass()
      audioContextRef.current = context

      const oscillator = context.createOscillator()
      const gain = context.createGain()

      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(620, context.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(980, context.currentTime + 0.035)

      gain.gain.setValueAtTime(0.0001, context.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.035, context.currentTime + 0.008)
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.055)

      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.start()
      oscillator.stop(context.currentTime + 0.06)
    }

    window.addEventListener('pointerup', playClick, { passive: true })
    return () => window.removeEventListener('pointerup', playClick)
  }, [])

  return null
}
