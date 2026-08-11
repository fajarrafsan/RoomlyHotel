import type { ElementType } from 'react';
import {
  Wifi, Wind, Bath, Coffee, UtensilsCrossed, Sparkles, Building2, Dumbbell,
  ArrowUpDown, ShieldAlert, Gamepad2, Trees, Zap, Refrigerator, Film, Waves,
  Droplets, Shirt, ConciergeBell, Lock, ShieldCheck, ShowerHead, AlertTriangle,
  Package, Tv, Accessibility, Laptop
} from 'lucide-react';
import { AmenityGroup } from '../../types/api';

// Keyed by the exact `icon` string room-service returns per amenity.
export const ROOM_AMENITY_ICON_MAP: Record<string, ElementType> = {
  'wifi': Wifi,
  'air-cond': Wind,
  'bathtub': Bath,
  'breakfast': UtensilsCrossed,
  'broom': Sparkles,
  'city-view': Building2,
  'coffee': Coffee,
  'desk': Laptop,
  'dumbbell': Dumbbell,
  'elevator': ArrowUpDown,
  'fire-ext': ShieldAlert,
  'games': Gamepad2,
  'garden-view': Trees,
  'hair-dryer': Zap,
  'minibar': Refrigerator,
  'netflix': Film,
  'ocean-view': Waves,
  'pool': Droplets,
  'pool-view': Waves,
  'robe': Shirt,
  'room-service': ConciergeBell,
  'safe': Lock,
  'security': ShieldCheck,
  'shower': ShowerHead,
  'smoke': AlertTriangle,
  'toiletries': Package,
  'tv': Tv,
  'wheelchair': Accessibility,
};

export function getRoomAmenityIcon(icon: string): ElementType {
  return ROOM_AMENITY_ICON_MAP[icon] || Sparkles;
}

export const AMENITY_GROUP_LABELS: Record<AmenityGroup, { id: string; en: string }> = {
  TOP: { id: 'Unggulan', en: 'Top Amenities' },
  ROOM: { id: 'Kamar', en: 'Room' },
  BATHROOM: { id: 'Kamar Mandi', en: 'Bathroom' },
  VIEW: { id: 'Pemandangan', en: 'View' },
  FOOD: { id: 'Makanan & Minuman', en: 'Food & Drink' },
  ACCESSIBILITY: { id: 'Aksesibilitas', en: 'Accessibility' },
  SAFETY: { id: 'Keamanan', en: 'Safety' },
  ENTERTAINMENT: { id: 'Hiburan', en: 'Entertainment' },
};
