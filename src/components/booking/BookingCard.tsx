import React from 'react';
import { motion } from 'motion/react';
import {
  CalendarDays, FileText, MapPin, CheckCircle2, Clock, Plane, Ban,
  ArrowUpRight, ArrowRight, Bed, Users, Wallet, CreditCard, Moon, UtensilsCrossed
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Booking } from '../../types';
import { formatCurrency, formatDate } from '../../lib/utils';

interface BookingCardProps {
  booking: Booking;
  isID: boolean;
  index?: number;
  onOpenInvoice: (booking: Booking) => void;
  onCancelBooking: (bookingId: string) => void;
}

const STATUS_STRIP: Record<Booking['status'], string> = {
  confirmed: 'bg-gradient-to-r from-emerald-100 to-emerald-200',
  pending: 'bg-gradient-to-r from-amber-100 to-amber-200',
  'checked-in': 'bg-gradient-to-r from-sky-100 to-sky-200',
  completed: 'bg-gradient-to-r from-slate-100 to-slate-200',
  cancelled: 'bg-gradient-to-r from-rose-100 to-rose-200',
};

export const BookingCard: React.FC<BookingCardProps> = ({
  booking, isID, index = 0, onOpenInvoice, onCancelBooking,
}) => (
  <motion.div
    key={booking.id}
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, delay: Math.min(index, 6) * 0.05 }}
    className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(15,23,42,0.07)] transition-all duration-300 overflow-hidden"
  >
    {/* Status accent strip */}
    <div className={`h-1 ${STATUS_STRIP[booking.status]}`} />

    {/* Card Header */}
    <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-[10px] sm:text-[11px] font-mono font-semibold text-slate-500 tracking-wide">
          {booking.bookingCode}
        </span>
        <StatusBadge status={booking.status} isID={isID} />
        {booking.hasBreakfast && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-100 text-[10px] font-semibold text-slate-500">
            <UtensilsCrossed className="w-3 h-3" />
            {isID ? 'Sarapan' : 'Breakfast'}
          </span>
        )}
        {booking.hasAirportShuttle && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-100 text-[10px] font-semibold text-slate-500">
            <Plane className="w-3 h-3" />
            {isID ? 'Shuttle' : 'Shuttle'}
          </span>
        )}
      </div>
      <span className="text-[11px] sm:text-[12px] text-slate-400 font-light flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5 text-slate-300" />
        {isID ? 'Dipesan' : 'Booked'} {booking.bookedAt}
      </span>
    </div>

    {/* Card Body */}
    <div className="p-4 sm:p-6 flex flex-col md:flex-row gap-4 sm:gap-6">
      {/* Image */}
      <div className="w-full md:w-52 shrink-0">
        <div className="aspect-[16/9] sm:aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 ring-1 ring-slate-100 shadow-sm">
          <img
            src={booking.hotelImage}
            alt={booking.hotelName}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-3.5 sm:space-y-4">
        <div>
          <h3 className="text-xl sm:text-2xl font-semibold font-serif text-slate-950 tracking-tight leading-snug">
            {booking.hotelName}
          </h3>
          <div className="flex items-center gap-1.5 mt-1.5 text-xs sm:text-[13px] text-slate-400 font-light">
            <span className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
            </span>
            <span className="truncate">{booking.hotelLocation}</span>
          </div>
        </div>

        {/* Stay Summary */}
        <div className="flex flex-wrap items-center gap-2 p-2.5 sm:p-3 rounded-2xl bg-slate-50/70 border border-slate-100">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-slate-100 text-xs sm:text-[13px] font-semibold text-slate-700 shadow-sm">
            <CalendarDays className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {formatDate(booking.checkIn, isID ? 'ID' : 'EN')}
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-slate-100 text-xs sm:text-[13px] font-semibold text-slate-700 shadow-sm">
            <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
            {formatDate(booking.checkOut, isID ? 'ID' : 'EN')}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/70 border border-slate-100 text-[12px] font-bold text-slate-600">
            <Moon className="w-3.5 h-3.5" />
            {booking.nights} {isID ? 'malam' : 'nights'}
          </span>
        </div>

        {/* Detail Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <DetailItem
            icon={Bed}
            label={isID ? 'Tipe Kamar' : 'Room Type'}
            value={booking.roomType}
            sub={[booking.bedType, booking.roomSize].filter(Boolean).join(' · ')}
          />
          <DetailItem
            icon={Users}
            label={isID ? 'Tamu' : 'Guests'}
            value={`${booking.guests.adults} ${isID ? 'dewasa' : 'adult'}${booking.guests.children > 0 ? `, ${booking.guests.children} ${isID ? 'anak' : 'child'}` : ''}`}
          />
          <DetailItem
            icon={CreditCard}
            label={isID ? 'Pembayaran' : 'Payment'}
            value={booking.paymentMethod}
          />
          <DetailItem
            icon={Wallet}
            label={isID ? 'Total' : 'Total'}
            value={formatCurrency(booking.totalPrice)}
            highlight
          />
        </div>
      </div>
    </div>

    {/* Card Footer */}
    <div className="px-6 py-4 bg-slate-50/60 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <PaymentStatus booking={booking} isID={isID} />

      <div className="flex items-center gap-2.5 w-full sm:w-auto">
        {(booking.status === 'confirmed' || booking.status === 'pending') && (
          <button
            onClick={() => onCancelBooking(booking.id)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 text-[12px] font-semibold transition-all duration-200 flex items-center gap-1.5"
          >
            <Ban className="w-3.5 h-3.5" />
            {isID ? 'Batalkan' : 'Cancel'}
          </button>
        )}

        <button
          onClick={() => onOpenInvoice(booking)}
          className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-slate-950 text-white hover:bg-slate-800 text-[12px] font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(15,23,42,0.15)] active:scale-[0.97]"
        >
          <FileText className="w-4 h-4" />
          Invoice
          <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
        </button>
      </div>
    </div>
  </motion.div>
);

