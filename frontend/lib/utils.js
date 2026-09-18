import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  Shirt, ShoppingBag, Baby, Sparkles, Dumbbell, Swords, HardHat, Stethoscope,
  ShieldAlert, Briefcase, Trophy, Bike, Tent, Fish, CloudRain, Layers, Dog,
  Gift, Moon, Watch, Package, Tag, Star, Heart, Zap, Globe, Box, Truck, Award,
} from 'lucide-react';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatPrice(min, max, currency = '$') {
  if (!min && !max) return 'Price on request';
  if (min === max) return `${currency}${Number(min).toLocaleString()}`;
  return `${currency}${Number(min).toLocaleString()} – ${currency}${Number(max).toLocaleString()}`;
}

export function truncate(str, length = 120) {
  if (!str) return '';
  return str.length > length ? str.slice(0, length) + '...' : str;
}

export function titleCase(str = '') {
  if (!str) return str;
  return str.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

export function getInitials(name = '') {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export const CATEGORIES = [
  "Men's Apparel",
  "Women's Apparel",
  "Kids' Apparel",
  'Fashion Wear & Streetwear',
  'Sportswear',
  'Martial Arts Wear',
  'Workwear & Uniforms',
  'Medical Apparel',
  'Safety Wear',
  'Leather Products',
  'Championship Belts',
  'Motorcycle Apparel',
  'Tactical & Outdoor Wear',
  'Hunting & Fishing Apparel',
  'Rainwear',
  'Denim Wear',
  'Pet Apparel',
  'Promotional Merchandise',
  'Sleepwear',
  'Accessories',
];

// Icon lookup by name string (used for dynamic categories from the DB)
export const CATEGORY_ICONS = {
  // Default 20 categories
  "Men's Apparel": Shirt,
  "Women's Apparel": ShoppingBag,
  "Kids' Apparel": Baby,
  'Fashion Wear & Streetwear': Sparkles,
  Sportswear: Dumbbell,
  'Martial Arts Wear': Swords,
  'Workwear & Uniforms': HardHat,
  'Medical Apparel': Stethoscope,
  'Safety Wear': ShieldAlert,
  'Leather Products': Briefcase,
  'Championship Belts': Trophy,
  'Motorcycle Apparel': Bike,
  'Tactical & Outdoor Wear': Tent,
  'Hunting & Fishing Apparel': Fish,
  Rainwear: CloudRain,
  'Denim Wear': Layers,
  'Pet Apparel': Dog,
  'Promotional Merchandise': Gift,
  Sleepwear: Moon,
  Accessories: Watch,
  // Icon name → component mapping (for admin icon picker)
  Package, Shirt, ShoppingBag, Baby, Sparkles, Dumbbell, Swords, HardHat,
  Stethoscope, ShieldAlert, Briefcase, Trophy, Bike, Tent, Fish, CloudRain,
  Layers, Dog, Gift, Moon, Watch, Tag, Star, Heart, Zap, Globe, Box, Truck, Award,
};
