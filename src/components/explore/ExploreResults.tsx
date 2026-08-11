import React from 'react';
import { motion } from 'motion/react';
import { Filter } from 'lucide-react';
import { Hotel, Language } from '../../types';
import { HotelCard } from '../hotels/HotelCard';

interface ExploreResultsProps {
  isID: boolean;
  hotels: Hotel[];
  selectedCity: string;
  wishlistIds: string[];
  onToggleWishlist: (hotelId: string) => void;
  onSelectHotel: (hotel: Hotel) => void;
  language: Language;
  onReset: () => void;
}

export const ExploreResults: React.FC<ExploreResultsProps> = React.memo(({
  isID,
  hotels,
  selectedCity,
  wishlistIds,
  onToggleWishlist,
  onSelectHotel,
  language,
  onReset
}) => (
  <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 2xl:px-16 py-8 pb-20">

    {/* Results Header */}
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-slate-900">
          {isID ? 'Hasil Pencarian' : 'Search Results'}
        </h2>
        <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-[11px] font-semibold rounded-full">
          {hotels.length}
        </span>
        {selectedCity && (
          <span className="text-sm text-slate-400 font-light">
            {isID ? 'di' : 'in'} {selectedCity}
          </span>
        )}
      </div>
    </div>

    {/* Hotel Grid */}
    {hotels.length === 0 ? (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-24 text-center"
      >
        <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-6">
          <Filter className="w-8 h-8 text-slate-300 stroke-[1.5]" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          {isID ? 'Tidak ada hasil' : 'No results found'}
        </h3>
        <p className="text-sm text-slate-400 max-w-sm mb-8 font-light leading-relaxed">
          {isID
            ? 'Coba sesuaikan filter atau kata kunci pencarian Anda untuk menemukan penginapan yang sesuai.'
            : 'Try adjusting your filters or search terms to find accommodations that match your preferences.'}
        </p>
        <button
          onClick={onReset}
          className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-medium rounded-full transition-colors"
        >
          {isID ? 'Reset Filter' : 'Reset Filters'}
        </button>
      </motion.div>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-6 gap-y-10">
        {hotels.map((hotel, idx) => (
          <HotelCard
            key={hotel.id}
            hotel={hotel}
            index={idx}
            isWishlisted={wishlistIds.includes(hotel.id)}
            onToggleWishlist={onToggleWishlist}
            onSelect={onSelectHotel}
            language={language}
          />
        ))}
      </div>
    )}
  </div>
), (prevProps, nextProps) => {
  return (
    prevProps.hotels === nextProps.hotels &&
    prevProps.wishlistIds === nextProps.wishlistIds &&
    prevProps.language === nextProps.language &&
    prevProps.selectedCity === nextProps.selectedCity
  );
});
