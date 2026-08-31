import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { MapPin, CalendarDays, FileText, ArrowUpRight } from 'lucide-react';
import { Booking } from '../../types';
import { formatDate } from '../../lib/utils';
import { easeOutSoft, viewOnce } from './animations';
import { applyImageFallback } from '../../lib/imageFallback';

interface ActiveBookingBannerProps {
  booking: Booking;
  isID: boolean;
  onOpenInvoice: (booking: Booking) => void;
}

export const ActiveBookingBanner: React.FC<ActiveBookingBannerProps> = ({ booking, isID, onOpenInvoice }) => {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewOnce}
      transition={{ duration: 0.4, ease: easeOutSoft }}
      className="relative rounded-3xl bg-white border border-[#E9EEF5] shadow-[0_12px_40px_rgba(30,58,138,0.08)] overflow-hidden"
    >
      <div className="flex flex-col md:flex-row">
        {booking.hotelImage && (
          <div className="relative md:w-56 lg:w-64 shrink-0 aspect-[16/9] md:aspect-auto">
            <img
              src={booking.hotelImage}
              onError={applyImageFallback}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-6 sm:p-8 flex flex-1 flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-4 flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-[12px] font-semibold text-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" aria-hidden />
                {isID ? 'Reservasi aktif' : 'Active reservation'}
              </span>
              <span className="text-[12px] text-slate-500 font-mono tracking-wide">
                {booking.bookingCode}
              </span>
            </div>

            <div>
              <h2 className="font-serif text-2xl sm:text-[1.75rem] font-semibold text-[#1E3A8A] tracking-tight">
                {booking.hotelName}
              </h2>
              <p className="text-[14px] text-slate-600 mt-1">{booking.roomType}</p>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 text-[13px] text-slate-600">
              <span className="flex items-center gap-2">
                <span className="w-9 h-9 rounded-xl bg-[#E9EEF5] flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-[#1E3A8A]" aria-hidden />
                </span>
                {booking.hotelLocation}
              </span>
              <span className="flex items-center gap-2">
                <span className="w-9 h-9 rounded-xl bg-[#E9EEF5] flex items-center justify-center">
                  <CalendarDays className="w-4 h-4 text-[#1E3A8A]" aria-hidden />
                </span>
                {formatDate(booking.checkIn, isID ? 'ID' : 'EN')}
                {booking.checkOut ? ` – ${formatDate(booking.checkOut, isID ? 'ID' : 'EN')}` : ''}
              </span>
            </div>
          </div>

          <motion.button
            type="button"
            onClick={() => onOpenInvoice(booking)}
            whileHover={reduceMotion ? undefined : { scale: 1.015 }}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            className="w-full md:w-auto min-h-12 py-3 px-7 rounded-2xl bg-[#1E3A8A] hover:bg-[#1e40af] text-white text-[14px] font-semibold transition-colors duration-200 flex items-center justify-center gap-2.5 shadow-md shadow-[#1E3A8A]/15 cursor-pointer shrink-0"
          >
            <FileText className="w-4 h-4" aria-hidden />
            <span>{isID ? 'Lihat invoice' : 'View invoice'}</span>
            <ArrowUpRight className="w-3.5 h-3.5 opacity-70" aria-hidden />
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
};
