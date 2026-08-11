import type { ElementType } from 'react';
import { Wifi, Coffee, Waves, Car, Wind, Droplets, Flame } from 'lucide-react';

// Icon mapping untuk amenities populer
export const amenityIconMap: Record<string, ElementType> = {
  'wifi': Wifi,
  'breakfast': Coffee,
  'pool': Waves,
  'parking': Car,
  'ac': Wind,
  'spa': Droplets,
  'gym': Flame,
};

export const getAmenityIcon = (amenity: string): ElementType | null => {
  const key = Object.keys(amenityIconMap).find((k) =>
    amenity.toLowerCase().includes(k)
  );
  return key ? amenityIconMap[key] : null;
};
