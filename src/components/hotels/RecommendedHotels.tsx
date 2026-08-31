import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Heart, MapPin, Star } from 'lucide-react';
import { DashboardView, Hotel, Language } from '../../types';
import { applyImageFallback } from '../../lib/imageFallback';

/* ------------------------------------------------------------------ */
/*  PREMIUM HOTEL CARD                                                */
/* ------------------------------------------------------------------ */

interface PremiumHotelCardProps {
  hotel: Hotel;
  index: number;
  isWishlisted: boolean;
  onToggleWishlist: (hotelId: string) => void;
  onSelect: (hotel: Hotel) => void;
  language: Language;
}

export const PremiumHotelCard: React.FC<PremiumHotelCardProps> = React.memo(({
  hotel,
  index,
  isWishlisted,
  onToggleWishlist,
  onSelect,
  language
}) => {
  const isID = language === 'ID';
  const [imgLoaded, setImgLoaded] = useState(false);

  const formatPrice = (price: number) =>
    isID
      ? `Rp ${price.toLocaleString('id-ID')}`
      : `$${price.toLocaleString('en-US')}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '50px' }}
      transition={{
        duration: 0.4,
        delay: Math.min(index, 6) * 0.05,
        ease: 'easeOut'
      }}
      className="group relative flex flex-col rounded-3xl bg-white border border-[#E9EEF5] hover:border-blue-100 overflow-hidden cursor-pointer shadow-[0_8px_28px_rgba(30,58,138,0.06)] hover:shadow-[0_16px_40px_rgba(30,58,138,0.12)] will-change-transform transform-gpu hover:-translate-y-1 transition-all duration-200 ease-out"
      onClick={() => onSelect(hotel)}
    >
      {/* Image Area */}
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {/* Skeleton loader */}
        {!imgLoaded && (
          <div className="absolute inset-0 bg-slate-100 animate-pulse" />
        )}

        <img
          src={hotel.image}
          onError={applyImageFallback}
          alt={hotel.name}
          loading="lazy"
          decoding="async"
          onLoad={() => setImgLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-transform transition-opacity duration-500 ease-out group-hover:scale-105 ${
            imgLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Top overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/30 via-transparent to-transparent" />

        {/* Wishlist Button */}
        <button
          type="button"
          aria-pressed={isWishlisted}
          aria-label={isID ? (isWishlisted ? 'Hapus dari wishlist' : 'Simpan ke wishlist') : (isWishlisted ? 'Remove from wishlist' : 'Save to wishlist')}
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(hotel.id);
          }}
          className="absolute top-3 right-3 w-11 h-11 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-colors duration-200 z-10 cursor-pointer"
        >
          <Heart
            className={`w-4 h-4 transition-colors duration-300 ${
              isWishlisted
                ? 'text-rose-500 fill-rose-500'
                : 'text-slate-400 hover:text-rose-400'
            }`}
          />
        </button>

        {/* Rating Badge */}
        <div className="absolute top-4 left-4 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/90 backdrop-blur-sm shadow-sm">
          <Star className="w-3 h-3 text-gold fill-gold" />
          <span className="text-[11px] font-bold text-slate-900">
            {hotel.rating.toFixed(1)}
          </span>
          {hotel.reviewsCount !== undefined && (
            <span className="text-[10px] text-slate-400 font-medium">
              ({hotel.reviewsCount.toLocaleString(isID ? 'id-ID' : 'en-US')})
            </span>
          )}
        </div>

        {/* Bottom location chip */}
        <div className="absolute bottom-3 left-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-sm">
            <MapPin className="w-3 h-3 text-slate-500" aria-hidden />
            <span className="text-[12px] font-medium text-slate-700">{hotel.location}</span>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex flex-col flex-1 p-5 space-y-3">
        {/* Hotel Name */}
        <div className="space-y-1">
          <h3 className="text-[15px] font-semibold text-[#1E3A8A] leading-snug tracking-tight group-hover:text-[#1e40af] transition-colors duration-200 line-clamp-1">
            <span className="font-serif italic font-normal">{hotel.name}</span>
          </h3>
          <p className="text-[12px] text-slate-600 font-medium flex items-center gap-1">
            <MapPin className="w-3 h-3" aria-hidden />
            {hotel.location}
          </p>
        </div>

        {/* Tags */}
        {hotel.category && (
          <div className="flex flex-wrap gap-1.5">
            <span
              className="px-2 py-0.5 rounded-md bg-[#E9EEF5] text-[11px] font-medium text-slate-600 border border-transparent"
            >
              {hotel.category}
            </span>
          </div>
        )}

        {/* Price & CTA */}
        <div className="pt-3 mt-auto border-t border-slate-50 flex items-end justify-between">
          <div>
            <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">
              {isID ? 'per malam' : 'per night'}
            </p>
            <p className="text-lg font-semibold text-[#1E3A8A] tracking-tight">
              {formatPrice(hotel.pricePerNight)}
            </p>
          </div>
          <div className="opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-500">
            <div className="w-9 h-9 rounded-full bg-[#1E3A8A] flex items-center justify-center">
              <ChevronRight className="w-4 h-4 text-white" aria-hidden />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.hotel.id === nextProps.hotel.id &&
    prevProps.isWishlisted === nextProps.isWishlisted &&
    prevProps.language === nextProps.language &&
    prevProps.index === nextProps.index &&
    prevProps.hotel.pricePerNight === nextProps.hotel.pricePerNight &&
    prevProps.hotel.rating === nextProps.hotel.rating &&
    prevProps.hotel.image === nextProps.hotel.image &&
    prevProps.hotel.gallery === nextProps.hotel.gallery
  );
});

/* ------------------------------------------------------------------ */
/*  RECOMMENDED HOTELS SECTION                                        */
/* ------------------------------------------------------------------ */

interface RecommendedHotelsProps {
  hotels: Hotel[];
  isID: boolean;
  onNavigateTo: (view: DashboardView) => void;
  onSelectHotel: (hotel: Hotel) => void;
  onToggleWishlist: (hotelId: string) => void;
  wishlistedIds: string[];
  language: Language;
}

export const RecommendedHotels: React.FC<RecommendedHotelsProps> = ({
  hotels,
  isID,
  onNavigateTo,
  onSelectHotel,
  onToggleWishlist,
  wishlistedIds,
  language
}) => {
  return (
    <section className="space-y-8 sm:space-y-10" aria-labelledby="recommended-heading">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-[12px] font-semibold text-gold uppercase tracking-[0.16em]">
            {isID ? 'Pilihan kami' : 'Handpicked'}
          </p>
          <h2 id="recommended-heading" className="font-serif text-3xl sm:text-4xl lg:text-[2.75rem] text-[#1E3A8A] tracking-tight leading-[1.15]">
            {isID ? 'Hotel rekomendasi' : 'Luxury recommendations'}
          </h2>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTo('explore')}
          className="group hidden sm:inline-flex min-h-11 items-center gap-2 text-[14px] font-semibold text-slate-600 hover:text-[#1E3A8A] transition-colors duration-200 cursor-pointer"
        >
          <span>{isID ? 'Lihat Semua' : 'View All'}</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
        </button>
      </div>

      {/* Hotels Grid */}
      {hotels.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-24 text-center bg-white rounded-[2rem] border border-[#E9EEF5]"
        >
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-slate-50 flex items-center justify-center">
            <Star className="w-6 h-6 text-slate-300" />
          </div>
          <p className="text-sm text-slate-600 font-medium">
            {isID ? 'Belum ada data hotel tersedia.' : 'No hotels available yet.'}
          </p>
          <p className="text-xs text-slate-500 mt-1.5">
            {isID ? 'Silakan kembali lagi nanti.' : 'Please check back later.'}
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {hotels.map((hotel, idx) => (
            <PremiumHotelCard
              key={hotel.id}
              hotel={hotel}
              index={idx}
              isWishlisted={wishlistedIds.includes(hotel.id)}
              onToggleWishlist={onToggleWishlist}
              onSelect={onSelectHotel}
              language={language}
            />
          ))}
        </div>
      )}

      {/* Mobile View All */}
      <div className="sm:hidden flex justify-center">
        <button
          type="button"
          onClick={() => onNavigateTo('explore')}
          className="group inline-flex min-h-11 items-center gap-2 text-[14px] font-semibold text-slate-600 hover:text-[#1E3A8A] transition-colors duration-200 cursor-pointer"
        >
          <span>{isID ? 'Lihat Semua Hotel' : 'View All Hotels'}</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
        </button>
      </div>
    </section>
  );
};
