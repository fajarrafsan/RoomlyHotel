import { Hotel, HotelFacility } from '../../types';
import { FacilityResponse, HotelResponse } from '../../types/api';
import { FALLBACK_IMAGES, hashToIndex } from './assets';

export interface HotelEnrichment {
  pricePerNight?: number;
  rating?: number;
  reviewsCount?: number;
}

export function mapHotelToUI(h: HotelResponse, enrichment: HotelEnrichment = {}): Hotel {
  const image = h.thumbnailUrl || FALLBACK_IMAGES[hashToIndex(h.id, FALLBACK_IMAGES.length)];
  const location = [h.district, h.city].filter(Boolean).join(', ') || h.city;
  const description = h.description || '';

  return {
    id: String(h.id),
    name: h.name,
    tagline: description.length > 90 ? `${description.slice(0, 90)}…` : description,
    location,
    city: h.city,
    address: h.address,
    coordinates: { lat: h.latitude ?? 0, lng: h.longitude ?? 0 },
    rating: enrichment.rating ?? 0,
    reviewsCount: enrichment.reviewsCount ?? 0,
    pricePerNight: enrichment.pricePerNight ?? 0,
    stars: h.starRating,
    category: h.propertyType === 'VILLA'
      ? 'Villa'
      : h.propertyType === 'APARTMENT'
        ? 'Apartment'
        : 'Hotel',
    image,
    gallery: [image],
    amenities: [],
    description,
    rooms: [],
    reviews: [],

    // Detail fields the API already returns — previously dropped on the floor.
    phone: h.phone || undefined,
    email: h.email || undefined,
    website: h.website || undefined,
    checkInTime: h.checkInTime || undefined,
    checkOutTime: h.checkOutTime || undefined,
    country: h.country || undefined,
    province: h.province || undefined,
    district: h.district || undefined,
    postalCode: h.postalCode || undefined,
  };
}

export function mapFacilityToUI(f: FacilityResponse): HotelFacility {
  return {
    id: String(f.id),
    name: f.name,
    icon: f.icon || undefined,
    category: f.category,
    description: f.description || undefined,
  };
}
