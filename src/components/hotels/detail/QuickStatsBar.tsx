import React from 'react';
import { ShieldCheck, Ban, Clock } from 'lucide-react';
import { Hotel } from '../../../types';
import { formatCurrency } from '../../../lib/utils';
import { StarRating } from './StarRating';

export const QuickStatsBar: React.FC<{
  hotel: Hotel;
  anyRefundable: boolean;
  checkIn: string | null;
  checkOut: string | null;
  isID: boolean;
}> = ({ hotel, anyRefundable, checkIn, checkOut, isID }) => (
  <div className="px-5 sm:px-6 py-4 border-b border-navy-soft bg-white shrink-0">
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-5 min-w-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-navy text-white flex flex-col items-center justify-center shrink-0">
            <span className="text-lg font-semibold">{hotel.rating.toFixed(1)}</span>
          </div>
          <div>
            <StarRating rating={hotel.rating} size="sm" />
            <p className="text-[13px] font-semibold text-navy mt-0.5">
              {hotel.rating >= 4.8 ? (isID ? 'Luar biasa' : 'Exceptional') : (isID ? 'Sangat bagus' : 'Very good')}
            </p>
            <p className="text-[12px] text-slate-500">{hotel.reviewsCount} {isID ? 'ulasan' : 'reviews'}</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-1.5 text-[12px] text-slate-600">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>{isID ? 'Pembayaran aman' : 'Secure payment'}</span>
        </div>
        {/* Only claimed when a room actually carries a refundable policy. */}
        {anyRefundable && (
          <div className="hidden md:flex items-center gap-1.5 text-[12px] text-slate-600">
            <Ban className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isID ? 'Bisa refund' : 'Refundable'}</span>
          </div>
        )}
        {(checkIn || checkOut) && (
          <div className="hidden lg:flex items-center gap-1.5 text-[12px] text-slate-600">
            <Clock className="w-3.5 h-3.5 text-navy" />
            <span>
              {checkIn && `${isID ? 'Masuk' : 'In'} ${checkIn}`}
              {checkIn && checkOut && ' · '}
              {checkOut && `${isID ? 'Keluar' : 'Out'} ${checkOut}`}
            </span>
          </div>
        )}
      </div>
      <div className="text-right">
        {hotel.originalPrice && (
          <span className="text-[12px] text-slate-500 line-through block">
            {formatCurrency(hotel.originalPrice)}
          </span>
        )}
        <span className="text-xl font-semibold text-navy">{formatCurrency(hotel.pricePerNight)}</span>
        <span className="text-[12px] text-slate-500"> / {isID ? 'malam' : 'night'}</span>
      </div>
    </div>
  </div>
);
