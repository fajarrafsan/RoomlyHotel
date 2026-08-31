import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Star, Heart, ArrowUpRight } from 'lucide-react';
import { Hotel } from '../../../types';
import { getAmenityIcon } from './amenityIcons';
import { applyImageFallback } from '../../../lib/imageFallback';

interface HotelCardImageProps {
  hotel: Hotel;
  isID: boolean;
  isWishlisted: boolean;
  isBestSeller: boolean;
  isAlmostFull: boolean;
  isHovered: boolean;
  currentImgIndex: number;
  onToggleWishlist: (hotelId: string) => void;
  onHoverDot: (idx: number) => void;
}

export const HotelCardImage: React.FC<HotelCardImageProps> = ({
  hotel,
  isID,
  isWishlisted,
  isBestSeller,
  isAlmostFull,
  isHovered,
  currentImgIndex,
  onToggleWishlist,
  onHoverDot
}) => {
  const reduceMotion = useReducedMotion();
  const images = hotel.gallery?.length ? hotel.gallery : [hotel.image];
  const visibleAmenities = hotel.amenities.slice(0, 3);

  return (
    <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
      <AnimatePresence mode="wait">
        <motion.img
          key={currentImgIndex}
          src={images[currentImgIndex]}
          alt={hotel.name}
          loading="lazy"
          decoding="async"
          onError={applyImageFallback}
          initial={reduceMotion ? false : { opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: isHovered && !reduceMotion ? 1.06 : 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="w-full h-full object-cover"
        />
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-slate-950/5 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

      <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
        {isBestSeller && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white text-[10px] font-bold text-navy shadow-sm uppercase tracking-wider">
            <Star className="w-3 h-3 fill-gold text-gold" aria-hidden />
            {isID ? 'Terlaris' : 'Best Seller'}
          </span>
        )}

        {hotel.discountPercentage && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-navy text-white text-[10px] font-bold shadow-sm">
            -{hotel.discountPercentage}%
          </span>
        )}

        {isAlmostFull && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-rose-500 text-white text-[10px] font-bold shadow-sm">
            {isID ? 'Sisa ' : ''}{(hotel as { availableRooms?: number }).availableRooms} {isID ? 'kamar' : 'rooms left'}
          </span>
        )}
      </div>

      <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5 z-10">
        <motion.button
          type="button"
          aria-pressed={isWishlisted}
          aria-label={
            isID
              ? (isWishlisted ? 'Hapus dari wishlist' : 'Simpan ke wishlist')
              : (isWishlisted ? 'Remove from wishlist' : 'Save to wishlist')
          }
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(hotel.id);
          }}
          whileTap={reduceMotion ? undefined : { scale: 0.92 }}
          className={`min-w-11 min-h-11 rounded-full flex items-center justify-center transition-colors duration-200 shadow-sm cursor-pointer ${
            isWishlisted
              ? 'bg-rose-500 text-white'
              : 'bg-white/95 text-slate-500 hover:text-rose-500 hover:bg-white'
          }`}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </motion.button>

        {images.length > 1 && (
          <span className="px-2 py-1 rounded-lg bg-white/95 text-[10px] font-semibold text-slate-600 shadow-sm">
            {images.length} {isID ? 'foto' : 'photos'}
          </span>
        )}
      </div>

      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2 z-10">
        <span className="px-2.5 py-1 bg-white/95 rounded-lg text-[11px] font-medium text-navy shadow-sm">
          {hotel.category}
        </span>

        {visibleAmenities.length > 0 && (
          <div className="flex items-center gap-1">
            {visibleAmenities.map((am, i) => {
              const Icon = getAmenityIcon(am);
              return Icon ? (
                <span
                  key={`${am}-${i}`}
                  title={am}
                  className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center shadow-sm"
                >
                  <Icon className="w-3.5 h-3.5 text-navy" />
                </span>
              ) : null;
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
          >
            <span className="px-5 py-2.5 bg-navy text-white rounded-full text-[12px] font-semibold shadow-xl flex items-center gap-1.5">
              {isID ? 'Lihat Detail' : 'View Details'}
              <ArrowUpRight className="w-3.5 h-3.5 text-gold-light" />
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {images.length > 1 && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10">
          {images.map((_, idx) => (
            <button
              key={idx}
              type="button"
              aria-label={isID ? `Foto ${idx + 1}` : `Photo ${idx + 1}`}
              onMouseEnter={() => onHoverDot(idx)}
              onClick={(e) => {
                e.stopPropagation();
                onHoverDot(idx);
              }}
              className={`h-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                currentImgIndex === idx
                  ? 'w-4 bg-white'
                  : 'w-1.5 bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
