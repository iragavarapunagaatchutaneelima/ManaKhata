'use client'

import { motion } from 'framer-motion'

export default function PageTransition({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ type: 'spring', stiffness: 260, damping: 28, mass: 0.82 }}
      className={`w-full h-full will-change-transform ${className}`}
    >
      {children}
    </motion.div>
  )
}
