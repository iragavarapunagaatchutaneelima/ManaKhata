import {
  Baby, Bike, HandHeart, Bus, Car, Dog, Film, Gift, GraduationCap, HeartPulse, Home, Landmark, Plane, Receipt, Repeat, Scissors,
  ShieldCheck, ShoppingBag, ShoppingCart, Utensils, Wifi, Wrench, Zap, type LucideIcon,
} from 'lucide-react'
import { category } from '@/lib/categories'

const ICONS: Record<string, LucideIcon> = {
  GROCERIES: ShoppingCart, RENT: Home, UTILITIES: Zap, INTERNET: Wifi, TRANSPORT: Car, HEALTH: HeartPulse,
  EDUCATION: GraduationCap, INSURANCE: ShieldCheck, HOUSEHOLD: Wrench, KIDS: Baby, FOOD: Utensils, SHOPPING: ShoppingBag,
  ENTERTAINMENT: Film, SUBSCRIPTIONS: Repeat, PERSONAL_CARE: Scissors, TRAVEL: Plane, GIFTS: Gift, PETS: Dog,
  TAXES: Landmark, FAMILY: HandHeart, OTHER: Receipt, BIKE: Bike, BUS: Bus,
}

export function CategoryIcon({ cat, size = 36 }: { cat: string; size?: number }) {
  const Icon = ICONS[cat] ?? Receipt
  const color = category(cat).color
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-[10px]"
      style={{ width: size, height: size, background: `color-mix(in srgb, ${color} 14%, transparent)`, color }}>
      <Icon size={size * 0.5} strokeWidth={2} />
    </span>
  )
}
