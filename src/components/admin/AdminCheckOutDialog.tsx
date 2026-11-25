import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Check, LoaderCircle, LogOut, Sparkles } from 'lucide-react';
import { ApiError } from '../../lib/http';
import { formatDate } from '../../lib/utils';
import type { Booking, Language } from '../../types';
import type { BookingResponse } from '../../types/api';
import { StayScheduleTime } from '../booking/StayScheduleTime';
import { OperationsDialog } from './OperationsDialog';

const button = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60';

export function AdminCheckOutDialog({ booking, language, blocked, onClose, onConfirm }: {
  booking: Booking;
  language: Language;
  blocked: boolean;
  onClose: () => void;
  onConfirm: (bookingId: string) => Promise<BookingResponse>;
}) {
  const isID = language === 'ID';
  const submitting = useRef(false);
  const doneButton = useRef<HTMLButtonElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BookingResponse | null>(null);

  useEffect(() => {
    if (result) doneButton.current?.focus();
  }, [result]);

  const submit = async () => {
    if (submitting.current || blocked || result) return;
    submitting.current = true;
    setBusy(true);
    setError(null);
    try {
      setResult(await onConfirm(booking.id));
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : isID
        ? 'Check-out belum dapat dikonfirmasi. Silakan coba lagi.'
        : 'Check-out could not be confirmed. Please try again.');
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };

  const checkedOut = result?.checkedOutAt ? new Date(result.checkedOutAt) : null;
  const recordedTime = checkedOut && Number.isFinite(checkedOut.getTime())
    ? new Intl.DateTimeFormat(isID ? 'id-ID' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(checkedOut)
    : null;

  return (
    <OperationsDialog
      title={result ? (isID ? 'Check-out berhasil' : 'Check-out complete') : (isID ? 'Konfirmasi check-out' : 'Confirm check-out')}
      description={booking.bookingCode}
      isID={isID}
      busy={busy}
      onClose={onClose}
      footer={
        <div className="grid gap-2 sm:flex sm:justify-end">
          {result ? (
            <button ref={doneButton} type="button" className={`${button} bg-navy-dark text-white hover:bg-navy`} onClick={onClose}>
              {isID ? 'Selesai' : 'Done'}
            </button>
          ) : (
            <>
              <button type="button" className={`${button} border border-slate-200 bg-white text-navy-dark hover:bg-slate-50`} onClick={onClose} disabled={busy}>
                {isID ? 'Kembali' : 'Back'}
              </button>
              <button type="button" className={`${button} bg-navy-dark text-white hover:bg-navy`} onClick={() => void submit()} disabled={busy || blocked}>
                {busy ? <LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden /> : <LogOut className="size-4" aria-hidden />}
                {busy ? (isID ? 'Memproses…' : 'Processing…') : (isID ? 'Konfirmasi check-out' : 'Confirm check-out')}
              </button>
            </>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {result ? (
          <div role="status" className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            <Check className="mt-0.5 size-4 shrink-0" aria-hidden />
            <div>
              <p className="font-semibold">{isID ? 'Reservasi berstatus Selesai.' : 'The reservation is complete.'}</p>
              {recordedTime && <time className="mt-1 block tabular-nums" dateTime={result.checkedOutAt ?? undefined}>{recordedTime}</time>}
            </div>
          </div>
        ) : (
          <p className="text-sm leading-6 text-slate-700">
            {isID ? 'Pastikan tamu sudah meninggalkan kamar sebelum menyelesaikan reservasi.' : 'Confirm that the guest has left the room before completing the reservation.'}
          </p>
        )}

        <dl className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm sm:px-4">
          <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 py-3">
            <dt className="text-slate-600">{isID ? 'Tamu utama' : 'Primary guest'}</dt>
            <dd className="break-words font-semibold text-navy-dark">{booking.guestName || '—'}</dd>
          </div>
          <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 py-3">
            <dt className="text-slate-600">{isID ? 'Hotel dan kamar' : 'Hotel and room'}</dt>
            <dd className="break-words text-navy-dark">
              <span className="font-semibold">{booking.hotelName}</span>
              <span className="mt-0.5 block text-xs text-slate-600">{booking.roomType}</span>
            </dd>
          </div>
          <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 py-3">
            <dt className="text-slate-600">{isID ? 'Jadwal check-out' : 'Scheduled check-out'}</dt>
            <dd className="text-navy-dark">
              {formatDate(booking.checkOut, language)}
              <StayScheduleTime time={booking.checkOutTime} checkout isID={isID} />
            </dd>
          </div>
        </dl>

        <p className="flex items-start gap-2 text-sm leading-5 text-slate-700">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-navy" aria-hidden />
          {result
            ? (isID ? 'Kamar ditandai perlu dibersihkan.' : 'The room was marked for cleaning.')
            : (isID ? 'Kamar akan ditandai perlu dibersihkan.' : 'The room will be marked for cleaning.')}
        </p>

        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {error}
          </p>
        )}
      </div>
    </OperationsDialog>
  );
}
