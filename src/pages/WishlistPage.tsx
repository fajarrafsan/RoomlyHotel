import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Compass, ArrowRight, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Hotel, Language } from '../types';
import { HotelCard } from '../components/hotels/HotelCard';

interface WishlistPageProps {
  hotels: Hotel[];
  wishlistIds: string[];
  onToggleWishlist: (hotelId: string) => void;
  onSelectHotel: (hotel: Hotel) => void;
  language: Language;
}

export const WishlistPage: React.FC<WishlistPageProps> = ({
  hotels,
  wishlistIds,
  onToggleWishlist,
  onSelectHotel,
  language
}) => {
  const isID = language === 'ID';
  const navigate = useNavigate();

  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'rating'>('default');

  const savedHotels = useMemo(() => {
    return hotels.filter((h) => wishlistIds.includes(h.id));
  }, [hotels, wishlistIds]);

  const citiesInWishlist = useMemo(() => {
    const set = new Set(savedHotels.map((h) => h.city).filter(Boolean));
    return Array.from(set).sort();
  }, [savedHotels]);

  const filteredAndSortedHotels = useMemo(() => {
    let list = [...savedHotels];
    if (selectedCityFilter !== 'ALL') {
      list = list.filter((h) => h.city === selectedCityFilter);
    }
    if (sortBy === 'price-asc') {
      list.sort((a, b) => a.pricePerNight - b.pricePerNight);
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => b.pricePerNight - a.pricePerNight);
    } else if (sortBy === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    }
    return list;
  }, [savedHotels, selectedCityFilter, sortBy]);

  return (
    <div className="space-y-10 pb-20 text-slate-800 max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 2xl:px-16">
      {/* ===== HERO HEADER: Clean White Luxury ===== */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl bg-white text-slate-900 p-4 sm:p-10 shadow-sm border border-slate-100/80"
      >
        {/* Subtle Background Accent Light Glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-50/60 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-50/60 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 sm:gap-6">
          <div className="space-y-2 sm:space-y-3 max-w-2xl">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded-full font-semibold text-[10px] sm:text-[11px] uppercase tracking-[0.2em]">
              <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 shrink-0" />
              {isID ? 'Properti Favorit' : 'Saved Collection'}
            </span>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-light tracking-tight leading-tight text-slate-900">
              {isID ? 'Daftar Hotel ' : 'My Favorite '}
              <span className="font-serif italic font-normal text-slate-700 block sm:inline">
                {isID ? 'Impian Saya' : 'Wishlist'}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-light leading-relaxed max-w-xl">
              {isID
                ? 'Pantau perubahan harga, ketersediaan kamar, dan pesan hotel impian Anda dengan mudah.'
                : 'Track price changes, availability, and book your dream stays effortlessly.'}
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-50/80 px-4 py-3 sm:px-5 sm:py-4 rounded-2xl border border-slate-100 shrink-0 shadow-2xs w-full sm:w-auto">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-rose-500 shadow-2xs shrink-0">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <p className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                {isID ? 'Total Tersimpan' : 'Total Saved'}
              </p>
              <p className="text-lg sm:text-xl font-bold text-slate-900 leading-none mt-0.5">
                {savedHotels.length} <span className="text-xs font-normal text-slate-400">{isID ? 'Hotel' : 'Stays'}</span>
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ===== CONTROLS & FILTER BAR ===== */}
      {savedHotels.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 pb-2 border-b border-slate-100">
          {/* City Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none -mx-2 px-2 sm:mx-0 sm:px-0">
            <button
              onClick={() => setSelectedCityFilter('ALL')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                selectedCityFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isID ? 'Semua Kota' : 'All Cities'} ({savedHotels.length})
            </button>
            {citiesInWishlist.map((city) => {
              const count = savedHotels.filter((h) => h.city === city).length;
              return (
                <button
                  key={city}
                  onClick={() => setSelectedCityFilter(city)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    selectedCityFilter === city
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {city} ({count})
                </button>
              );
            })}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">{isID ? 'Urutkan:' : 'Sort:'}</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer"
            >
              <option value="default">{isID ? 'Terbaru' : 'Default'}</option>
              <option value="rating">{isID ? 'Rating Tertinggi' : 'Highest Rating'}</option>
              <option value="price-asc">{isID ? 'Harga Terendah' : 'Price: Low to High'}</option>
              <option value="price-desc">{isID ? 'Harga Tertinggi' : 'Price: High to Low'}</option>
            </select>
          </div>
        </div>
      )}

      {/* ===== HOTEL GRID OR EMPTY STATE ===== */}
      {savedHotels.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-20 text-center bg-white rounded-3xl border border-slate-100 shadow-sm p-8 max-w-md mx-auto space-y-5"
        >
          <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center mx-auto shadow-inner">
            <Heart className="w-8 h-8 fill-rose-500/20 stroke-[1.5]" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-semibold text-slate-900">
              {isID ? 'Belum Ada Hotel di Wishlist' : 'Your Wishlist is Empty'}
            </h3>
            <p className="text-xs text-slate-400 font-light leading-relaxed">
              {isID
                ? 'Jelajahi katalog hotel impian kami dan klik ikon hati pada kartu hotel untuk menyimpannya di sini.'
                : 'Browse our luxury hotel catalog and click the heart icon to save your favorite stays here.'}
            </p>
          </div>

          <button
            onClick={() => navigate('/explore')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-md cursor-pointer"
          >
            <Compass className="w-4 h-4" />
            <span>{isID ? 'Jelajahi Hotel' : 'Explore Hotels'}</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-60" />
          </button>
        </motion.div>
      ) : filteredAndSortedHotels.length === 0 ? (
        <div className="py-16 text-center bg-slate-50 rounded-2xl border border-slate-200/60 p-6 space-y-3">
          <p className="text-sm font-semibold text-slate-700">
            {isID ? 'Tidak ada hotel favorit di kota ini' : 'No saved hotels in this city'}
          </p>
          <button
            onClick={() => setSelectedCityFilter('ALL')}
            className="text-xs font-semibold text-rose-600 hover:underline"
          >
            {isID ? 'Tampilkan Semua Kota' : 'Show All Cities'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredAndSortedHotels.map((hotel, idx) => (
              <motion.div
                key={hotel.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                transition={{ duration: 0.3 }}
              >
                <HotelCard
                  hotel={hotel}
                  index={idx}
                  isWishlisted
                  onToggleWishlist={onToggleWishlist}
                  onSelect={onSelectHotel}
                  language={language}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
