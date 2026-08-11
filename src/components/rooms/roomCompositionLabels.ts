import type { ElementType } from 'react';
import { BedDouble, BedSingle, Sofa, Bath, ShowerHead, Toilet, Droplet, Home, Sun, Circle } from 'lucide-react';
import { RoomAreaType, RoomItemType } from '../../types/api';

export const AREA_TYPE_LABELS: Record<RoomAreaType, { id: string; en: string }> = {
  BEDROOM: { id: 'Kamar Tidur', en: 'Bedroom' },
  LIVING_ROOM: { id: 'Ruang Tamu', en: 'Living Room' },
  BATHROOM: { id: 'Kamar Mandi', en: 'Bathroom' },
  BALCONY: { id: 'Balkon', en: 'Balcony' },
  OTHER: { id: 'Lainnya', en: 'Other' },
};

export const AREA_TYPE_ICONS: Record<RoomAreaType, ElementType> = {
  BEDROOM: BedDouble,
  LIVING_ROOM: Sofa,
  BATHROOM: Bath,
  BALCONY: Sun,
  OTHER: Home,
};

export const ITEM_TYPE_LABELS: Record<RoomItemType, { id: string; en: string }> = {
  KING_BED: { id: 'Kasur King', en: 'King Bed' },
  QUEEN_BED: { id: 'Kasur Queen', en: 'Queen Bed' },
  DOUBLE_BED: { id: 'Kasur Double', en: 'Double Bed' },
  SINGLE_BED: { id: 'Kasur Single', en: 'Single Bed' },
  SOFA_BED: { id: 'Sofa Bed', en: 'Sofa Bed' },
  SHOWER: { id: 'Shower', en: 'Shower' },
  BATHTUB: { id: 'Bathtub', en: 'Bathtub' },
  TOILET: { id: 'Toilet', en: 'Toilet' },
  SINK: { id: 'Wastafel', en: 'Sink' },
  NONE: { id: '—', en: '—' },
  OTHER: { id: 'Lainnya', en: 'Other' },
};

export const ITEM_TYPE_ICONS: Record<RoomItemType, ElementType> = {
  KING_BED: BedDouble,
  QUEEN_BED: BedDouble,
  DOUBLE_BED: BedDouble,
  SINGLE_BED: BedSingle,
  SOFA_BED: Sofa,
  SHOWER: ShowerHead,
  BATHTUB: Bath,
  TOILET: Toilet,
  SINK: Droplet,
  NONE: Circle,
  OTHER: Circle,
};
