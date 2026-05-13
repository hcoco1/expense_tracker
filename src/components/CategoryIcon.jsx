import {
  Utensils, Bus, Home, Zap, Popcorn, HeartPulse, Dumbbell,
  ShoppingBag, Plane, Briefcase, Laptop, CircleDollarSign,
} from 'lucide-react'

const iconMap = {
  utensils: Utensils,
  bus: Bus,
  home: Home,
  zap: Zap,
  bolt: Zap,
  popcorn: Popcorn,
  'heart-pulse': HeartPulse,
  dumbbell: Dumbbell,
  'shopping-bag': ShoppingBag,
  plane: Plane,
  briefcase: Briefcase,
  'briefcase-business': Briefcase,
  laptop: Laptop,
  'circle-dollar-sign': CircleDollarSign,
}

export default function CategoryIcon({ icon, size = 18 }) {
  const Icon = iconMap[icon] || CircleDollarSign
  return <Icon size={size} />
}
