import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { AlertCircle, ArrowLeft, CheckCircle2, Clock3, Loader2, RefreshCw, ShieldAlert, X } from 'lucide-react';
import type { Booking } from '../../types';
import type { BookingCancellationResponse, CancellationStatus, RefundStatus } from '../../types/api';
import { formatCurrency, formatDate } from '../../lib/utils';

interface BookingCancellationDialogProps {
  booking: Booking | null;
  isID: boolean;
  mode: 'cancel' | 'view';
  reason: string;
  onReasonChange: (value: string) => void;
  busy: boolean;
  error: string | null;
  result: BookingCancellationResponse | null;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  onRetry?: () => void;
}

const cancelLabels: Record<CancellationStatus, [string, string]> = {
  REQUESTED: ['Sedang ditinjau', 'Under review'],
  COMPLETED: ['Selesai', 'Completed'],
  REJECTED: ['Ditolak', 'Rejected'],
};

const refundLabels: Record<RefundStatus, [string, string]> = {
  NOT_REQUIRED: ['Tidak diperlukan', 'Not required'],
  PENDING: ['Menunggu proses', 'Pending'],
  PROCESSING: ['Sedang diproses', 'Processing'],
  REFUNDED: ['Dana dikembalikan', 'Refunded'],
  FAILED: ['Proses gagal', 'Failed'],
  REJECTED: ['Ditolak', 'Rejected'],
};

const buttonBase = 'inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors duration-200 disabled:cursor-wait disabled:opacity-50';

