import type { ReactNode } from 'react';
import {
  AlertCircle, Ban, BedDouble, Building2, CalendarArrowDown, CalendarArrowUp,
  Check, CreditCard, DoorOpen, KeyRound, LoaderCircle, LogOut, Undo2,
} from 'lucide-react';
import { StatusPill } from '../admin/StatusPill';
import { StayScheduleTime } from '../booking/StayScheduleTime';
import { formatCurrency, formatDate } from '../../lib/utils';
import type { Language } from '../../types';
import type { BookingResponse, BookingStatus, PaymentResponse, RoomUnitResponse } from '../../types/api';

export const frontDeskCard = 'min-w-0 rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6';
export const frontDeskPrimary = 'inline-flex min-h-12 cursor-pointer items-center justify-center gap-2.5 rounded-xl bg-navy-dark px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-600';
const secondaryButton = 'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60';

const bookingLabels: Record<BookingStatus, [string, string]> = {
  PENDING: ['Menunggu konfirmasi', 'Pending confirmation'],
  WAITING_PAYMENT: ['Menunggu pembayaran', 'Awaiting payment'],
  CONFIRMED: ['Dikonfirmasi', 'Confirmed'],
  CANCELLED: ['Dibatalkan', 'Cancelled'],
  CHECKED_IN: ['Sedang menginap', 'Checked in'],
  CHECKED_OUT: ['Selesai check-out', 'Checked out'],
  NO_SHOW: ['Tamu tidak hadir', 'No-show'],
  EXPIRED: ['Kedaluwarsa', 'Expired'],
};

const paymentLabels: Record<BookingResponse['paymentStatus'], [string, string]> = {
  UNPAID: ['Belum dibayar', 'Unpaid'],
  PENDING: ['Menunggu pembayaran', 'Payment pending'],
  PAID: ['Lunas', 'Paid'],
  FAILED: ['Gagal', 'Failed'],
  EXPIRED: ['Kedaluwarsa', 'Expired'],
  REFUNDED: ['Dana dikembalikan', 'Refunded'],
  CANCELLED: ['Dibatalkan', 'Cancelled'],
};

export function FrontDeskNotice({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm leading-5 text-rose-800">
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0 break-words">{children}</div>
    </div>
  );
}

export function ReservationCard({ booking, language }: { booking: BookingResponse; language: Language }) {
  const isID = language === 'ID';
  const guest = booking.guests.find((person) => person.isPrimaryGuest) ?? booking.guests[0];
  const details = [
    { icon: Building2, label: 'Hotel', value: booking.hotelName || `Hotel #${booking.hotelId}` },
    { icon: BedDouble, label: isID ? 'Tipe kamar' : 'Room type', value: booking.roomName || `${isID ? 'Kamar' : 'Room'} #${booking.roomId}` },
    { icon: CalendarArrowDown, label: 'Check-in', value: formatDate(booking.checkInDate, language),
      schedule: <StayScheduleTime time={booking.checkInTime} isID={isID} /> },
    { icon: CalendarArrowUp, label: 'Check-out', value: formatDate(booking.checkOutDate, language),
      schedule: <StayScheduleTime time={booking.checkOutTime} checkout isID={isID} /> },
  ];

  return (
    <section className={frontDeskCard} aria-labelledby="reception-reservation">
      <div className="flex flex-wrap items-start justify-between gap-x-5 gap-y-3">
        <div className="min-w-0">
          <h2 id="reception-reservation" className="text-sm font-semibold text-slate-600">{isID ? 'Tamu utama' : 'Primary guest'}</h2>
          <p className="mt-1 break-words font-serif text-2xl leading-tight text-navy-dark sm:text-[30px]">{guest?.fullName || '—'}</p>
        </div>
        <StatusPill status={booking.status} label={bookingLabels[booking.status]?.[isID ? 0 : 1]} />
      </div>
      <code className="mt-3 block break-all font-mono text-xs font-semibold text-navy">{booking.bookingCode}</code>
      <dl className="mt-5 grid grid-cols-1 gap-x-5 gap-y-4 border-t border-slate-200 pt-5 min-[380px]:grid-cols-2">
        {details.map(({ icon: Icon, label, value, schedule }) => (
          <div key={label} className="flex min-w-0 items-start gap-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-navy">
              <Icon className="size-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <dt className="text-xs font-medium text-slate-600">{label}</dt>
              <dd className="mt-0.5 break-words text-sm font-semibold text-slate-900">{value || '—'}{schedule}</dd>
            </div>
          </div>
        ))}
      </dl>
      {(booking.checkInTime || booking.checkOutTime) && (
        <p className="mt-3 text-xs text-slate-500">{isID ? 'Waktu setempat di hotel' : 'Local hotel time'}</p>
      )}
    </section>
  );
}

