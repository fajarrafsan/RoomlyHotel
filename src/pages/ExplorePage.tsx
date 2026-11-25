import React, { useEffect, useMemo, useState } from 'react';
import { Hotel, Language } from '../types';
import { useHotelFilters } from '../components/explore/useHotelFilters';
import { ExploreHero, ExploreHeroSpotlight } from '../components/explore/ExploreHero';
import { ExploreFilterSheet, ExploreFilters } from '../components/explore/ExploreFilters';
import { ExploreFilterChip, ExploreResults } from '../components/explore/ExploreResults';
import { CityDestinationOption } from '../components/home/CityDestinationPicker';

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

const categories = ['ALL', 'Hotel', 'Villa', 'Apartment'];
const quickCityOrder = ['badung', 'jakarta pusat', 'bandung', 'yogyakarta', 'lombok tengah'];

export const ExplorePage: React.FC<ExplorePageProps> = ({
  hotels, searchQuery, onSearchQueryChange, selectedCity, onSelectCity,
  onSelectHotel, wishlistIds, onToggleWishlist, language,
}) => {
  const isID = language === 'ID';
  const locale = isID ? 'id-ID' : 'en-US';
  const [headerHeight, setHeaderHeight] = useState(72);
  const {
    selectedCategory, setSelectedCategory, minRating, setMinRating, sortBy, setSortBy,
    showAdvancedFilters, setShowAdvancedFilters, filteredHotels, resetFilters, hasActiveFilters,
    maxPrice, setMaxPrice, minGuests, setMinGuests, minStars, setMinStars,
    catalogMaxPrice, categoryCounts, matchingRoomsByHotel,
  } = useHotelFilters(hotels, searchQuery, selectedCity, onSearchQueryChange, onSelectCity);

  useEffect(() => {
    const header = document.querySelector('.site-header');
    if (!header) return;
    const measure = () => setHeaderHeight(Math.ceil(header.getBoundingClientRect().height));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  const cities = useMemo(() => {
    const groups = new Map<string, CityDestinationOption>();
    for (const hotel of hotels) {
      const city = hotel.city.trim();
      if (!city) continue;
      const key = city.toLocaleLowerCase();
      const existing = groups.get(key);
      if (existing) existing.count += 1;
      else groups.set(key, { city, province: hotel.province, count: 1 });
    }
    return [...groups.values()].sort((a, b) => a.city.localeCompare(b.city));
  }, [hotels]);

  const quickCities = useMemo(
    () => quickCityOrder.flatMap(key => cities.find(option => option.city.toLocaleLowerCase() === key)?.city ?? []),
    [cities],
  );

  // Only an exact catalog city drives the hero, so it doesn't flicker while someone types.
  const cityKey = selectedCity.trim().toLocaleLowerCase();
  const spotlightHotels = useMemo(
    () => cityKey ? hotels.filter(hotel => hotel.city.trim().toLocaleLowerCase() === cityKey) : [],
    [hotels, cityKey],
  );
  const spotlight: ExploreHeroSpotlight | null = spotlightHotels.length > 0 ? {
    city: spotlightHotels[0].city.trim(),
    province: spotlightHotels[0].province,
    count: spotlightHotels.length,
    image: spotlightHotels[0].image,
    hotelName: spotlightHotels[0].name,
  } : null;

  const statHotels = spotlight ? spotlightHotels : hotels;
  const statPrices = statHotels.map(hotel => hotel.pricePerNight).filter(price => Number.isFinite(price) && price > 0);
  const stats = [
    { value: statHotels.length.toLocaleString(locale), label: isID ? 'penginapan' : statHotels.length === 1 ? 'stay' : 'stays' },
    ...(spotlight ? [] : [{ value: cities.length.toLocaleString(locale), label: isID ? 'kota' : 'cities' }]),
    ...(statPrices.length > 0 ? [{
      value: new Intl.NumberFormat(locale, { style: 'currency', currency: 'IDR', notation: 'compact', maximumFractionDigits: 1 }).format(Math.min(...statPrices)),
      label: isID ? 'harga mulai' : 'starting price',
    }] : []),
  ];

  const money = (value: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
  // The property-type tabs already show their own state, so only the rest become chips.
  const chips: ExploreFilterChip[] = [
    ...(searchQuery.trim() ? [{ key: 'query', label: `“${searchQuery.trim()}”`, remove: () => onSearchQueryChange('') }] : []),
    ...(selectedCity.trim() ? [{ key: 'city', label: selectedCity.trim(), remove: () => onSelectCity('') }] : []),
    ...(maxPrice !== null ? [{ key: 'price', label: `≤ ${money(maxPrice)}`, remove: () => setMaxPrice(null) }] : []),
    ...(minGuests > 0 ? [{ key: 'guests', label: `${minGuests}+ ${isID ? 'tamu' : 'guests'}`, remove: () => setMinGuests(0) }] : []),
    ...(minStars > 0 ? [{ key: 'stars', label: `${minStars}+ ${isID ? 'bintang hotel' : 'hotel stars'}`, remove: () => setMinStars(0) }] : []),
    ...(minRating > 0 ? [{ key: 'rating', label: `${isID ? 'Ulasan' : 'Guest rating'} ${minRating}+`, remove: () => setMinRating(0) }] : []),
  ];
  const panelFilterCount = [maxPrice !== null, minGuests > 0, minStars > 0, minRating > 0].filter(Boolean).length;

  const filterFields = {
    isID,
    minRating,
    onMinRatingChange: setMinRating,
    maxPrice,
    onMaxPriceChange: setMaxPrice,
    catalogMaxPrice,
    minGuests,
    onMinGuestsChange: setMinGuests,
    minStars,
    onMinStarsChange: setMinStars,
    hasActiveFilters,
    onReset: resetFilters,
  };

  return (
    <div className="explore-page -mx-4 -mt-6 min-h-screen bg-slate-50 pb-10 sm:-mx-6 lg:-mx-8" style={{ '--explore-header-height': `${headerHeight}px` } as React.CSSProperties} data-explore-page>
      <ExploreHero isID={isID} searchQuery={searchQuery} onSearchQueryChange={onSearchQueryChange} selectedCity={selectedCity} onSelectCity={onSelectCity} cities={cities} quickCities={quickCities} stats={stats} spotlight={spotlight} />
      <div className="mx-auto mt-7 max-w-[1480px] px-4 sm:mt-9 sm:px-8 lg:px-12">
        <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[272px_minmax(0,1fr)] xl:gap-8">
          <aside className="explore-filter-sidebar hidden min-w-0 flex-col xl:sticky xl:flex" style={{ top: `calc(var(--explore-header-height) + 16px)` }} aria-label={isID ? 'Filter pencarian' : 'Search filters'}>
            <ExploreFilters {...filterFields} />
          </aside>
          <ExploreResults isID={isID} hotels={filteredHotels} selectedCity={selectedCity} wishlistIds={wishlistIds} onToggleWishlist={onToggleWishlist} onSelectHotel={onSelectHotel} language={language} onReset={resetFilters} sortBy={sortBy} onSortChange={setSortBy} searchQuery={searchQuery} matchingRoomsByHotel={matchingRoomsByHotel} roomFiltersActive={maxPrice !== null || minGuests > 0} filterKey={JSON.stringify([selectedCity, searchQuery, selectedCategory, maxPrice, minGuests, minStars, minRating, sortBy])} categories={categories} selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} categoryCounts={categoryCounts} chips={chips} panelFilterCount={panelFilterCount} onOpenFilters={() => setShowAdvancedFilters(true)} />
        </div>
      </div>
      <ExploreFilterSheet {...filterFields} open={showAdvancedFilters} onClose={() => setShowAdvancedFilters(false)} resultCount={filteredHotels.length} />
    </div>
  );
};
