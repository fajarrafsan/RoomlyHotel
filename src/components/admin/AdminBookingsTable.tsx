import { useRef, useState } from 'react';
import { AlertCircle, BadgeCheck, CalendarDays, LoaderCircle, LogOut, Receipt, Search, UserCheck, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StayScheduleTime } from '../booking/StayScheduleTime';
import { ApiError } from '../../lib/http';
import { ADMIN_PATHS } from '../../lib/routes';
import { formatCurrency, formatDate } from '../../lib/utils';
import type { Booking, Language } from '../../types';
import type { BookingResponse } from '../../types/api';
import { AdminCheckOutDialog } from './AdminCheckOutDialog';
import { StatusPill } from './StatusPill';

const statusOptions: Record<Booking['status'], { status: string; id: string; en: string }> = {
  pending: { status: 'PENDING', id: 'Menunggu', en: 'Pending' },
  confirmed: { status: 'CONFIRMED', id: 'Dikonfirmasi', en: 'Confirmed' },
  'checked-in': { status: 'CHECKED_IN', id: 'Menginap', en: 'Checked in' },
  completed: { status: 'CHECKED_OUT', id: 'Selesai', en: 'Completed' },
  cancelled: { status: 'CANCELLED', id: 'Dibatalkan', en: 'Cancelled' },
};

const rowAction = 'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60';
const primaryAction = rowAction + ' cursor-pointer bg-navy-dark text-white hover:bg-navy';
const neutralAction = rowAction + ' cursor-pointer border border-slate-200 bg-white text-navy-dark hover:bg-navy-soft';

interface AdminBookingsTableProps {
  isID: boolean;
  language: Language;
  bookings: Booking[];
  loading: boolean;
  unavailable: boolean;
  blocked: boolean;
  customerEmail: string | null;
  onClearCustomer: () => void;
  onOpenInvoice: (booking: Booking) => void;
  onConfirm: (bookingId: string) => Promise<void>;
  onCheckOut: (bookingId: string) => Promise<BookingResponse>;
}