interface StayPanelProps {
  booking: BookingResponse;
  isID: boolean;
  units: RoomUnitResponse[];
  unitsLoading: boolean;
  selectedRoom: number | null;
  onSelectRoom: (id: number) => void;
  error: string | null;
  submitting: boolean;
  blocked: boolean;
  onConfirm: () => void;
}

export function StayPanel({ booking, isID, units, unitsLoading, selectedRoom, onSelectRoom, error, submitting, blocked, onConfirm }: StayPanelProps) {
  const arriving = booking.status === 'CONFIRMED';
  const departing = booking.status === 'CHECKED_IN';
  const Icon = arriving ? KeyRound : departing ? LogOut : DoorOpen;

  return (
    <section className={frontDeskCard + ' border-t-2 border-t-gold-light'} aria-labelledby="reception-stay">
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gold-soft text-gold-dark"><Icon className="size-5" aria-hidden /></span>
        <h2 id="reception-stay" className="text-lg font-semibold text-navy-dark">
          {arriving ? 'Check-in' : departing ? 'Check-out' : isID ? 'Status masa inap' : 'Stay status'}
        </h2>
      </div>

      {arriving && (
        <fieldset className="mt-4 min-w-0" disabled={submitting || blocked}>
          <legend className="text-sm font-semibold text-slate-900">{isID ? 'Pilih kamar fisik' : 'Assign a room'}</legend>
          {unitsLoading ? (
            <p role="status" className="mt-3 flex items-center gap-2 text-sm text-slate-600"><LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden />{isID ? 'Memuat kamar tersedia…' : 'Loading available rooms…'}</p>
          ) : units.length > 0 ? (
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              {units.map((unit) => (
                <label key={unit.id} className={`flex min-h-14 min-w-0 cursor-pointer items-center justify-between gap-1.5 rounded-xl border px-3 py-2 text-sm transition-colors focus-within:ring-2 focus-within:ring-navy/60 ${selectedRoom === unit.id ? 'border-navy bg-navy-soft text-navy-dark' : 'border-slate-200 bg-white text-slate-800 hover:border-navy/40'}`}>
                  <input type="radio" name="room-unit" value={unit.id} checked={selectedRoom === unit.id} onChange={() => onSelectRoom(unit.id)} className="sr-only" />
                  <span className="min-w-0">
                    <span className="block break-words font-semibold">{unit.roomNumber}</span>
                    {unit.floor != null && <span className="block text-xs text-slate-600">{isID ? 'Lantai' : 'Floor'} {unit.floor}</span>}
                  </span>
                  <span className={`grid size-5 shrink-0 place-items-center rounded-full border ${selectedRoom === unit.id ? 'border-navy bg-navy text-white' : 'border-slate-300'}`} aria-hidden>
                    {selectedRoom === unit.id && <Check className="size-3" />}
                  </span>
                </label>
              ))}
            </div>
          ) : !error && (
            <p className="mt-2 rounded-lg bg-amber-50 p-3 text-sm leading-5 text-amber-900">{isID ? 'Belum ada kamar yang tersedia untuk tipe ini.' : 'No rooms of this type are available.'}</p>
          )}
        </fieldset>
      )}
      {departing && (
        <p className="mt-4 text-sm leading-6 text-slate-600">
          {isID ? 'Check-out akan menutup masa inap dan menandai kamar untuk dibersihkan.' : 'Checking out closes the stay and marks the room for cleaning.'}
        </p>
      )}
      {!arriving && !departing && (
        <p className="mt-4 rounded-xl bg-slate-50 p-3.5 text-sm leading-6 text-slate-600">
          {isID ? 'Reservasi dengan status ini tidak bisa diproses untuk check-in atau check-out.' : 'This reservation status does not allow check-in or check-out.'}
        </p>
      )}
      {error && <div className="mt-4"><FrontDeskNotice>{error}</FrontDeskNotice></div>}
      {(arriving || departing) && (
        <button type="button" onClick={onConfirm} disabled={submitting || blocked || (arriving && (unitsLoading || selectedRoom == null))} aria-busy={submitting} className={frontDeskPrimary + ' mt-4 w-full'}>
          {submitting ? <LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden /> : <Icon className="size-4" aria-hidden />}
          {submitting ? (isID ? 'Memproses…' : 'Processing…') : arriving ? (isID ? 'Konfirmasi check-in' : 'Confirm check-in') : (isID ? 'Konfirmasi check-out' : 'Confirm check-out')}
        </button>
      )}
    </section>
  );
}

export type PaymentAction = 'CANCEL' | 'REFUND';

