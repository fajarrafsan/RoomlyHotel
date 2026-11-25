import React, { useId, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Ban, BedDouble, CalendarDays, CheckCircle2, ChevronDown, Clock3,
  CreditCard, FileText, MapPin, Moon, Plane, Users, UtensilsCrossed,
} from 'lucide-react';
import { Booking } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { applyImageFallback } from '../../lib/imageFallback';
import { StayScheduleTime } from './StayScheduleTime';
import {
  bookingHoldTime, canCancelBooking, canResumePayment, formatStayDate,
  getBookingStatus, hasCancellationDetails,
} from '../../lib/bookingPresentation';

interface BookingCardProps {
  booking: Booking;
  isID: boolean;
  index?: number;
  invoiceAvailable?: boolean;
  onOpenInvoice: (booking: Booking) => void;
  onCancelBooking: (bookingId: string) => void;
  onViewCancellation: (bookingId: string) => void;
}

const actionClass = 'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 text-[13px] font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-navy';

export const BookingCard: React.FC<BookingCardProps> = ({
  booking, isID, index = 0, invoiceAvailable = false, onOpenInvoice, onCancelBooking, onViewCancellation,
}) => {
  const [expanded, setExpanded] = useState(false);
  const detailsId = useId();
  const titleId = useId();
  const reduceMotion = useReducedMotion();
  const resume = canResumePayment(booking);
  const roomSpecs = [booking.bedType, booking.roomSize].filter(value => value && value !== '—').join(' · ');
  const guestCount = booking.guests.adults + booking.guests.children;
  const holdEnded = booking.status === 'pending' && !!booking.holdExpiresAt && bookingHoldTime(booking.holdExpiresAt) <= Date.now();
  const guestLabel = `${booking.guests.adults} ${isID ? 'dewasa' : booking.guests.adults === 1 ? 'adult' : 'adults'}${booking.guests.children ? ` · ${booking.guests.children} ${isID ? 'anak' : booking.guests.children === 1 ? 'child' : 'children'}` : ''}`;

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }}
      transition={{ duration: reduceMotion ? 0 : 0.22, delay: reduceMotion ? 0 : Math.min(index, 4) * 0.035 }}
      className="overflow-hidden rounded-[26px] border border-slate-200/90 bg-white shadow-[0_8px_30px_rgba(15,35,68,0.045)] transition-shadow duration-200 hover:shadow-[0_14px_40px_rgba(15,35,68,0.085)]"
      aria-labelledby={titleId} data-booking-card data-booking-id={booking.id}
    >
      <div className="grid md:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[250px_minmax(0,1fr)]">
        <div className="relative h-[180px] overflow-hidden bg-navy-soft md:h-auto md:min-h-[246px]">
          <img src={booking.hotelImage} alt={booking.hotelName} onError={applyImageFallback} loading="lazy" className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1f3a]/75 via-transparent to-[#0b1f3a]/10" aria-hidden />
          <div className="absolute left-4 top-4"><StatusBadge status={booking.status} isID={isID} booking={booking} /></div>
          <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3 text-white">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-[#0b1f3a]/35 px-3 py-1.5 text-xs font-medium backdrop-blur-sm"><Moon className="size-3.5 text-gold-light" aria-hidden />{booking.nights} {isID ? 'malam' : booking.nights === 1 ? 'night' : 'nights'}</span>
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/85" aria-hidden>Roomly stay</span>
          </div>
        </div>

        <div className="min-w-0 px-5 py-5 sm:px-6">
          <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium text-slate-500">
            <span className="font-mono tracking-wide text-navy" aria-label={`${isID ? 'Kode pesanan' : 'Booking code'} ${booking.bookingCode}`}>{booking.bookingCode}</span>
            <span className="text-slate-300" aria-hidden>·</span>
            <span>{isID ? 'Reservasi hotel' : 'Hotel reservation'}</span>
          </div>
          <h3 id={titleId} className="break-words font-serif text-[23px] leading-[1.25] tracking-[-0.025em] text-navy-dark sm:text-[25px]">{booking.hotelName}</h3>
          {(booking.hotelLocation || booking.hotelAddress) && <p className="mt-1.5 flex items-start gap-1.5 text-[13px] leading-5 text-slate-500"><MapPin className="mt-0.5 size-3.5 shrink-0 text-gold" aria-hidden /><span>{booking.hotelLocation || booking.hotelAddress}</span></p>}

          <div className="relative mt-4 rounded-2xl border border-slate-200/75 bg-slate-50/80 px-3 py-3 sm:px-4">
            <ArrowRight className="pointer-events-none absolute left-1/2 top-[2.1rem] size-4 -translate-x-1/2 text-slate-400" aria-hidden />
            <dl className="grid grid-cols-2 gap-x-6">
              <div className="min-w-0">
                <dt className="mb-1 text-xs font-semibold text-slate-600">Check-in</dt>
                <dd className="text-[13px] font-semibold leading-5 text-navy-dark sm:text-sm">
                  {formatStayDate(booking.checkIn, isID)}
                  <StayScheduleTime time={booking.checkInTime} isID={isID} />
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="mb-1 text-xs font-semibold text-slate-600">Check-out</dt>
                <dd className="text-[13px] font-semibold leading-5 text-navy-dark sm:text-sm">
                  {formatStayDate(booking.checkOut, isID)}
                  <StayScheduleTime time={booking.checkOutTime} checkout isID={isID} />
                </dd>
              </div>
            </dl>
            {(booking.checkInTime || booking.checkOutTime) && (
              <p className="mt-2 text-xs text-slate-500">{isID ? 'Waktu setempat di hotel' : 'Local hotel time'}</p>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-end justify-between gap-x-5 gap-y-3">
            <div className="min-w-0 space-y-1.5">
              <p className="flex items-center gap-2 text-[13px] font-semibold text-slate-700"><BedDouble className="size-4 shrink-0 text-slate-400" aria-hidden /><span className="break-words">{booking.roomType}</span></p>
              <p className="flex items-center gap-2 text-xs text-slate-500"><Users className="size-4 shrink-0 text-slate-400" aria-hidden /><span>{guestCount} {isID ? 'tamu' : guestCount === 1 ? 'guest' : 'guests'}<span className="mx-1.5 text-slate-300" aria-hidden>·</span>{guestLabel}</span></p>
            </div>
            <div className="shrink-0"><p className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{isID ? 'Total pesanan' : 'Booking total'}</p><p className="text-[21px] font-bold leading-7 tracking-tight text-navy-dark">{formatCurrency(booking.totalPrice)}</p></div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-3.5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0"><PaymentStatus booking={booking} isID={isID} />{holdEnded && <p className="mt-1 text-xs leading-5 text-slate-500">{isID ? 'Batas pembayaran lewat. Muat ulang untuk melihat status terbaru.' : 'The payment deadline has passed. Refresh for the latest status.'}</p>}</div>
        <div className="flex flex-wrap items-center gap-2">
          {canCancelBooking(booking) && <button type="button" onClick={() => onCancelBooking(booking.id)} className={`${actionClass} px-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700`}>{isID ? 'Batalkan' : 'Cancel'}</button>}
          {hasCancellationDetails(booking) && <button type="button" onClick={() => onViewCancellation(booking.id)} className={`${actionClass} border border-rose-100 text-rose-700 hover:bg-rose-50`}><Ban className="size-3.5" aria-hidden />{isID ? 'Rincian pembatalan' : 'Cancellation details'}</button>}
          {invoiceAvailable && <button type="button" onClick={() => onOpenInvoice(booking)} className={`${actionClass} border border-slate-200 text-navy-dark hover:bg-navy-soft`}><FileText className="size-4" aria-hidden />Invoice</button>}
          <button type="button" aria-expanded={expanded} aria-controls={detailsId} onClick={() => setExpanded(value => !value)} className={`${actionClass} flex-1 sm:flex-none ${resume ? 'border border-slate-200 text-navy-dark hover:bg-navy-soft' : 'bg-navy-dark text-white hover:bg-navy'}`}>{isID ? (expanded ? 'Tutup detail' : 'Detail pesanan') : (expanded ? 'Hide details' : 'Booking details')}<ChevronDown className={`size-4 transition-transform duration-200 motion-reduce:transition-none ${expanded ? 'rotate-180' : ''}`} aria-hidden /></button>
          {resume && <Link to={`/booking/${booking.hotelId}/${booking.roomId}?resumeBookingId=${booking.id}`} className={`${actionClass} flex-1 bg-navy-dark text-white hover:bg-navy sm:flex-none`}><CreditCard className="size-4" aria-hidden />{isID ? 'Lanjutkan pembayaran' : 'Resume payment'}</Link>}
        </div>
      </div>

      <div id={detailsId} hidden={!expanded} className="border-t border-slate-200/70 bg-slate-50/70 px-5 py-5 sm:px-6" data-booking-details>
        <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-navy"><CalendarDays className="size-4" aria-hidden />{isID ? 'Rincian menginap' : 'Stay details'}</p>
        <dl className="grid gap-x-8 gap-y-4 text-[13px] sm:grid-cols-2 lg:grid-cols-3">
          <Detail label={isID ? 'Tamu utama' : 'Primary guest'} value={booking.guestName} />
          <Detail label="Email" value={booking.guestEmail} />
          <Detail label={isID ? 'Nomor telepon' : 'Phone number'} value={booking.guestPhone} />
          <Detail label={isID ? 'Detail kamar' : 'Room details'} value={roomSpecs} />
          <Detail label={isID ? 'Pembayaran' : 'Payment'} value={booking.paymentMethod ? (booking.paymentMethod.toLowerCase() === 'midtrans' ? (isID ? 'Melalui Midtrans' : 'Via Midtrans') : booking.paymentMethod) : undefined} />
          <Detail label={isID ? 'Tanggal pemesanan' : 'Booking date'} value={booking.bookedAt ? formatStayDate(booking.bookedAt.replace(' ', 'T'), isID) : undefined} />
        </dl>
        {booking.hotelAddress && <div className="mt-4"><p className="text-xs text-slate-500">{isID ? 'Alamat penginapan' : 'Property address'}</p><p className="mt-1 text-[13px] leading-6 text-slate-700">{booking.hotelAddress}</p></div>}
        {booking.specialRequests && <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3.5"><p className="text-xs font-semibold text-navy-dark">{isID ? 'Permintaan khusus' : 'Special requests'}</p><p className="mt-1 whitespace-pre-wrap break-words text-[13px] leading-6 text-slate-600">{booking.specialRequests}</p><p className="mt-1 text-xs leading-5 text-slate-500">{isID ? 'Pemenuhan mengikuti ketersediaan dan konfirmasi pihak hotel.' : 'Subject to availability and confirmation from the property.'}</p></div>}
        {(booking.hasBreakfast || booking.hasAirportShuttle) && <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-600">{booking.hasBreakfast && <span className="inline-flex items-center gap-1.5"><UtensilsCrossed className="size-3.5" aria-hidden />{isID ? 'Termasuk sarapan' : 'Breakfast included'}</span>}{booking.hasAirportShuttle && <span className="inline-flex items-center gap-1.5"><Plane className="size-3.5" aria-hidden />{isID ? 'Antar-jemput bandara' : 'Airport shuttle'}</span>}</div>}
      </div>
    </motion.article>
  );
};

function Detail({ label, value }: { label: string; value?: string }) {
  if (!value || value === '—') return null;
  return <div className="min-w-0"><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 break-words font-medium leading-6 text-slate-700">{value}</dd></div>;
}

export const StatusBadge: React.FC<{ status: Booking['status']; isID: boolean; booking?: Booking }> = ({ status, isID, booking }) => {
  const presentation = getBookingStatus(booking || { status, paymentStatus: 'unpaid' }, isID);
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold shadow-sm ${presentation.className}`}><span className="size-1.5 rounded-full bg-current" aria-hidden />{presentation.label}</span>;
};

export const PaymentStatus: React.FC<{ booking: Booking; isID: boolean }> = ({ booking, isID }) => {
  const status = booking.paymentStatus;
  const settled = status === 'paid' || status === 'refunded';
  const waiting = status === 'unpaid' || status === 'pending';
  const Icon = settled ? CheckCircle2 : waiting ? Clock3 : Ban;
  const label = {
    paid: isID ? 'Pembayaran lunas' : 'Payment complete',
    refunded: isID ? 'Dana dikembalikan' : 'Payment refunded',
    unpaid: isID ? 'Belum dibayar' : 'Not paid yet',
    pending: isID ? 'Menunggu pembayaran' : 'Payment pending',
    failed: isID ? 'Pembayaran gagal' : 'Payment failed',
    expired: isID ? 'Pembayaran kedaluwarsa' : 'Payment expired',
    cancelled: isID ? 'Pembayaran dibatalkan' : 'Payment cancelled',
  }[status];
  return <span className={`inline-flex items-center gap-2 text-xs font-medium leading-5 ${status === 'paid' ? 'text-emerald-700' : status === 'refunded' ? 'text-violet-700' : waiting ? 'text-amber-800' : 'text-slate-600'}`}><Icon className="size-4 shrink-0" aria-hidden />{label}</span>;
};