export function AdminBookingsTable({
  isID, language, bookings, loading, unavailable, blocked, customerEmail, onClearCustomer, onOpenInvoice, onConfirm, onCheckOut,
}: AdminBookingsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Booking['status'] | 'all'>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [checkoutBooking, setCheckoutBooking] = useState<Booking | null>(null);
  const statusSelect = useRef<HTMLSelectElement>(null);
  const term = searchTerm.trim().toLowerCase();

  const filteredBookings = bookings.filter(booking => {
    const guestKey = (booking.guestEmail || booking.guestName || 'unknown').toLowerCase();
    return (!customerEmail || guestKey === customerEmail.toLowerCase())
      && (statusFilter === 'all' || booking.status === statusFilter)
      && (!term || [booking.bookingCode, booking.guestName, booking.guestEmail, booking.hotelName]
        .some(value => value?.toLowerCase().includes(term)));
  });

  const runRowAction = async (bookingId: string, action: () => Promise<void>) => {
    if (busyId || blocked || loading) return;
    setBusyId(bookingId);
    setActionError(null);
    try {
      await action();
    } catch (error) {
      setActionError(error instanceof ApiError ? error.message : (isID ? 'Aksi gagal. Silakan coba lagi.' : 'The action failed. Try again.'));
    } finally {
      setBusyId(null);
    }
  };

  const statusBadge = (booking: Booking) => {
    const status = statusOptions[booking.status];
    return <StatusPill status={status?.status} label={isID ? status?.id : status?.en} />;
  };

  const actions = (booking: Booking) => (
    <div className="flex flex-wrap items-center gap-1.5 lg:justify-end">
      {busyId === booking.id ? (
        <span role="status" className="inline-flex min-h-11 items-center gap-1.5 text-xs font-medium text-slate-600">
          <LoaderCircle className="size-3.5 motion-safe:animate-spin" aria-hidden />{isID ? 'Memproses…' : 'Processing…'}
        </span>
      ) : (
        <>
          {booking.status === 'pending' && (
            <button type="button" disabled={loading || blocked || !!busyId} onClick={() => void runRowAction(booking.id, () => onConfirm(booking.id))} className={primaryAction}>
              <BadgeCheck className="size-3.5" aria-hidden />{isID ? 'Konfirmasi' : 'Confirm'}
            </button>
          )}
          {booking.status === 'confirmed' && (
            <Link to={ADMIN_PATHS.checkIn} className={primaryAction}><UserCheck className="size-3.5" aria-hidden />Check-in</Link>
          )}
          {booking.status === 'checked-in' && (
            <button type="button" disabled={loading || blocked || !!busyId} onClick={() => setCheckoutBooking(booking)} className={primaryAction}>
              <LogOut className="size-3.5" aria-hidden />Check-out
            </button>
          )}
        </>
      )}
      <button type="button" onClick={() => onOpenInvoice(booking)} className={neutralAction}><Receipt className="size-3.5" aria-hidden />Invoice</button>
    </div>
  );

  const emptyMessage = loading
    ? (isID ? 'Memuat reservasi…' : 'Loading reservations…')
    : unavailable
      ? (isID ? 'Daftar reservasi belum dapat dimuat.' : 'The reservations could not be loaded.')
      : (isID ? 'Tidak ada reservasi yang sesuai.' : 'No matching reservations.');

  return (
    <section className="min-w-0 overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm" aria-labelledby="admin-reservations" aria-busy={loading}>
      <div className="space-y-4 p-4 sm:p-5">
        <div>
          <h2 id="admin-reservations" className="text-lg font-semibold text-navy-dark">{isID ? 'Daftar reservasi' : 'Reservations'}</h2>
          <p className="mt-1 text-sm text-slate-600" role="status">{loading ? (isID ? 'Memuat data…' : 'Loading data…') : unavailable ? null : isID ? `${filteredBookings.length} reservasi ditampilkan` : `${filteredBookings.length} reservations shown`}</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
          <label className="relative min-w-0">
            <span className="sr-only">{isID ? 'Cari reservasi' : 'Search reservations'}</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-600" aria-hidden />
            <input type="search" value={searchTerm} onChange={event => setSearchTerm(event.target.value)} placeholder={isID ? 'Cari kode, nama tamu, atau hotel' : 'Search code, guest name, or hotel'} className="h-11 w-full rounded-xl border border-slate-300 bg-slate-50 pr-3 pl-9 text-base text-slate-900 placeholder:text-slate-500 sm:text-sm" />
          </label>
          <select ref={statusSelect} aria-label={isID ? 'Filter status reservasi' : 'Filter reservation status'} value={statusFilter} onChange={event => setStatusFilter(event.target.value as typeof statusFilter)} className="h-11 min-w-0 rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm font-medium text-slate-800">
            <option value="all">{isID ? 'Semua status' : 'All statuses'}</option>
            {Object.entries(statusOptions).map(([key, value]) => <option key={key} value={key}>{isID ? value.id : value.en}</option>)}
          </select>
        </div>
        {customerEmail && (
          <button type="button" onClick={onClearCustomer} aria-label={isID ? 'Hapus filter pelanggan' : 'Clear customer filter'} className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-lg bg-navy-soft px-3 py-1.5 text-left text-sm font-medium text-navy-dark hover:bg-slate-100">
            <span className="min-w-0 break-all">{isID ? 'Pelanggan' : 'Customer'} · {customerEmail}</span>
            <X className="size-4 shrink-0" aria-hidden />
          </button>
        )}
        {actionError && <p role="alert" className="flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"><AlertCircle className="size-4 shrink-0" aria-hidden />{actionError}</p>}
      </div>

      {filteredBookings.length === 0 ? (
        <div className="border-t border-slate-200 px-5 py-8 text-center">
          <CalendarDays className="mx-auto mb-2 size-5 text-slate-500" aria-hidden />
          <p className="text-sm text-slate-600">{emptyMessage}</p>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-slate-200 border-t border-slate-200 lg:hidden">
            {filteredBookings.map(booking => (
              <li key={booking.id} className="space-y-3 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-semibold text-navy-dark">{booking.guestName || '—'}</p>
                    <code className="break-all font-mono text-xs text-slate-600">{booking.bookingCode}</code>
                  </div>
                  {statusBadge(booking)}
                </div>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <div className="min-w-0"><dt className="text-xs text-slate-600">{isID ? 'Hotel / kamar' : 'Hotel / room'}</dt><dd className="break-words text-slate-900">{booking.hotelName}<span className="block text-xs text-slate-600">{booking.roomType}</span></dd></div>
                  <div>
                    <dt className="text-xs text-slate-600">Check-in</dt>
                    <dd>{formatDate(booking.checkIn, language)}<StayScheduleTime time={booking.checkInTime} isID={isID} /></dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-600">Check-out</dt>
                    <dd>{formatDate(booking.checkOut, language)}<StayScheduleTime time={booking.checkOutTime} checkout isID={isID} /></dd>
                  </div>
                  <div><dt className="text-xs text-slate-600">Total</dt><dd className="font-semibold text-navy-dark tabular-nums">{formatCurrency(booking.totalPrice)}</dd></div>
                </dl>
                {actions(booking)}
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto border-t border-slate-200 lg:block">
            <table className="w-full min-w-[790px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th scope="col" className="px-3 py-3">{isID ? 'Tamu / kode' : 'Guest / code'}</th>
                  <th scope="col" className="px-3 py-3">{isID ? 'Hotel / kamar' : 'Hotel / room'}</th>
                  <th scope="col" className="px-3 py-3">Check-in</th>
                  <th scope="col" className="px-3 py-3">Check-out</th>
                  <th scope="col" className="px-3 py-3">Total</th>
                  <th scope="col" className="px-3 py-3">Status</th>
                  <th scope="col" className="px-3 py-3 text-right">{isID ? 'Aksi' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredBookings.map(booking => (
                  <tr key={booking.id} className="hover:bg-slate-50/70">
                    <td className="px-3 py-3"><p className="font-semibold text-navy-dark">{booking.guestName || '—'}</p><code className="break-all font-mono text-xs text-slate-600">{booking.bookingCode}</code></td>
                    <td className="px-3 py-3"><p className="font-medium text-slate-900">{booking.hotelName}</p><p className="text-xs text-slate-600">{booking.roomType}</p></td>
                    <td className="px-3 py-3 text-xs text-slate-700">
                      {formatDate(booking.checkIn, language)}
                      <StayScheduleTime time={booking.checkInTime} isID={isID} />
                      <span className="mt-0.5 block text-slate-600">{booking.nights} {isID ? 'malam' : 'nights'}</span>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-700">
                      {formatDate(booking.checkOut, language)}
                      <StayScheduleTime time={booking.checkOutTime} checkout isID={isID} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 font-semibold text-navy-dark tabular-nums">{formatCurrency(booking.totalPrice)}</td>
                    <td className="px-3 py-3">{statusBadge(booking)}</td>
                    <td className="px-3 py-3">{actions(booking)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {checkoutBooking && (
        <AdminCheckOutDialog
          booking={checkoutBooking} language={language} blocked={loading || blocked || !!busyId}
          onClose={() => {
            setCheckoutBooking(null);
            if (!filteredBookings.some(booking => booking.id === checkoutBooking.id && booking.status === 'checked-in')) {
              statusSelect.current?.focus({ preventScroll: true });
            }
          }}
          onConfirm={onCheckOut}
        />
      )}
    </section>
  );
}
