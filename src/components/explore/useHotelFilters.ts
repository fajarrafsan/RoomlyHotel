import { useState } from 'react';
import { Hotel } from '../../types';

export type ExploreSort = 'recommended' | 'price-asc' | 'price-desc' | 'rating';

export function useHotelFilters(
  hotels: Hotel[],
  searchQuery: string,
  selectedCity: string,
  onSearchQueryChange: (query: string) => void,
  onSelectCity: (city: string) => void
) {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [minRating, setMinRating] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(10000000);
  const [sortBy, setSortBy] = useState<ExploreSort>('recommended');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);

  const filteredHotels = hotels
    .filter((hotel) => {
      // Substring match, not exact: "Jakarta" should surface "Jakarta Pusat",
      // "Jakarta Selatan", etc. Typing the full city name ("Jakarta Pusat")
      // still narrows down to just that city on its own, since it's a longer,
      // more specific substring than the shorter one.
      if (selectedCity && selectedCity !== 'Semua Kota' && !hotel.city.toLowerCase().includes(selectedCity.toLowerCase())) {
        return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = hotel.name.toLowerCase().includes(q);
        const matchLoc = hotel.location.toLowerCase().includes(q);
        const matchCity = hotel.city.toLowerCase().includes(q);
        if (!matchName && !matchLoc && !matchCity) return false;
      }
      if (selectedCategory !== 'ALL' && hotel.category !== selectedCategory) {
        return false;
      }
      if (hotel.rating < minRating) return false;
      if (hotel.pricePerNight > maxPrice) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc') return a.pricePerNight - b.pricePerNight;
      if (sortBy === 'price-desc') return b.pricePerNight - a.pricePerNight;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0;
    });

  const resetFilters = () => {
    setSelectedCategory('ALL');
    setMinRating(0);
    setMaxPrice(10000000);
    onSelectCity('');
    onSearchQueryChange('');
    setSortBy('recommended');
  };

  const hasActiveFilters =
    selectedCategory !== 'ALL' ||
    minRating > 0 ||
    selectedCity !== '' ||
    searchQuery !== '' ||
    sortBy !== 'recommended';

  return {
    selectedCategory,
    setSelectedCategory,
    minRating,
    setMinRating,
    maxPrice,
    setMaxPrice,
    sortBy,
    setSortBy,
    showAdvancedFilters,
    setShowAdvancedFilters,
    filteredHotels,
    resetFilters,
    hasActiveFilters
  };
}
