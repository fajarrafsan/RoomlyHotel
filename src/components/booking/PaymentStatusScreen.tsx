import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  AlertTriangle, CalendarDays, CheckCircle2, Clock3, ExternalLink, Loader2, RotateCw, Undo2, XCircle,
} from 'lucide-react';
import { BookingResponse } from '../../types/api/booking';
import { fadeTween } from '../../lib/motion';
import { bookingHoldTime } from '../../lib/bookingPresentation';

export type PaymentDisplayStatus =
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'NOT_CREATED'
  | 'RECOVERY_FAILED';

interface PaymentStatusScreenProps {
  isID: boolean;
  paymentStatus: PaymentDisplayStatus;
  redirectUrl: string | null;
  booking?: BookingResponse | null;
  isChecking: boolean;
  autoPollingStopped?: boolean;
  checkError: string | null;
  onCheck?: () => void;
  onRetry?: () => void;
  onReopen?: () => void;
  onChooseDates?: () => void;
  onDone: () => void;
}

const iconBase = 'mx-auto flex size-16 items-center justify-center rounded-full';
const titleClass = 'font-serif text-[27px] leading-tight tracking-[-0.02em] text-navy-dark';
const textClass = 'mt-2 text-[15px] leading-6 text-slate-600';

export const PaymentStatusScreen: React.FC<PaymentStatusScreenProps> = ({
  isID,
  paymentStatus,
  redirectUrl,
  booking,
  isChecking,
  autoPollingStopped = false,
  checkError,
  onCheck,
  onRetry,
  onReopen,
  onChooseDates,
  onDone,
}) => {
  const reduceMotion = useReducedMotion();
  const isPaid = paymentStatus === 'PAID';
  const isRefunded = paymentStatus === 'REFUNDED';
  const isFailed = ['FAILED', 'EXPIRED', 'CANCELLED'].includes(paymentStatus);
  const needsPaymentSession = paymentStatus === 'NOT_CREATED';
  const recoveryFailed = paymentStatus === 'RECOVERY_FAILED';
  const isPending = !isPaid && !isRefunded && !isFailed && !needsPaymentSession && !recoveryFailed;
  const rawDeadline = (isPending || needsPaymentSession) && booking?.holdExpiresAt ? bookingHoldTime(booking.holdExpiresAt) : NaN;
  const deadline = Number.isFinite(rawDeadline) ? rawDeadline : null;
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (deadline === null) return;
    setNow(Date.now());
    if (deadline <= Date.now()) return;
    const timer = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= deadline) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [deadline]);
  const remainingSeconds = deadline === null ? null : Math.max(0, Math.ceil((deadline - now) / 1000));
  const holdExpired = remainingSeconds === 0;
  const clock = remainingSeconds === null ? null
    : `${String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:${String(remainingSeconds % 60).padStart(2, '0')}`;
  const formatBookingAmount = (amount: number) => new Intl.NumberFormat(isID ? 'id-ID' : 'en-US', {
    style: 'currency',
    currency: booking?.currency || 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);

  const primaryBtn =
    'flex min-h-12 w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl bg-gold px-5 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(161,98,7,0.2)] transition-colors duration-200 hover:bg-gold-dark disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:hover:bg-gold';
  const secondaryBtn =
    'flex min-h-12 w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-navy-dark transition-colors duration-200 hover:border-gold/50';

  return (
    <div className="booking-checkout mx-auto max-w-[520px] px-1 py-10 sm:py-16" data-payment-status={paymentStatus}>
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduceMotion ? { duration: 0 } : fadeTween}
        className="rounded-[26px] border border-slate-200/80 bg-white p-6 text-center shadow-[0_18px_48px_rgba(15,35,68,0.1)] sm:p-8"
      >
        {isPaid ? (
          <>
            <div className={`${iconBase} bg-emerald-50 text-emerald-600`}><CheckCircle2 className="size-8" aria-hidden /></div>
            <h1 className={`${titleClass} mt-5`}>{isID ? 'Pembayaran berhasil' : 'Payment successful'}</h1>
            <p className={textClass}>
              {isID
                ? 'Pembayaran sudah tercatat. Status reservasi terbaru tersedia di Pesanan Saya.'
                : 'The payment is recorded. Your latest reservation status is available in My Bookings.'}
            </p>
          </>
        ) : isRefunded ? (
          <>
            <div className={`${iconBase} bg-navy-soft text-navy`}><Undo2 className="size-8" aria-hidden /></div>
            <h1 className={`${titleClass} mt-5`}>{isID ? 'Pembayaran dikembalikan' : 'Payment refunded'}</h1>
            <p className={textClass}>
              {isID
                ? 'Dana pembayaran ini telah dikembalikan. Lihat rincian reservasi untuk informasi terbaru.'
                : 'This payment has been refunded. See the booking for the latest details.'}
            </p>
          </>
        ) : isFailed ? (
          <>
            <div className={`${iconBase} bg-rose-50 text-rose-600`}><XCircle className="size-8" aria-hidden /></div>
            <h1 className={`${titleClass} mt-5`}>{paymentStatus === 'EXPIRED'
              ? (isID ? 'Pembayaran kedaluwarsa' : 'Payment expired')
              : (isID ? 'Pembayaran tidak berhasil' : 'Payment unsuccessful')}</h1>
            <p className={textClass}>
              {paymentStatus === 'EXPIRED'
                ? (isID ? 'Pilih tanggal lagi untuk memeriksa ketersediaan kamar terbaru.' : 'Choose your dates again to check the latest room availability.')
                : isID
                ? `Status pembayaran: ${paymentStatus}. Periksa Pesanan Saya sebelum membuat reservasi baru.`
                : `Payment status: ${paymentStatus}. Check My Bookings before creating another reservation.`}
            </p>
          </>
        ) : needsPaymentSession || recoveryFailed ? (
          <>
            <div className={`${iconBase} bg-gold-soft text-gold-dark`}><AlertTriangle className="size-8" aria-hidden /></div>
            <h1 className={`${titleClass} mt-5`}>
              {recoveryFailed
                ? (isID ? 'Belum dapat memulihkan pembayaran' : 'Could not resume payment yet')
                : (isID ? 'Reservasi tersimpan, pembayaran belum dibuat' : 'Booking saved, payment not created')}
            </h1>
            <p className={textClass}>
              {recoveryFailed
                ? (isID
                    ? 'Progres pembayaran tersimpan, tetapi server belum dapat dimuat. Coba lagi agar tidak membuat reservasi ganda.'
                    : 'Your payment progress is saved, but the server could not be reached. Retry to avoid creating a duplicate booking.')
                : (isID
                    ? 'Roomly akan memeriksa pembayaran yang mungkin sudah ada sebelum membuat sesi baru.'
                    : 'Roomly will check for an existing payment before safely creating a new session.')}
            </p>
          </>
        ) : (
          <>
            <div className={`${iconBase} bg-gold-soft text-gold-dark`}>
              {isChecking ? <Loader2 className="size-8 animate-spin" aria-hidden /> : <RotateCw className="size-8" aria-hidden />}
            </div>
            <h1 className={`${titleClass} mt-5`}>{isID ? 'Menunggu konfirmasi pembayaran' : 'Waiting for payment confirmation'}</h1>
            <p className={textClass}>
              {holdExpired
                ? (isID ? 'Jika sudah membayar, periksa status sebelum membuat reservasi baru.' : 'If you already paid, check the status before starting a new booking.')
                : autoPollingStopped
                ? (isID
                    ? 'Pemeriksaan otomatis dijeda setelah beberapa menit. Pembayaran tetap dapat dilanjutkan dan diperiksa manual.'
                    : 'Automatic checks paused after several minutes. You can still complete payment and check manually.')
                : (isID
                    ? 'Selesaikan pembayaran di halaman Midtrans. Statusnya kami periksa otomatis secara berkala.'
                    : 'Complete payment on the Midtrans page. We check this status automatically.')}
            </p>
          </>
        )}

        {clock !== null && (
          <div className={`mt-5 flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left ${holdExpired ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-slate-200 bg-slate-50 text-navy-dark'}`} data-payment-hold>
            <p className="flex items-center gap-2 text-sm font-semibold" role={holdExpired ? 'status' : undefined}>
              <Clock3 className="size-4 shrink-0" aria-hidden />
              {holdExpired ? (isID ? 'Waktu penahanan kamar berakhir' : 'The room hold has ended')
                : (isID ? 'Sisa waktu penahanan kamar' : 'Time left on your room hold')}
            </p>
            <span role="timer" className="shrink-0 font-bold tabular-nums">{clock}</span>
          </div>
        )}

        {booking && (
          <div className="mt-6 rounded-2xl border border-slate-200/80 p-4 text-left">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-5 text-navy-dark">{isID ? 'Total pembayaran' : 'Total payment'}</p>
                <p className="truncate text-xs leading-5 text-slate-500">{booking.bookingCode}</p>
              </div>
              <p className="shrink-0 text-[20px] font-semibold leading-7 tracking-tight text-navy-dark">{formatBookingAmount(booking.totalAmount)}</p>
            </div>

            <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 text-[13px] leading-5">
              <div className="flex justify-between gap-3 text-slate-600">
                <span>{isID ? 'Subtotal kamar' : 'Room subtotal'}</span>
                <span>{formatBookingAmount(booking.subtotalAmount)}</span>
              </div>
              <div className="flex justify-between gap-3 text-slate-600">
                <span>{isID ? 'Pajak' : 'Tax'}</span>
                <span>{formatBookingAmount(booking.taxAmount)}</span>
              </div>
              <div className="flex justify-between gap-3 text-slate-600">
                <span>{isID ? 'Biaya layanan' : 'Service fee'}</span>
                <span>{formatBookingAmount(booking.serviceFeeAmount)}</span>
              </div>
              {booking.discountAmount > 0 && (
                <div className="flex justify-between gap-3 text-emerald-700">
                  <span>{isID ? 'Diskon' : 'Discount'}</span>
                  <span>-{formatBookingAmount(booking.discountAmount)}</span>
                </div>
              )}
            </div>

            {booking.nights.length > 0 && (
              <details className="group mt-3 border-t border-slate-100 pt-1">
                <summary className="flex min-h-11 cursor-pointer items-center text-[13px] font-semibold text-navy-dark">
                  {isID ? 'Lihat tarif per malam' : 'View nightly rates'}
                </summary>
                <div className="space-y-1.5 pb-1">
                  {booking.nights.map((night) => (
                    <div key={night.id} className="flex justify-between gap-3 text-[13px] leading-5 text-slate-600">
                      <span>{night.stayDate}</span>
                      <span>{formatBookingAmount(night.pricePerNight)}</span>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}

        {checkError && <p className="mt-4 text-[13px] leading-5 text-rose-700" role="alert">{checkError}</p>}

        <div className="mt-6 space-y-2.5">
          {(needsPaymentSession || recoveryFailed || (paymentStatus === 'FAILED' && onRetry)) && onRetry && (
            <button type="button" onClick={onRetry} disabled={isChecking} className={primaryBtn}>
              {isChecking ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <RotateCw className="size-4" aria-hidden />}
              {holdExpired
                ? (isID ? 'Periksa status reservasi' : 'Check booking status')
                : paymentStatus === 'FAILED'
                ? (isID ? 'Coba pembayaran baru' : 'Try a new payment')
                : (isID ? 'Pulihkan / coba pembayaran' : 'Resume / retry payment')}
            </button>
          )}

          {isPending && (
            <>
              {onCheck && (
                <button type="button" onClick={onCheck} disabled={isChecking} className={primaryBtn}>
                  {isChecking ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <RotateCw className="size-4" aria-hidden />}
                  {isID ? 'Saya sudah bayar, cek sekarang' : "I've paid, check now"}
                </button>
              )}
              {!holdExpired && redirectUrl && onReopen && (
                <button type="button" onClick={onReopen} className={secondaryBtn}>
                  <ExternalLink className="size-4" aria-hidden />
                  {isID ? 'Buka halaman pembayaran' : 'Open payment page'}
                </button>
              )}
            </>
          )}

          {paymentStatus === 'EXPIRED' && onChooseDates && (
            <button type="button" onClick={onChooseDates} className={primaryBtn}>
              <CalendarDays className="size-4" aria-hidden />{isID ? 'Pilih tanggal lagi' : 'Choose dates again'}
            </button>
          )}

          <button
            type="button"
            onClick={onDone}
            className={isPaid || isRefunded || (isFailed && (paymentStatus !== 'EXPIRED' || !onChooseDates))
              ? primaryBtn
              : 'min-h-11 w-full cursor-pointer text-[13px] font-semibold text-slate-500 transition-colors duration-200 hover:text-navy-dark'}
          >
            {isID ? 'Lihat Pesanan Saya' : 'View my bookings'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
