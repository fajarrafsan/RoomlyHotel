import { motion } from 'motion/react';
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
  return (
    <div className="space-y-1.5 px-0.5">
      {/* Stars + Rating Row */}
      <div className="flex items-center gap-2">
        {/* Hotel Stars */}
        <div className="flex items-center gap-0.5">
          {Array.from({ length: hotel.stars }).map((_, i) => (
            <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
          ))}
        </div>

        <span className="text-slate-300">·</span>

        {/* Rating Number */}
        <div className="flex items-center gap-1">
          <span className="text-[13px] font-semibold text-slate-900">
            {hotel.rating > 0 ? hotel.rating.toFixed(1) : (isID ? 'Baru' : 'New')}
          </span>
        </div>

        {hotel.reviewsCount > 0 && (
          <>
            <span className="text-slate-300">·</span>
            <span className="text-[12px] text-slate-400 font-light">
              {hotel.reviewsCount} {isID ? 'ulasan' : 'reviews'}
            </span>
          </>
        )}
      </div>

      {/* Hotel Name */}
      <h3 className="text-[15px] font-semibold text-slate-900 leading-snug group-hover:text-slate-600 transition-colors duration-200 line-clamp-1">
        {hotel.name}
      </h3>

      {/* Location */}
      <p className="text-[13px] text-slate-500 font-light flex items-center gap-1">
        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="truncate">{hotel.location}, {hotel.city}</span>
      </p>

      {/* Amenities Pills */}
      {hotel.amenities.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {hotel.amenities.slice(0, 3).map((am, i) => (
            <span
              key={i}
              className="text-[11px] font-medium text-slate-500 flex items-center gap-1"
            >
              {i > 0 && <span className="w-1 h-1 rounded-full bg-slate-300 mr-1" />}
              {am}
            </span>
          ))}
        </div>
      )}

      {/* Price Section */}
      <div className="flex items-end justify-between pt-3 mt-1 border-t border-slate-100">
        <div className="flex flex-col">
          {hotel.originalPrice && (
            <span className="text-[11px] text-slate-400 line-through font-light mb-0.5">
              {formatCurrency(hotel.originalPrice)}
            </span>
          )}
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-slate-900 tracking-tight">
              {formatCurrency(hotel.pricePerNight)}
            </span>
            <span className="text-[12px] text-slate-400 font-light">
              / {isID ? 'malam' : 'night'}
            </span>
          </div>
          {hotel.discountPercentage && (
            <span className="text-[10px] text-emerald-600 font-medium mt-0.5">
              {isID ? 'Hemat ' : 'Save '}{formatCurrency(hotel.originalPrice! - hotel.pricePerNight)}
            </span>
          )}
        </div>

        {/* Arrow CTA */}
        <motion.div
          animate={isHovered ? { x: 3, y: -3 } : { x: 0, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="w-9 h-9 rounded-full border border-slate-200 group-hover:border-slate-900 group-hover:bg-slate-900 flex items-center justify-center text-slate-300 group-hover:text-white transition-all duration-300"
        >
          <ArrowUpRight className="w-4 h-4" />
        </motion.div>
      </div>
    </div>
  );
};
