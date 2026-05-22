'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'

export function useRequireAuth() {
  const { isAuthenticated, user } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace('/auth/login')
    }
  }, [isAuthenticated, user, router])

  return { user, isAuthenticated }
}

export function useFormatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function useCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    FOOD: '🍽️',
    GROCERIES: '🛒',
    PETROL: '⛽',
    TRAVEL: '✈️',
    RENT: '🏠',
    ELECTRICITY: '⚡',
    INTERNET: '🌐',
    MEDICAL: '🏥',
    SHOPPING: '🛍️',
    EDUCATION: '📚',
    ENTERTAINMENT: '🎬',
    INVESTMENT: '📈',
    SAVINGS: '💰',
    REPAIRS: '🔧',
    MAINTENANCE: '⚙️',
    EMERGENCY: '🚨',
    CLOTHING: '👗',
    PERSONAL_CARE: '💄',
    VEHICLE: '🚗',
    UTILITIES: '💡',
    SUBSCRIPTION: '📱',
    OTHER: '📦',
  }
  return icons[category] || '📦'
}

export function getRoleBadge(role: string): { label: string; className: string } {
  const roles: Record<string, { label: string; className: string }> = {
    HOUSEHEAD:   { label: 'Househead',   className: 'badge-brand' },
    PARENT:      { label: 'Parent',      className: 'badge-gold' },
    ADULT_CHILD: { label: 'Adult',       className: 'badge-emerald' },
    STUDENT:     { label: 'Student',     className: 'badge-muted' },
    GRANDPARENT: { label: 'Grandparent', className: 'badge-gold' },
    GUEST:       { label: 'Guest',       className: 'badge-muted' },
  }
  return roles[role] || { label: role, className: 'badge-muted' }
}

export function getReimbursementStatusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    PENDING:   { label: 'Pending',  className: 'badge-gold' },
    APPROVED:  { label: 'Approved', className: 'badge-brand' },
    SETTLED:   { label: 'Settled',  className: 'badge-emerald' },
    REJECTED:  { label: 'Rejected', className: 'badge-rose' },
    CANCELLED: { label: 'Cancelled', className: 'badge-muted' },
  }
  return map[status] || { label: status, className: 'badge-muted' }
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(dateStr))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function getMonthName(month: number): string {
  return new Date(2000, month - 1).toLocaleString('en-IN', { month: 'long' })
}
