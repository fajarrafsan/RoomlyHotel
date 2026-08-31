import { motion, useReducedMotion } from 'motion/react';
import { Star, MapPin, ArrowUpRight } from 'lucide-react';
import { Hotel } from '../../../types';
import { formatCurrency } from '../../../lib/utils';

interface HotelCardContentProps {
  hotel: Hotel;
  isID: boolean;
  isHovered: boolean;
}

export const HotelCardContent: React.FC<HotelCardContentProps> = ({
  hotel,
  isID,
  isHovered
}) => {
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex flex-col flex-1 p-4 sm:p-5 space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-0.5" aria-label={`${hotel.stars} ${isID ? 'bintang' : 'stars'}`}>
          {Array.from({ length: hotel.stars }).map((_, i) => (
            <Star key={i} className="w-3 h-3 fill-gold text-gold" aria-hidden />
          ))}
        </div>

        <span className="text-navy-soft" aria-hidden>·</span>

        <span className="text-[13px] font-semibold text-navy">
          {hotel.rating > 0 ? hotel.rating.toFixed(1) : (isID ? 'Baru' : 'New')}
        </span>

        {hotel.reviewsCount > 0 && (
          <>
            <span className="text-navy-soft" aria-hidden>·</span>
            <span className="text-[12px] text-slate-500">
              {hotel.reviewsCount} {isID ? 'ulasan' : 'reviews'}
            </span>
          </>
        )}
      </div>

      <h3 className="text-[15px] font-semibold text-navy leading-snug tracking-tight group-hover:text-navy-dark transition-colors duration-200 line-clamp-1">
        <span className="font-serif italic font-normal">{hotel.name}</span>
      </h3>

      <p className="text-[13px] text-slate-600 flex items-center gap-1">
        <MapPin className="w-3.5 h-3.5 text-gold shrink-0" aria-hidden />
        <span className="truncate">{hotel.location}, {hotel.city}</span>
      </p>

      {hotel.amenities.length > 0 && (
        <div className="flex flex-wrap gap-x-2 gap-y-1 pt-0.5">
          {hotel.amenities.slice(0, 3).map((am, i) => (
            <span
              key={`${am}-${i}`}
              className="text-[11px] font-medium text-slate-500 flex items-center gap-1"
            >
              {i > 0 && <span className="w-1 h-1 rounded-full bg-navy-soft" aria-hidden />}
              {am}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-end justify-between pt-3 mt-auto border-t border-navy-soft">
        <div className="flex flex-col">
          {hotel.originalPrice && (
            <span className="text-[11px] text-slate-400 line-through mb-0.5">
              {formatCurrency(hotel.originalPrice)}
            </span>
          )}
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-semibold text-navy tracking-tight">
              {formatCurrency(hotel.pricePerNight)}
            </span>
            <span className="text-[12px] text-slate-500">
              / {isID ? 'malam' : 'night'}
            </span>
          </div>
          {hotel.discountPercentage && hotel.originalPrice && (
            <span className="text-[10px] text-emerald-700 font-medium mt-0.5">
              {isID ? 'Hemat ' : 'Save '}{formatCurrency(hotel.originalPrice - hotel.pricePerNight)}
            </span>
          )}
        </div>

        <motion.div
          animate={!reduceMotion && isHovered ? { x: 2, y: -2 } : { x: 0, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="w-11 h-11 rounded-full border border-navy-soft group-hover:border-navy group-hover:bg-navy flex items-center justify-center text-slate-400 group-hover:text-gold-light transition-colors duration-200"
          aria-hidden
        >
          <ArrowUpRight className="w-4 h-4" />
        </motion.div>
      </div>
    </div>
  );
};
