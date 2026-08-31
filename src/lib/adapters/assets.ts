import { Hotel } from '../../types';

// These files ship with the frontend, so a missing API image still renders in
// offline development and production builds without relying on hotlinking.
export const FALLBACK_IMAGES = [
  '/images/seed/hotels/mulia.jpg',
  '/images/seed/hotels/ayana.jpg',
  '/images/seed/hotels/tentrem.jpg',
  '/images/seed/hotels/marriott-medan.jpg',
  '/images/seed/hotels/westin-surabaya.jpg',
  '/images/seed/hotels/oberoi-lombok.jpg',
  '/images/seed/hotels/plataran-borobudur.jpg',
  '/images/seed/hotels/aston-makassar.jpg',
  '/images/seed/hotels/kempinski-jakarta.jpg',
  '/images/seed/hotels/maya-ubud.jpg',
  '/images/seed/hotels/arunika-bandung.png',
  '/images/seed/hotels/samudra-belitung.png',
  '/images/seed/hotels/mahakam-samarinda.png',
  '/images/seed/hotels/tanjung-bunga-manado.png',
  '/images/seed/hotels/pusako-bukittinggi.png',
  '/images/seed/hotels/cendana-kupang.png',
  '/images/seed/hotels/ambon-bay.png',
  '/images/seed/hotels/cenderawasih-jayapura.png',
  '/images/seed/hotels/borneo-pontianak.png',
  '/images/seed/hotels/sriwijaya-palembang.png',
  '/images/seed/hotels/krakatau-lampung.png',
  '/images/seed/hotels/batam-marina.png',
  '/images/seed/hotels/adikara-solo.png',
  '/images/seed/hotels/malang-highland.png',
  '/images/seed/hotels/ijen-banyuwangi.png',
  '/images/seed/hotels/spice-island-ternate.png',
  '/images/seed/hotels/coral-bay-kendari.png',
  '/images/seed/hotels/serambi-aceh.png',
  '/images/seed/hotels/lancang-kuning-pekanbaru.png',
  '/images/seed/hotels/mandalika-sagara.png',
];

export const ROOM_FALLBACK_IMAGES = [
  '/images/seed/rooms/standard-1.jpg',
  '/images/seed/rooms/deluxe-1.jpg',
  '/images/seed/rooms/executive-1.jpg',
  '/images/seed/rooms/suite-1.jpg',
  '/images/seed/rooms/villa-1.jpg',
  '/images/seed/rooms/apartment-1.jpg',
];

export const AVATAR_IMAGES = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80',
];

export const CATEGORY_OPTIONS: Hotel['category'][] = ['Resort', 'Boutique', 'Business', 'Villa', 'Luxury'];

export function hashToIndex(seed: number | string, mod: number): number {
  const str = String(seed);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash % mod;
}
