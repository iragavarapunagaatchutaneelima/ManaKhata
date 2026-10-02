import {
  Award, BarChart3, Car, ClipboardCheck, CreditCard, Goal, Home, Landmark, Lightbulb, MessageCircle, PiggyBank, Plane,
  Receipt, RefreshCcw, Settings, ShieldCheck, ShoppingCart, Split, TrendingUp, Users, Wallet, type LucideIcon,
} from 'lucide-react'

export interface NavItem { href: string; label: string; icon: LucideIcon; managerOnly?: boolean; analytics?: boolean }
export interface NavGroup { label: string; items: NavItem[] }

export const NAV: NavGroup[] = [
  { label: 'Overview', items: [
    { href: '/dashboard', label: 'Home', icon: Home },
    { href: '/expenses', label: 'Transactions', icon: Receipt },
    { href: '/budget', label: 'Budgets', icon: PiggyBank },
    { href: '/bills', label: 'Bills', icon: CreditCard },
    { href: '/reports', label: 'Reports', icon: BarChart3, analytics: true },
  ] },
  { label: 'Family', items: [
    { href: '/splits', label: 'Split & settle', icon: Split },
    { href: '/reimbursements', label: 'Reimbursements', icon: RefreshCcw },
    { href: '/wallet', label: 'Pocket money', icon: Wallet },
    { href: '/chores', label: 'Chores', icon: ClipboardCheck },
    { href: '/grocery', label: 'Groceries', icon: ShoppingCart },
    { href: '/chat', label: 'Family chat', icon: MessageCircle },
  ] },
  { label: 'Plan', items: [
    { href: '/goals', label: 'Savings goals', icon: Goal },
    { href: '/trips', label: 'Trips', icon: Plane },
    { href: '/vehicles', label: 'Vehicles', icon: Car },
  ] },
  { label: 'Wealth', items: [
    { href: '/investments', label: 'Investments', icon: TrendingUp },
    { href: '/insurance', label: 'Insurance', icon: ShieldCheck },
    { href: '/tax', label: 'Tax saver', icon: Landmark },
    { href: '/insights', label: 'Insights', icon: Lightbulb, analytics: true },
  ] },
  { label: 'Account', items: [
    { href: '/household', label: 'Household', icon: Users },
    { href: '/achievements', label: 'Achievements', icon: Award },
    { href: '/settings', label: 'Settings', icon: Settings },
  ] },
]

export const ALL_NAV = NAV.flatMap((g) => g.items)
