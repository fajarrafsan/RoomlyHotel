import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Hotel, RoomType } from '../../types';

export type ExploreSort = 'recommended' | 'price-asc' | 'price-desc' | 'rating';

export interface ExploreFilterCriteria {
  searchQuery: string;
  selectedCity: string;
  selectedCategory: string;
  minRating: number;
  maxPrice: number | null;
  minGuests: number;
  minStars: number;
  sortBy: ExploreSort;
}

const CATEGORY_BY_PROPERTY_TYPE: Record<string, string> = {
  HOTEL: 'Hotel', VILLA: 'Villa', APARTMENT: 'Apartment',
};

const positivePrice = (price: number) => Number.isFinite(price) && price > 0;
const normalize = (value?: string) => (value || '').trim().toLocaleLowerCase();

export function getCatalogMaxPrice(hotels: Hotel[]): number {
  const prices = hotels.flatMap(hotel => [hotel.pricePerNight, ...hotel.rooms.map(room => room.pricePerNight)]).filter(positivePrice);
  return prices.length ? Math.ceil(Math.max(...prices) / 100_000) * 100_000 : 1_000_000;
}

/** Keeps the full room catalog while exposing the room that actually fits a search. */
export function filterHotelCatalog(hotels: Hotel[], criteria: ExploreFilterCriteria) {
  const query = normalize(criteria.searchQuery);
  const city = normalize(criteria.selectedCity);
  const roomFiltersActive = criteria.maxPrice !== null || criteria.minGuests > 0;
  const matchingRoomsByHotel: Record<string, RoomType> = {};
  const categoryCounts: Record<string, number> = { ALL: 0, Hotel: 0, Villa: 0, Apartment: 0 };
  const matching = hotels.filter(hotel => {
    if (city && city !== 'semua kota' && city !== 'all cities'
      && !normalize(hotel.city).includes(city) && !normalize(hotel.province).includes(city)) return false;
    if (query && ![hotel.name, hotel.location, hotel.city, hotel.province, hotel.district]
      .some(value => normalize(value).includes(query))) return false;
    if (criteria.minStars > 0 && (!Number.isFinite(hotel.stars) || hotel.stars < criteria.minStars)) return false;
    if (criteria.minRating > 0
      && (!(hotel.reviewsCount > 0) || !Number.isFinite(hotel.rating) || hotel.rating < criteria.minRating)) return false;

    const eligibleRooms = hotel.rooms.filter(room => {
      if (criteria.minGuests > 0 && (!Number.isFinite(room.maxOccupancy) || room.maxOccupancy < criteria.minGuests)) return false;
      if (criteria.maxPrice !== null && (!positivePrice(room.pricePerNight) || room.pricePerNight > criteria.maxPrice)) return false;
      return true;
    });
    if (roomFiltersActive && !eligibleRooms.length) {
      // A known catalog price can still support a price-only filter before room
      // details load. Capacity can never be inferred from a hotel's base price.
      if (criteria.minGuests > 0 || hotel.rooms.length || criteria.maxPrice === null
        || !positivePrice(hotel.pricePerNight) || hotel.pricePerNight > criteria.maxPrice) return false;
    }
    const preview = eligibleRooms.reduce<RoomType | undefined>((best, room) => {
      if (!best) return room;
      if (!positivePrice(room.pricePerNight)) return best;
      return !positivePrice(best.pricePerNight) || room.pricePerNight < best.pricePerNight ? room : best;
    }, undefined);
    if (preview) matchingRoomsByHotel[hotel.id] = preview;
    categoryCounts.ALL += 1;
    categoryCounts[hotel.category] = (categoryCounts[hotel.category] || 0) + 1;
    return true;
  });

  const currentPrice = (hotel: Hotel): number | null => {
    const room = matchingRoomsByHotel[hotel.id];
    if (room) return positivePrice(room.pricePerNight) ? room.pricePerNight : null;
    return positivePrice(hotel.pricePerNight) ? hotel.pricePerNight : null;
  };
  const filteredHotels = matching.filter(hotel => criteria.selectedCategory === 'ALL' || hotel.category === criteria.selectedCategory)
    .sort((a, b) => {
      if (criteria.sortBy === 'price-asc' || criteria.sortBy === 'price-desc') {
        const aPrice = currentPrice(a);
        const bPrice = currentPrice(b);
        if (aPrice === null || bPrice === null) return aPrice === bPrice ? 0 : aPrice === null ? 1 : -1;
        return criteria.sortBy === 'price-asc' ? aPrice - bPrice : bPrice - aPrice;
      }
      if (criteria.sortBy === 'rating') {
        const aRating = a.reviewsCount > 0 && Number.isFinite(a.rating) ? a.rating : 0;
        const bRating = b.reviewsCount > 0 && Number.isFinite(b.rating) ? b.rating : 0;
        return bRating - aRating;
      }
      return 0;
    });

  return { filteredHotels, matchingRoomsByHotel, categoryCounts };
}

export function useHotelFilters(
  hotels: Hotel[],
  searchQuery: string,
  selectedCity: string,
  onSearchQueryChange: (query: string) => void,
  onSelectCity: (city: string) => void,
) {
  const [searchParams, setSearchParams] = useSearchParams();
  const propertyType = searchParams.get('propertyType') || '';
  const selectedCategory = Object.hasOwn(CATEGORY_BY_PROPERTY_TYPE, propertyType) ? CATEGORY_BY_PROPERTY_TYPE[propertyType] : 'ALL';
  const setSelectedCategory = (category: string) => {
    const nextType = Object.keys(CATEGORY_BY_PROPERTY_TYPE).find(type => CATEGORY_BY_PROPERTY_TYPE[type] === category);
    if ((searchParams.get('propertyType') ?? undefined) === nextType) return;
    setSearchParams(current => {
      const next = new URLSearchParams(current);
      if (nextType) next.set('propertyType', nextType);
      else next.delete('propertyType');
      return next;
    });
  };
  const [minRating, setMinRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [minGuests, setMinGuests] = useState(0);
  const [minStars, setMinStars] = useState(0);
  const [sortBy, setSortBy] = useState<ExploreSort>('recommended');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const { filteredHotels, matchingRoomsByHotel, categoryCounts } = filterHotelCatalog(hotels, {
    searchQuery, selectedCity, selectedCategory, minRating, maxPrice, minGuests, minStars, sortBy,
  });
  const catalogMaxPrice = getCatalogMaxPrice(hotels);
  const activeFilterCount = [selectedCategory !== 'ALL', minRating > 0, maxPrice !== null, minGuests > 0, minStars > 0,
    !!normalize(selectedCity), !!normalize(searchQuery)].filter(Boolean).length;
  const hasActiveFilters = activeFilterCount > 0 || sortBy !== 'recommended';

  const resetFilters = () => {
    setSelectedCategory('ALL');
    setMinRating(0);
    setMaxPrice(null);
    setMinGuests(0);
    setMinStars(0);
    onSelectCity('');
    onSearchQueryChange('');
    setSortBy('recommended');
  };

  return {
    selectedCategory, setSelectedCategory, minRating, setMinRating, maxPrice, setMaxPrice,
    minGuests, setMinGuests, minStars, setMinStars, sortBy, setSortBy,
    showAdvancedFilters, setShowAdvancedFilters, filteredHotels, matchingRoomsByHotel,
    resetFilters, hasActiveFilters, activeFilterCount, catalogMaxPrice, categoryCounts,
  };
}
