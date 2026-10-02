'use client'

import { motion } from 'framer-motion'

// Opacity-only on purpose: a transform (or will-change: transform) here would become
// the containing block for every `position: fixed` dialog inside the page, so modals
// opened on a scrolled page rendered off-screen.
export default function PageTransition({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={`w-full h-full ${className}`}
    >
      {children}
    </motion.div>
  )
}