export const StatusBadge: React.FC<{ status: Booking['status']; isID: boolean }> = ({ status, isID }) => {
  const config: Record<Booking['status'], { bg: string; border: string; text: string; dot: string; label: string }> = {
    confirmed: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      text: 'text-emerald-700',
      dot: 'bg-emerald-500',
      label: isID ? 'Terkonfirmasi' : 'Confirmed',
    },
    completed: {
      bg: 'bg-slate-50',
      border: 'border-slate-100',
      text: 'text-slate-600',
      dot: 'bg-slate-400',
      label: isID ? 'Selesai' : 'Completed',
    },
    'checked-in': {
      bg: 'bg-sky-50',
      border: 'border-sky-100',
      text: 'text-sky-700',
      dot: 'bg-sky-500',
      label: isID ? 'Check-in' : 'Checked-in',
    },
    pending: {
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      text: 'text-amber-700',
      dot: 'bg-amber-500',
      label: isID ? 'Menunggu' : 'Pending',
    },
    cancelled: {
      bg: 'bg-rose-50',
      border: 'border-rose-100',
      text: 'text-rose-700',
      dot: 'bg-rose-500',
      label: isID ? 'Dibatalkan' : 'Cancelled',
    },
  };

  const c = config[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${c.bg} ${c.border} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
};

export const PaymentStatus: React.FC<{ booking: Booking; isID: boolean }> = ({ booking, isID }) => {
  const { paymentStatus, paymentMethod } = booking;
  if (paymentStatus === 'paid') {
    return (
      <span className="inline-flex items-center gap-2 text-[12px] font-medium text-emerald-700">
        <span className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
        </span>
        {isID ? 'Pembayaran lunas via' : 'Paid via'} {paymentMethod}
      </span>
    );
  }
  if (paymentStatus === 'pending') {
    return (
      <span className="inline-flex items-center gap-2 text-[12px] font-medium text-amber-700">
        <span className="w-6 h-6 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
          <Clock className="w-3.5 h-3.5 text-amber-500" />
        </span>
        {isID ? 'Menunggu pembayaran' : 'Payment pending'}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 text-[12px] font-medium text-rose-600">
      <span className="w-6 h-6 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center">
        <Ban className="w-3.5 h-3.5 text-rose-500" />
      </span>
      {isID ? 'Pengembalian dana diproses' : 'Refund in progress'}
    </span>
  );
};

const DetailItem: React.FC<{
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}> = ({ icon: Icon, label, value, sub, highlight }) => (
  <div className={`flex items-center gap-3 p-3 rounded-2xl border ${highlight ? 'bg-slate-50 border-slate-200' : 'bg-slate-50/60 border-slate-100/80'}`}>
    <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${highlight ? 'bg-white border border-slate-200' : 'bg-white border border-slate-100'}`}>
      <Icon className={`w-4 h-4 ${highlight ? 'text-slate-900' : 'text-slate-400'}`} />
    </span>
    <div className="min-w-0 space-y-0.5">
      <span className={`text-[10px] font-semibold uppercase tracking-wider block ${highlight ? 'text-slate-500' : 'text-slate-400'}`}>
        {label}
      </span>
      <span className={`text-[13px] font-semibold block truncate ${highlight ? 'text-slate-950' : 'text-slate-700'}`}>
        {value}
      </span>
      {sub && (
        <span className="text-[11px] font-light block truncate text-slate-400">
          {sub}
        </span>
      )}
    </div>
  </div>
);
