// Spending categories, modelled on what Indian households actually track.
// `color` feeds charts (works on both light and dark backgrounds).

export interface CategoryDef {
  key: string
  label: string
  color: string
  /** Counts as everyday spending (investments/transfers would not). */
  essential: boolean
}

export const CATEGORIES: CategoryDef[] = [
  { key: 'GROCERIES',     label: 'Groceries',          color: '#3B4BC8', essential: true },
  { key: 'RENT',          label: 'Rent & EMI',         color: '#E59A1C', essential: true },
  { key: 'UTILITIES',     label: 'Utilities',          color: '#2F8F83', essential: true },
  { key: 'INTERNET',      label: 'Phone & internet',   color: '#6C5BD4', essential: true },
  { key: 'TRANSPORT',     label: 'Fuel & transport',   color: '#C2562E', essential: true },
  { key: 'HEALTH',        label: 'Health',             color: '#D0436A', essential: true },
  { key: 'EDUCATION',     label: 'Education',          color: '#2E7BC4', essential: true },
  { key: 'INSURANCE',     label: 'Insurance',          color: '#5E7A2E', essential: true },
  { key: 'HOUSEHOLD',     label: 'Home & repairs',     color: '#8A6A3B', essential: true },
  { key: 'KIDS',          label: 'Kids',               color: '#B4519E', essential: true },
  { key: 'FOOD',          label: 'Dining out',         color: '#E07B39', essential: false },
  { key: 'SHOPPING',      label: 'Shopping',           color: '#9B59B6', essential: false },
  { key: 'ENTERTAINMENT', label: 'Entertainment',      color: '#1F9BB4', essential: false },
  { key: 'SUBSCRIPTIONS', label: 'Subscriptions',      color: '#5468D4', essential: false },
  { key: 'PERSONAL_CARE', label: 'Personal care',      color: '#C77DBA', essential: false },
  { key: 'TRAVEL',        label: 'Travel',             color: '#1E8F5A', essential: false },
  { key: 'FAMILY',        label: 'Family support',     color: '#A0522D', essential: true },
  { key: 'GIFTS',         label: 'Gifts & donations',  color: '#D4A017', essential: false },
  { key: 'PETS',          label: 'Pets',               color: '#7A6F5B', essential: false },
  { key: 'TAXES',         label: 'Taxes & fees',       color: '#6B7280', essential: true },
  { key: 'OTHER',         label: 'Other',              color: '#8A90A6', essential: false },
]

const BY_KEY = new Map(CATEGORIES.map((c) => [c.key, c]))

export const category = (key: string): CategoryDef =>
  BY_KEY.get(key) ?? { key, label: key.charAt(0) + key.slice(1).toLowerCase().replace(/_/g, ' '), color: '#8A90A6', essential: false }

export const INCOME_SOURCES = ['Salary', 'Business', 'Freelance', 'Rent received', 'Interest', 'Dividends', 'Pension', 'Gift', 'Refund', 'Other']

export const PAYMENT_METHODS = [
  { key: 'UPI', label: 'UPI' },
  { key: 'CARD', label: 'Card' },
  { key: 'CASH', label: 'Cash' },
  { key: 'BANK', label: 'Bank transfer' },
  { key: 'WALLET', label: 'Family wallet' },
  { key: 'OTHER', label: 'Other' },
] as const

export const ROLE_LABELS: Record<string, string> = {
  HOUSEHEAD: 'Head',
  PARENT: 'Parent',
  ADULT_CHILD: 'Adult',
  STUDENT: 'Student',
}

export const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'AUD', 'CAD', 'JPY', 'THB', 'CHF', 'NZD']
