import type { Booking } from '../types';

export type BookingFilter = 'all' | 'pending' | 'active' | 'completed' | 'cancelled' | 'ended';

type StatusSource = Pick<Booking, 'status' | 'paymentStatus' | 'sourceStatus' | 'holdExpiresAt'>;

/** LocalDateTime values from Roomly use the service's Asia/Jakarta clock. */
export function bookingHoldTime(value: string): number {
  return Date.parse(/(?:Z|[+-]\d{2}:?\d{2})$/i.test(value) ? value : `${value}+07:00`);
}

export function isBookingEnded(booking: StatusSource): boolean {
  return booking.sourceStatus === 'EXPIRED'
    || booking.sourceStatus === 'NO_SHOW'
    // The expiry worker also closes unpaid holds without a cancellation record.
    || (booking.status === 'cancelled' && booking.paymentStatus === 'expired');
}

export function bookingMatchesFilter(booking: Booking, filter: BookingFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'ended') return isBookingEnded(booking);
  if (isBookingEnded(booking)) return false;
  if (filter === 'active') return booking.status === 'confirmed' || booking.status === 'checked-in';
  if (filter === 'pending') return booking.status === 'pending';
  return booking.status === filter;
}

export function canResumePayment(booking: Booking, now = Date.now()): boolean {
  if (booking.status !== 'pending' || isBookingEnded(booking)) return false;
  if (![booking.id, booking.hotelId, booking.roomId].every(id => id && /^\d+$/.test(id) && Number(id) > 0)) return false;
  if (!['unpaid', 'pending', 'failed'].includes(booking.paymentStatus)) return false;
  if (booking.holdExpiresAt) {
    const deadline = bookingHoldTime(booking.holdExpiresAt);
    if (!Number.isFinite(deadline) || deadline <= now) return false;
  }
  return true;
}

export function canCancelBooking(booking: Booking): boolean {
  if (isBookingEnded(booking)) return false;
  return booking.sourceStatus
    ? ['PENDING', 'WAITING_PAYMENT', 'CONFIRMED'].includes(booking.sourceStatus)
    : booking.status === 'pending' || booking.status === 'confirmed';
}

export function hasCancellationDetails(booking: Booking): boolean {
  if (isBookingEnded(booking)) return false;
  return booking.sourceStatus ? booking.sourceStatus === 'CANCELLED' : booking.status === 'cancelled';
}

export function getBookingStatus(booking: StatusSource, isID: boolean): { label: string; className: string } {
  if (booking.sourceStatus === 'NO_SHOW') return { label: isID ? 'Tidak hadir' : 'No-show', className: 'border-slate-200 bg-slate-100 text-slate-700' };
  if (isBookingEnded(booking)) return { label: isID ? 'Kedaluwarsa' : 'Expired', className: 'border-slate-200 bg-slate-100 text-slate-700' };
  return {
    pending: { label: booking.paymentStatus === 'paid' ? (isID ? 'Menunggu konfirmasi' : 'Awaiting confirmation') : (isID ? 'Menunggu pembayaran' : 'Awaiting payment'), className: 'border-amber-200 bg-amber-50 text-amber-800' },
    confirmed: { label: isID ? 'Terkonfirmasi' : 'Confirmed', className: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
    'checked-in': { label: isID ? 'Sedang menginap' : 'Checked in', className: 'border-sky-200 bg-sky-50 text-sky-800' },
    completed: { label: isID ? 'Selesai' : 'Completed', className: 'border-slate-200 bg-slate-100 text-slate-600' },
    cancelled: { label: isID ? 'Dibatalkan' : 'Cancelled', className: 'border-rose-200 bg-rose-50 text-rose-700' },
  }[booking.status];
}

/** Stay dates have no timezone; format them locally without shifting the day. */
export function formatStayDate(value: string, isID: boolean): string {
  if (!value) return '—';
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value);
  if (!Number.isFinite(date.getTime())) return value;
  return new Intl.DateTimeFormat(isID ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}