export function BookingCancellationDialog({ booking, isID, mode, reason, onReasonChange, busy, error, result, onClose, onSubmit, onRetry }: BookingCancellationDialogProps) {
  const open = Boolean(booking);
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const descriptionId = useId();
  const reasonId = useId();
  const hintId = useId();
  const errorId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const safeActionRef = useRef<HTMLButtonElement>(null);
  const stateRef = useRef({ busy, onClose });
  stateRef.current = { busy, onClose };
  const submittedRef = useRef(false);

  useEffect(() => {
    if (!busy) submittedRef.current = false;
  }, [busy, booking?.id, mode]);

  useEffect(() => {
    if (!open) return;
    const priorFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const priorOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (safeActionRef.current && !safeActionRef.current.disabled) safeActionRef.current.focus({ preventScroll: true });
    else panelRef.current?.focus({ preventScroll: true });

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (!stateRef.current.busy) stateRef.current.onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const controls = Array.from(panelRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]') ?? [])
        .filter(element => element.getClientRects().length > 0 && element.tabIndex >= 0);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (!first || !last) {
        event.preventDefault();
        panelRef.current?.focus();
      } else if (event.shiftKey && (document.activeElement === first || !controls.includes(document.activeElement as HTMLElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !controls.includes(document.activeElement as HTMLElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      document.body.style.overflow = priorOverflow;
      window.removeEventListener('keydown', onKey, true);
      if (priorFocus?.isConnected) priorFocus.focus({ preventScroll: true });
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (busy) panelRef.current?.focus({ preventScroll: true });
    else if (result) safeActionRef.current?.focus({ preventScroll: true });
  }, [busy, open, result]);

  if (typeof document === 'undefined') return null;

  const rejected = result?.status === 'REJECTED';
  const requested = result?.status === 'REQUESTED';
  const completed = result?.status === 'COMPLETED';
  const title = result
    ? rejected ? (isID ? 'Pembatalan ditolak' : 'Cancellation rejected')
      : requested ? (isID ? 'Pembatalan sedang ditinjau' : 'Cancellation under review')
        : (isID ? 'Reservasi dibatalkan' : 'Reservation cancelled')
    : mode === 'view' ? (isID ? 'Rincian pembatalan' : 'Cancellation details')
      : (isID ? 'Batalkan reservasi?' : 'Cancel this reservation?');

  const description = result
    ? rejected ? (isID ? 'Permintaan pembatalan belum disetujui. Periksa status pesanan dan rincian di bawah.' : 'Your cancellation request was not approved. Check your booking status and the details below.')
      : requested ? (isID ? 'Permintaan pembatalan sudah diterima dan masih ditinjau. Status pengembalian dana ditampilkan secara terpisah.' : 'Your cancellation request has been received and is under review. Your refund status is shown separately.')
        : (isID ? 'Reservasi ini telah dibatalkan. Lihat biaya pembatalan dan status pengembalian dana yang tercatat untuk pesananmu.' : 'This reservation has been cancelled. Review the recorded cancellation fee and refund status for your booking.')
    : mode === 'view'
      ? (isID ? 'Lihat status pembatalan dan pengembalian dana untuk reservasi ini.' : 'Review the cancellation and refund status for this reservation.')
      : (isID ? 'Reservasi yang dibatalkan tidak dapat dipulihkan. Biaya dan nilai pengembalian dana ditentukan oleh kebijakan hotel setelah kamu mengonfirmasi.' : 'A cancelled reservation cannot be restored. Cancellation fees and any refund are determined by the hotel policy after you confirm.');

  const refundHelp = result ? {
    NOT_REQUIRED: isID ? 'Tidak ada pengembalian dana yang perlu diproses untuk pembatalan ini.' : 'No refund processing is required for this cancellation.',
    PENDING: isID ? 'Pengembalian dana masih menunggu proses. Dana belum dinyatakan kembali.' : 'Your refund is awaiting processing. The funds have not been marked as returned.',
    PROCESSING: isID ? 'Pengembalian dana sedang diproses. Pantau statusnya melalui rincian pembatalan.' : 'Your refund is being processed. Check the cancellation details for updates.',
    REFUNDED: isID ? 'Pengembalian dana telah tercatat selesai.' : 'Your refund has been recorded as completed.',
    FAILED: isID ? 'Pengembalian dana belum berhasil. Periksa kembali statusnya atau hubungi pihak hotel dengan kode reservasi ini.' : 'Your refund was unsuccessful. Check its status again or contact the hotel with this booking code.',
    REJECTED: isID ? 'Pengembalian dana ditolak. Periksa kebijakan pembatalan atau hubungi pihak hotel.' : 'Your refund was rejected. Review the cancellation policy or contact the hotel.',
  }[result.refundStatus] : null;

  const dismiss = () => { if (!stateRef.current.busy) stateRef.current.onClose(); };
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (stateRef.current.busy || submittedRef.current) return;
    submittedRef.current = true;
    try { onSubmit(event); } catch (cause) { submittedRef.current = false; throw cause; }
  };

  return createPortal(<AnimatePresence>{booking && (
    <motion.div className="bookings-page fixed inset-0 z-[80] flex items-center justify-center p-4" initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0 : 0.18 }} data-booking-cancellation>
      <div className="absolute inset-0 bg-[#0b1f3a]/60 backdrop-blur-[3px]" onClick={dismiss} aria-hidden />
      <motion.div ref={panelRef} role={mode === 'cancel' && !result ? 'alertdialog' : 'dialog'} aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} aria-busy={busy} tabIndex={-1} initial={reduceMotion ? false : { y: 10, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0 : 0.22 }} className="relative flex max-h-[90dvh] w-full max-w-[540px] flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_28px_90px_rgba(10,25,46,0.3)] outline-none">
        <header className="relative shrink-0 bg-[#10253f] px-6 pb-6 pt-7 text-white sm:px-7">
          <button type="button" disabled={busy} onClick={dismiss} aria-label={isID ? 'Tutup rincian pembatalan' : 'Close cancellation details'} className="absolute right-3 top-3 flex size-11 cursor-pointer items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-wait disabled:opacity-40"><X className="size-[18px]" aria-hidden /></button>
          <span className={`mb-4 flex size-12 items-center justify-center rounded-2xl border ${completed ? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-200' : 'border-gold-light/25 bg-gold-light/10 text-gold-light'}`}>
            {completed ? <CheckCircle2 className="size-6" aria-hidden /> : requested ? <Clock3 className="size-6" aria-hidden /> : <ShieldAlert className="size-6" aria-hidden />}
          </span>
          <p className="mb-2 pr-8 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-light">{isID ? 'Kelola reservasi' : 'Manage reservation'}</p>
          <h2 id={titleId} className="pr-3 font-serif text-[27px] leading-[1.2] tracking-tight sm:text-[30px]">{title}</h2>
          <p className="mt-3 break-words text-xs font-medium leading-5 text-white/75"><span className="font-mono text-gold-light">{booking.bookingCode}</span><span className="px-2" aria-hidden>·</span>{booking.hotelName}</p>
        </header>

        <div className="overflow-y-auto overscroll-contain px-6 py-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-7">
          {busy && mode === 'view' ? <div className="flex min-h-44 flex-col items-center justify-center gap-3 text-center" role="status"><Loader2 className="size-7 animate-spin text-gold motion-reduce:animate-none" aria-hidden /><p id={descriptionId} className="text-sm text-slate-600">{isID ? 'Memuat rincian pembatalan…' : 'Loading cancellation details…'}</p></div>
            : result ? <div className="space-y-5">
              <p id={descriptionId} className="text-sm leading-6 text-slate-600">{description}</p>
              <dl className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><dt className="text-xs text-slate-500">{isID ? 'Biaya pembatalan' : 'Cancellation fee'}</dt><dd className="mt-2 break-words text-base font-semibold text-navy-dark">{result.cancellationFeeAmount == null ? '—' : formatCurrency(result.cancellationFeeAmount)}</dd></div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><dt className="text-xs text-slate-500">{isID ? 'Nilai pengembalian' : 'Refund amount'}</dt><dd className="mt-2 break-words text-base font-semibold text-navy-dark">{result.refundAmount == null ? '—' : formatCurrency(result.refundAmount)}</dd></div>
                <div className="col-span-2 flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:justify-between">
                  <div><dt className="text-xs text-slate-500">{isID ? 'Status pembatalan' : 'Cancellation status'}</dt><dd className={`mt-1.5 text-sm font-semibold ${rejected ? 'text-rose-700' : requested ? 'text-amber-700' : 'text-emerald-700'}`}>{cancelLabels[result.status]?.[isID ? 0 : 1] ?? result.status}</dd></div>
                  <div><dt className="text-xs text-slate-500">{isID ? 'Status pengembalian dana' : 'Refund status'}</dt><dd className={`mt-1.5 text-sm font-semibold ${result.refundStatus === 'REFUNDED' ? 'text-emerald-700' : ['FAILED', 'REJECTED'].includes(result.refundStatus) ? 'text-rose-700' : 'text-navy-dark'}`}>{refundLabels[result.refundStatus]?.[isID ? 0 : 1] ?? result.refundStatus}</dd></div>
                </div>
                {result.cancelledAt && <div className="col-span-2"><dt className="text-xs text-slate-500">{isID ? 'Tanggal tercatat' : 'Recorded date'}</dt><dd className="mt-1 text-sm font-medium text-navy-dark">{formatDate(result.cancelledAt, isID ? 'ID' : 'EN')}</dd></div>}
                {result.cancellationReason && <div className="col-span-2"><dt className="text-xs text-slate-500">{isID ? 'Alasan pembatalan' : 'Cancellation reason'}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{result.cancellationReason}</dd></div>}
              </dl>
              {refundHelp && <p className="flex items-start gap-2 rounded-xl bg-navy-soft/70 p-3 text-xs leading-5 text-navy-dark"><AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />{refundHelp}</p>}
              <button ref={safeActionRef} type="button" disabled={busy} onClick={dismiss} className={`${buttonBase} w-full bg-navy-dark text-white hover:bg-navy`}>{isID ? 'Selesai' : 'Done'}</button>
            </div>
              : mode === 'view' ? <div className="space-y-5">
                <p id={descriptionId} className="text-sm leading-6 text-slate-600">{description}</p>
                <p role="alert" className="flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm leading-6 text-rose-700"><AlertCircle className="mt-1 size-4 shrink-0" aria-hidden />{error || (isID ? 'Rincian pembatalan belum tersedia.' : 'Cancellation details are not available yet.')}</p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button ref={safeActionRef} type="button" onClick={dismiss} className={`${buttonBase} flex-1 border border-slate-200 text-navy-dark hover:bg-slate-50`}>{isID ? 'Tutup' : 'Close'}</button>
                  {onRetry && <button type="button" onClick={onRetry} className={`${buttonBase} flex-1 bg-navy-dark text-white hover:bg-navy`}><RefreshCw className="size-4" aria-hidden />{isID ? 'Coba lagi' : 'Try again'}</button>}
                </div>
              </div>
                : <form onSubmit={handleSubmit} className="space-y-5">
                  <p id={descriptionId} className="text-sm leading-6 text-slate-600">{description}</p>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><p className="text-xs text-slate-500">{isID ? 'Jadwal menginap' : 'Stay dates'}</p><p className="mt-1 text-sm font-semibold text-navy-dark">{formatDate(booking.checkIn, isID ? 'ID' : 'EN')} <span className="px-1 text-slate-400" aria-hidden>→</span> {formatDate(booking.checkOut, isID ? 'ID' : 'EN')}</p></div>
                  <div>
                    <label htmlFor={reasonId} className="mb-2 block text-sm font-semibold text-navy-dark">{isID ? 'Alasan pembatalan' : 'Cancellation reason'} <span className="font-normal text-slate-500">({isID ? 'opsional' : 'optional'})</span></label>
                    <textarea id={reasonId} value={reason} onChange={event => onReasonChange(event.target.value)} disabled={busy} maxLength={500} rows={3} aria-describedby={`${hintId}${error ? ` ${errorId}` : ''}`} placeholder={isID ? 'Ceritakan alasan singkatmu…' : 'Tell us briefly why…'} className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-3 text-base leading-6 text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-navy focus:ring-2 focus:ring-navy/10 disabled:cursor-wait disabled:bg-slate-50 sm:text-sm" />
                    <p id={hintId} className="mt-1 text-right text-xs text-slate-500">{reason.length}/500</p>
                  </div>
                  {error && <p id={errorId} role="alert" className="flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm leading-6 text-rose-700"><AlertCircle className="mt-1 size-4 shrink-0" aria-hidden />{error}</p>}
                  {busy && <p role="status" className="text-xs leading-5 text-slate-500">{isID ? 'Mohon tunggu sampai permintaan pembatalan selesai.' : 'Please wait while your cancellation request is processed.'}</p>}
                  <div className="flex flex-col gap-3">
                    <button type="submit" disabled={busy} className={`${buttonBase} bg-rose-700 text-white hover:bg-rose-800`}>{busy && <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />}{busy ? (isID ? 'Memproses pembatalan…' : 'Processing cancellation…') : (isID ? 'Ya, batalkan' : 'Yes, cancel')}</button>
                    <button ref={safeActionRef} type="button" disabled={busy} onClick={dismiss} className={`${buttonBase} border border-slate-200 text-navy-dark hover:bg-slate-50`}><ArrowLeft className="size-4" aria-hidden />{isID ? 'Tetap simpan pesanan' : 'Keep my booking'}</button>
                  </div>
                </form>}
        </div>
      </motion.div>
    </motion.div>
  )}</AnimatePresence>, document.body);
}
