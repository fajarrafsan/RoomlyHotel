import { motion, AnimatePresence } from 'motion/react';
import { Star, Heart, ArrowUpRight } from 'lucide-react';
import { Hotel } from '../../../types';
import { getAmenityIcon } from './amenityIcons';

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
  const images = hotel.gallery?.length ? hotel.gallery : [hotel.image];

  return (
    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-4 bg-slate-100 shadow-sm group-hover:shadow-xl group-hover:shadow-slate-900/8 transition-all duration-500">
      {/* Image with crossfade on hover (gallery preview) */}
      <AnimatePresence mode="wait">
        <motion.img
          key={currentImgIndex}
          src={images[currentImgIndex]}
          alt={hotel.name}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: isHovered ? 1.08 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full h-full object-cover"
        />
      </AnimatePresence>

      {/* Refined gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-slate-950/5 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

      {/* ===== TOP LEFT BADGES ===== */}
      <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
        {/* Featured / Best Seller */}
        {/* These badges sit at ~90-95% opacity already — backdrop-blur added
            negligible visual polish but every card in the grid paid its
            compositing cost at once, which added up during scroll. Dropped
            in favor of solid near-opaque fills. */}
        {isBestSeller && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white text-[10px] font-bold text-slate-900 shadow-sm uppercase tracking-wider"
          >
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            {isID ? 'Terlaris' : 'Best Seller'}
          </motion.span>
        )}

        {/* Discount */}
        {hotel.discountPercentage && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[10px] font-bold shadow-sm">
            -{hotel.discountPercentage}%
          </span>
        )}

        {/* Scarcity */}
        {isAlmostFull && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-rose-500 text-white text-[10px] font-bold shadow-sm animate-pulse">
            {isID ? 'Sisa ' : ''}{(hotel as any).availableRooms} {isID ? 'kamar' : 'rooms left'}
          </span>
        )}
      </div>

      {/* ===== TOP RIGHT ACTIONS ===== */}
      <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
        {/* Wishlist */}
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(hotel.id);
          }}
          whileTap={{ scale: 0.75 }}
          whileHover={{ scale: 1.1 }}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm ${
            isWishlisted
              ? 'bg-rose-500 text-white'
              : 'bg-white/95 text-slate-500 hover:text-rose-500 hover:bg-white'
          }`}
        >
          <motion.div
            animate={isWishlisted ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </motion.div>
        </motion.button>

        {/* Photo count */}
        {images.length > 1 && (
          <span className="px-2 py-1 rounded-lg bg-white/95 text-[10px] font-semibold text-slate-600 shadow-sm">
            {images.length} {isID ? 'foto' : 'photos'}
          </span>
        )}
      </div>

      {/* ===== BOTTOM OVERLAY INFO ===== */}
      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between z-10">
        {/* Category */}
        <span className="px-2.5 py-1 bg-white/95 rounded-lg text-[11px] font-medium text-slate-800 shadow-sm">
          {hotel.category}
        </span>

        {/* Quick Amenities Icons (hover only) */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-1"
            >
              {hotel.amenities.slice(0, 3).map((am, i) => {
                const Icon = getAmenityIcon(am);
                return Icon ? (
                  <span key={i} className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm" title={am}>
                    <Icon className="w-3.5 h-3.5 text-slate-700" />
                  </span>
                ) : null;
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ===== CENTER HOVER OVERLAY ===== */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex items-center justify-center z-10"
          >
            <motion.span
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="px-5 py-2.5 bg-white/95 backdrop-blur-md rounded-full text-[12px] font-semibold text-slate-900 shadow-xl flex items-center gap-1.5"
            >
              {isID ? 'Lihat Detail' : 'View Details'}
              <ArrowUpRight className="w-3.5 h-3.5" />
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== IMAGE DOTS INDICATOR ===== */}
      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10">
          {images.map((_, idx) => (
            <button
              key={idx}
              onMouseEnter={() => onHoverDot(idx)}
              className={`h-1 rounded-full transition-all duration-300 ${
                currentImgIndex === idx
                  ? 'w-4 bg-white'
                  : 'w-1 bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
