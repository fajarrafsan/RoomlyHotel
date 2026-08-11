import React, { useMemo } from 'react';
import { Hotel, Language } from '../types';
import { useHotelFilters } from '../components/explore/useHotelFilters';
import { ExploreHero } from '../components/explore/ExploreHero';
import { ExploreFilters } from '../components/explore/ExploreFilters';
import { ExploreResults } from '../components/explore/ExploreResults';

interface ExplorePageProps {
  hotels: Hotel[];
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  selectedCity: string;
  onSelectCity: (city: string) => void;
  onSelectHotel: (hotel: Hotel) => void;
  wishlistIds: string[];
  onToggleWishlist: (hotelId: string) => void;
  language: Language;
}

export const ExplorePage: React.FC<ExplorePageProps> = ({
  hotels,
  searchQuery,
  onSearchQueryChange,
  selectedCity,
  onSelectCity,
  onSelectHotel,
  wishlistIds,
  onToggleWishlist,
  language
}) => {
  const isID = language === 'ID';

  const {
    selectedCategory,
    setSelectedCategory,
    minRating,
    setMinRating,
    sortBy,
    setSortBy,
    showAdvancedFilters,
    setShowAdvancedFilters,
    filteredHotels,
    resetFilters,
    hasActiveFilters
  } = useHotelFilters(hotels, searchQuery, selectedCity, onSearchQueryChange, onSelectCity);

  const categories = ['ALL', 'Resort', 'Luxury', 'Boutique', 'Villa', 'Business'];

  const cities = useMemo(
    () => Array.from(new Set(hotels.map((h) => h.city).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [hotels]
  );

  return (
    <div className="min-h-screen bg-white">
      {/* ===== HERO SECTION: Premium White Elegance ===== */}
      <ExploreHero
        isID={isID}
        searchQuery={searchQuery}
        onSearchQueryChange={onSearchQueryChange}
        selectedCity={selectedCity}
        onSelectCity={onSelectCity}
        cities={cities}
      />

      {/* ===== FILTER & SORT BAR: Minimalist Precision ===== */}
      <ExploreFilters
        isID={isID}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        sortBy={sortBy}
        onSortChange={setSortBy}
        minRating={minRating}
        onMinRatingChange={setMinRating}
        showAdvancedFilters={showAdvancedFilters}
        onToggleAdvanced={() => setShowAdvancedFilters(!showAdvancedFilters)}
        hasActiveFilters={hasActiveFilters}
        onReset={resetFilters}
      />

      {/* ===== RESULTS SECTION ===== */}
      <ExploreResults
        isID={isID}
        hotels={filteredHotels}
        selectedCity={selectedCity}
        wishlistIds={wishlistIds}
        onToggleWishlist={onToggleWishlist}
        onSelectHotel={onSelectHotel}
        language={language}
        onReset={resetFilters}
      />
    </div>
  );
};