interface PaymentPanelProps {
  booking: BookingResponse;
  payment: PaymentResponse | null;
  isID: boolean;
  loading: boolean;
  error: string | null;
  action: PaymentAction | null;
  submitting: boolean;
  blocked: boolean;
  reason: string;
  onReason: (value: string) => void;
  onRequest: (action: PaymentAction | null) => void;
  onConfirm: () => void;
}

export function PaymentPanel({ booking, payment, isID, loading, error, action, submitting, blocked, reason, onReason, onRequest, onConfirm }: PaymentPanelProps) {
  const status = payment?.status ?? booking.paymentStatus;
  const canCancel = !!payment && !['PAID', 'CANCELLED', 'EXPIRED', 'REFUNDED'].includes(payment.status);
  const canRefund = payment?.status === 'PAID' && ['CANCELLED', 'EXPIRED', 'NO_SHOW'].includes(booking.status);

  return (
    <section className={frontDeskCard} aria-labelledby="reception-payment">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-navy-soft text-navy"><CreditCard className="size-5" aria-hidden /></span>
          <div className="min-w-0">
            <h2 id="reception-payment" className="text-base font-semibold text-navy-dark">{isID ? 'Pembayaran' : 'Payment'}</h2>
            {payment && <p className="break-all font-mono text-xs text-slate-600">{payment.paymentCode}</p>}
          </div>
        </div>
        <StatusPill status={status} label={paymentLabels[status]?.[isID ? 0 : 1]} />
      </div>

      {loading && <p role="status" className="mt-4 flex items-center gap-2 text-sm text-slate-600"><LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden />{isID ? 'Memuat transaksi…' : 'Loading transaction…'}</p>}
      {!loading && !payment && !error && <p className="mt-4 text-sm text-slate-600">{isID ? 'Belum ada transaksi untuk reservasi ini.' : 'This reservation has no payment transaction.'}</p>}
      {payment && (
        <>
          <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3.5">
            <div><dt className="text-xs text-slate-600">{isID ? 'Total transaksi' : 'Transaction total'}</dt><dd className="mt-1 break-words text-base font-semibold tabular-nums text-navy-dark">{formatCurrency(payment.amount)}</dd></div>
            <div><dt className="text-xs text-slate-600">{isID ? 'Metode' : 'Method'}</dt><dd className="mt-1 break-words text-sm font-semibold text-slate-800">{payment.paymentMethod || '—'}</dd></div>
          </dl>

          {!action && (canCancel || canRefund) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {canCancel && <button type="button" onClick={() => onRequest('CANCEL')} disabled={blocked} className={secondaryButton + ' border-rose-200 text-rose-800 hover:bg-rose-50'}><Ban className="size-4" aria-hidden />{isID ? 'Batalkan pembayaran' : 'Cancel payment'}</button>}
              {canRefund && <button type="button" onClick={() => onRequest('REFUND')} disabled={blocked} className={secondaryButton + ' border-amber-200 text-amber-900 hover:bg-amber-50'}><Undo2 className="size-4" aria-hidden />{isID ? 'Kembalikan dana' : 'Refund'}</button>}
            </div>
          )}

          {action && (
            <div className="mt-4 space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-medium leading-5 text-amber-950">
                {action === 'CANCEL'
                  ? (isID ? 'Batalkan transaksi yang belum selesai ini?' : 'Cancel this unsettled transaction?')
                  : (isID ? 'Konfirmasi pengembalian dana penuh. Tindakan ini tidak dapat dibatalkan.' : 'Confirm the full refund. This action cannot be undone.')}
              </p>
              {action === 'REFUND' && (
                <label className="block text-sm font-medium text-slate-700">
                  {isID ? 'Alasan pengembalian dana (opsional)' : 'Refund reason (optional)'}
                  <textarea value={reason} onChange={(event) => onReason(event.target.value)} disabled={submitting} rows={2} maxLength={500} className="mt-1.5 block w-full resize-y rounded-lg border border-amber-200 bg-white p-2.5 text-base" />
                </label>
              )}
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => onRequest(null)} disabled={submitting} className={secondaryButton + ' border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}>{isID ? 'Kembali' : 'Back'}</button>
                <button type="button" onClick={onConfirm} disabled={submitting || blocked} aria-busy={submitting} className={secondaryButton + ' border-rose-700 bg-rose-700 text-white hover:bg-rose-800'}>
                  {submitting && <LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden />}
                  {action === 'CANCEL' ? (isID ? 'Ya, batalkan' : 'Yes, cancel') : (isID ? 'Proses pengembalian' : 'Process refund')}
                </button>
              </div>
            </div>
          )}
        </>
      )}
      {error && <div className="mt-4"><FrontDeskNotice>{error}</FrontDeskNotice></div>}
    </section>
  );
}
