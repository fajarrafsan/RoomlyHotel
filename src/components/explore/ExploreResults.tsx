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
  <section className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 2xl:px-16 py-8 pb-24" aria-labelledby="explore-results-heading">
    <div className="flex items-center justify-between mb-7">
      <div className="flex items-center gap-3 flex-wrap">
        <h2 id="explore-results-heading" className="font-serif text-xl sm:text-2xl font-semibold text-navy">
          {isID ? 'Hasil pencarian' : 'Search results'}
        </h2>
        <span className="px-2.5 py-0.5 bg-navy-soft text-navy text-[12px] font-semibold rounded-full">
          {hotels.length}
        </span>
        {selectedCity && (
          <span className="text-[14px] text-slate-600">
            {isID ? 'di' : 'in'} {selectedCity}
          </span>
        )}
      </div>
    </div>

    {hotels.length === 0 ? (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20 text-center rounded-3xl bg-white border border-navy-soft"
      >
        <div className="w-16 h-16 rounded-full bg-navy-soft flex items-center justify-center mb-5">
          <Filter className="w-7 h-7 text-navy" aria-hidden />
        </div>
        <h3 className="text-lg font-semibold text-navy mb-2">
          {isID ? 'Tidak ada hasil' : 'No results found'}
        </h3>
        <p className="text-[14px] text-slate-600 max-w-sm mb-7 leading-relaxed">
          {isID
            ? 'Coba sesuaikan filter atau kata kunci pencarian untuk menemukan penginapan yang sesuai.'
            : 'Try adjusting your filters or search terms to find a stay that matches.'}
        </p>
        <button
          type="button"
          onClick={onReset}
          className="min-h-12 px-6 py-2.5 bg-gold hover:bg-gold-dark text-white text-[14px] font-semibold rounded-xl transition-colors duration-200 cursor-pointer"
        >
          {isID ? 'Reset filter' : 'Reset filters'}
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
  </section>
), (prevProps, nextProps) => {
  return (
    prevProps.hotels === nextProps.hotels &&
    prevProps.wishlistIds === nextProps.wishlistIds &&
    prevProps.language === nextProps.language &&
    prevProps.selectedCity === nextProps.selectedCity
  );
});
