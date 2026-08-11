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
  <div className="px-6 py-4 border-b border-slate-100 bg-white shrink-0">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex flex-col items-center justify-center">
            <span className="text-lg font-bold">{hotel.rating.toFixed(1)}</span>
          </div>
          <div>
            <StarRating rating={hotel.rating} size="sm" />
            <p className="text-[12px] font-semibold text-slate-900 mt-0.5">
              {hotel.rating >= 4.8 ? (isID ? 'Luar Biasa' : 'Exceptional') : (isID ? 'Sangat Bagus' : 'Very Good')}
            </p>
            <p className="text-[11px] text-slate-400 font-light">{hotel.reviewsCount} {isID ? 'ulasan' : 'reviews'}</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>{isID ? 'Pembayaran Aman' : 'Secure Payment'}</span>
        </div>
        {/* Only claimed when a room actually carries a refundable policy. */}
        {anyRefundable && (
          <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-500">
            <Ban className="w-3.5 h-3.5 text-emerald-500" />
            <span>{isID ? 'Bisa Refund' : 'Refundable'}</span>
          </div>
        )}
        {(checkIn || checkOut) && (
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-500">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
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
          <span className="text-[12px] text-slate-400 line-through font-light block">
            {formatCurrency(hotel.originalPrice)}
          </span>
        )}
        <span className="text-xl font-bold text-slate-900">{formatCurrency(hotel.pricePerNight)}</span>
        <span className="text-[11px] text-slate-400 font-light"> / {isID ? 'malam' : 'night'}</span>
      </div>
    </div>
  </div>
);
