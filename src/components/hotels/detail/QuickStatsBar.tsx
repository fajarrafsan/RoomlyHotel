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
}> = ({ hotel, anyRefundable, checkIn, checkOut, isID }) => {
  const hasReviews = hotel.reviewsCount > 0;
  const ratingLabel = !hasReviews
    ? (isID ? 'Belum ada ulasan' : 'No reviews yet')
    : hotel.rating >= 4.8
      ? (isID ? 'Luar biasa' : 'Exceptional')
      : hotel.rating >= 4
        ? (isID ? 'Sangat bagus' : 'Very good')
        : (isID ? 'Penilaian tamu' : 'Guest rating');

  return (
    <div className="px-4 sm:px-6 py-3 border-b border-navy-soft bg-white shrink-0">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-5 min-w-0">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${hasReviews ? 'bg-navy text-white' : 'bg-slate-100 text-slate-500'}`}>
              <span className="text-base font-semibold">{hasReviews ? hotel.rating.toFixed(1) : '—'}</span>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-slate-800">{ratingLabel}</p>
              {hasReviews ? (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <StarRating rating={hotel.rating} size="sm" />
                  <span className="text-xs text-slate-500">{hotel.reviewsCount} {isID ? 'ulasan' : 'reviews'}</span>
                </div>
              ) : (
                <p className="mt-0.5 text-xs text-slate-500">{isID ? 'Jadilah tamu pertama yang menilai' : 'Be the first guest to leave a review'}</p>
              )}
            </div>
          </div>
          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden />
            <span>{isID ? 'Pembayaran aman' : 'Secure payment'}</span>
          </div>
          {anyRefundable && (
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-600">
              <Ban className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden />
              <span>{isID ? 'Opsi refund' : 'Refund options'}</span>
            </div>
          )}
          {(checkIn || checkOut) && (
            <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-600">
              <Clock className="w-4 h-4 text-navy shrink-0" aria-hidden />
              <span>
                {checkIn && `${isID ? 'Masuk' : 'In'} ${checkIn}`}
                {checkIn && checkOut && ' · '}
                {checkOut && `${isID ? 'Keluar' : 'Out'} ${checkOut}`}
              </span>
            </div>
          )}
        </div>
        <div className="hidden sm:block text-right shrink-0">
          {hotel.originalPrice && (
            <span className="text-xs text-slate-500 line-through block">
              {formatCurrency(hotel.originalPrice)}
            </span>
          )}
          <span className="text-lg font-semibold text-navy">{formatCurrency(hotel.pricePerNight)}</span>
          <span className="text-xs text-slate-500"> / {isID ? 'malam' : 'night'}</span>
        </div>
      </div>
    </div>
  );
};
