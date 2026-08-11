import React from 'react';
import { motion } from 'motion/react';
import { MapPin, CalendarDays, FileText, ArrowUpRight } from 'lucide-react';
import { Booking } from '../../types';
import { formatDate } from '../../lib/utils';
import { viewOnce } from './animations';

interface ActiveBookingBannerProps {
  booking: Booking;
  isID: boolean;
  onOpenInvoice: (booking: Booking) => void;
}

export const ActiveBookingBanner: React.FC<ActiveBookingBannerProps> = ({ booking, isID, onOpenInvoice }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={viewOnce}
    transition={{ type: 'spring', stiffness: 120, damping: 20 }}
    className="relative rounded-3xl bg-white border border-slate-100 shadow-[0_8px_32px_rgba(0,0,0,0.06)] overflow-hidden"
  >
    {/* Top accent line */}
    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400" />
    
    <div className="p-8 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
      <div className="space-y-5 flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-[11px] font-semibold text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {isID ? 'Reservasi Aktif' : 'Active Reservation'}
          </span>
          <span className="text-[11px] text-slate-400 font-mono tracking-wide">
            {booking.bookingCode}
          </span>
        </div>
        
        <div>
          <h3 className="text-2xl sm:text-3xl font-semibold text-slate-950 tracking-tight">
            {booking.hotelName}
          </h3>
          <p className="text-[14px] text-slate-400 font-light mt-1.5">{booking.roomType}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5 text-[13px] text-slate-500 font-light">
          <span className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
              <MapPin className="w-4 h-4 text-slate-400" />
            </span>
            {booking.hotelLocation}
          </span>
          <span className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
              <CalendarDays className="w-4 h-4 text-slate-400" />
            </span>
            {formatDate(booking.checkIn, isID ? 'ID' : 'EN')}
          </span>
        </div>
      </div>

      <motion.button
        onClick={() => onOpenInvoice(booking)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full md:w-auto py-3.5 px-8 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white text-[13px] font-semibold transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-slate-950/10 active:scale-[0.97] shrink-0"
      >
        <FileText className="w-4 h-4" />
        <span>{isID ? 'Lihat Invoice' : 'View Invoice'}</span>
        <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
      </motion.button>
    </div>
  </motion.div>
);