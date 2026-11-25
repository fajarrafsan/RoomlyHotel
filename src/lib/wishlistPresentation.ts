import type { Hotel, RoomType } from '../types';

export type WishlistSort = 'recent' | 'price-asc' | 'price-desc' | 'rating';

/** The price and room preview must describe the same actual room. */
export function getWishlistPriceRoom(hotel: Hotel): RoomType | undefined {
  return hotel.rooms.reduce<RoomType | undefined>((lowest, room) => {
    if (!Number.isFinite(room.pricePerNight) || room.pricePerNight <= 0) return lowest;
    return !lowest || room.pricePerNight < lowest.pricePerNight ? room : lowest;
  }, undefined);
}

export function getWishlistPrice(hotel: Hotel): number | null {
  const amount = getWishlistPriceRoom(hotel)?.pricePerNight ?? hotel.pricePerNight;
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function savedTime(value?: string): number | null {
  if (!value) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}

function reviewedRating(hotel: Hotel): number | null {
  return Number.isFinite(hotel.rating) && hotel.rating > 0 && hotel.rating <= 5
    && Number.isFinite(hotel.reviewsCount) && hotel.reviewsCount > 0 ? hotel.rating : null;
}

/** Missing prices, review scores, and dates remain last in either sort direction. */
export function sortWishlistHotels(hotels: Hotel[], sort: WishlistSort, savedAt: Record<string, string>): Hotel[] {
  return hotels.map((hotel, index) => ({ hotel, index })).sort((a, b) => {
    const left = sort === 'recent' ? savedTime(savedAt[a.hotel.id])
      : sort === 'rating' ? reviewedRating(a.hotel) : getWishlistPrice(a.hotel);
    const right = sort === 'recent' ? savedTime(savedAt[b.hotel.id])
      : sort === 'rating' ? reviewedRating(b.hotel) : getWishlistPrice(b.hotel);
    if (left === null && right === null) return a.index - b.index;
    if (left === null) return 1;
    if (right === null) return -1;
    const difference = sort === 'price-asc' ? left - right : right - left;
    return difference || a.index - b.index;
  }).map(item => item.hotel);
}
