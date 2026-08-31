import React from 'react';
import { motion } from 'motion/react';
import {
  AlertTriangle, CheckCircle2, ExternalLink, Loader2, RotateCw, Undo2, XCircle,
} from 'lucide-react';
import { BookingResponse } from '../../types/api/booking';
import { fadeTween } from '../../lib/motion';

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
  onDone: () => void;
}

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
  onDone,
}) => {
  const isPaid = paymentStatus === 'PAID';
  const isRefunded = paymentStatus === 'REFUNDED';
  const isFailed = ['FAILED', 'EXPIRED', 'CANCELLED'].includes(paymentStatus);
  const needsPaymentSession = paymentStatus === 'NOT_CREATED';
  const recoveryFailed = paymentStatus === 'RECOVERY_FAILED';
  const isPending = !isPaid && !isRefunded && !isFailed && !needsPaymentSession && !recoveryFailed;
  const formatBookingAmount = (amount: number) => new Intl.NumberFormat(isID ? 'id-ID' : 'en-US', {
    style: 'currency',
    currency: booking?.currency || 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);

  const primaryBtn =
    'w-full min-h-12 py-3 rounded-xl bg-gold hover:bg-gold-dark text-white text-[14px] font-semibold transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gold';
  const secondaryBtn =
    'w-full min-h-12 py-2.5 rounded-xl bg-navy-soft hover:bg-navy-soft/80 border border-navy-soft text-navy text-[14px] font-medium transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer';

  return (
    <div className="booking-checkout max-w-lg mx-auto py-16 px-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={fadeTween}
        className="bg-white rounded-3xl border border-navy-soft p-8 space-y-5"
        style={{ boxShadow: 'var(--home-shadow)' }}
      >
        {isPaid ? (
          <>
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" aria-hidden />
            </div>
            <h2 className="font-serif text-2xl text-navy tracking-tight">{isID ? 'Pembayaran berhasil' : 'Payment successful'}</h2>
            <p className="text-[14px] text-slate-600 leading-relaxed">
              {isID
                ? 'Pembayaran sudah tercatat. Status reservasi terbaru tersedia di Pesanan Saya.'
                : 'The payment is recorded. Your latest reservation status is available in My Bookings.'}
            </p>
          </>
        ) : isRefunded ? (
          <>
            <div className="w-16 h-16 rounded-full bg-navy-soft text-navy flex items-center justify-center mx-auto">
              <Undo2 className="w-8 h-8" aria-hidden />
            </div>
            <h2 className="font-serif text-2xl text-navy tracking-tight">{isID ? 'Pembayaran dikembalikan' : 'Payment refunded'}</h2>
            <p className="text-[14px] text-slate-600 leading-relaxed">
              {isID
                ? 'Status gateway menunjukkan dana telah dikembalikan. Lihat rincian reservasi untuk informasi terbaru.'
                : 'The gateway reports this payment as refunded. See the booking for the latest details.'}
            </p>
          </>
        ) : isFailed ? (
          <>
            <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8" aria-hidden />
            </div>
            <h2 className="font-serif text-2xl text-navy tracking-tight">
              {isID ? 'Pembayaran tidak berhasil' : 'Payment unsuccessful'}
            </h2>
            <p className="text-[14px] text-slate-600 leading-relaxed">
              {isID
                ? `Status gateway: ${paymentStatus}. Periksa Pesanan Saya sebelum membuat reservasi baru.`
                : `Gateway status: ${paymentStatus}. Check My Bookings before creating another reservation.`}
            </p>
          </>
        ) : needsPaymentSession || recoveryFailed ? (
          <>
            <div className="w-16 h-16 rounded-full bg-gold-soft text-gold flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" aria-hidden />
            </div>
            <h2 className="font-serif text-2xl text-navy tracking-tight">
              {recoveryFailed
                ? (isID ? 'Belum dapat memulihkan pembayaran' : 'Could not resume payment yet')
                : (isID ? 'Reservasi tersimpan, pembayaran belum dibuat' : 'Booking saved, payment not created')}
            </h2>
            <p className="text-[14px] text-slate-600 leading-relaxed">
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
            <div className="w-16 h-16 rounded-full bg-gold-soft text-gold flex items-center justify-center mx-auto">
              {isChecking ? <Loader2 className="w-8 h-8 animate-spin" aria-hidden /> : <RotateCw className="w-8 h-8" aria-hidden />}
            </div>
            <h2 className="font-serif text-2xl text-navy tracking-tight">
              {isID ? 'Menunggu konfirmasi pembayaran' : 'Waiting for payment confirmation'}
            </h2>
            <p className="text-[14px] text-slate-600 leading-relaxed">
              {autoPollingStopped
                ? (isID
                    ? 'Pemeriksaan otomatis dijeda setelah beberapa menit. Pembayaran tetap dapat dilanjutkan dan diperiksa manual.'
                    : 'Automatic checks paused after several minutes. You can still complete payment and check manually.')
                : (isID
                    ? 'Selesaikan pembayaran pada halaman gateway. Status diperiksa otomatis secara berkala.'
                    : 'Complete payment on the gateway page. This status is checked automatically.')}
            </p>
          </>
        )}

        {booking && (
          <div className="rounded-2xl border border-navy-soft bg-navy-soft/40 p-4 text-left space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider font-semibold text-gold">
                  {isID ? 'Total dari server' : 'Server-calculated total'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">{booking.bookingCode}</p>
              </div>
              <p className="font-serif text-lg text-navy">{formatBookingAmount(booking.totalAmount)}</p>
            </div>

            <div className="pt-2 border-t border-navy-soft space-y-1.5 text-[11px]">
              <div className="flex justify-between text-slate-600">
                <span>{isID ? 'Subtotal kamar' : 'Room subtotal'}</span>
                <span>{formatBookingAmount(booking.subtotalAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>{isID ? 'Pajak' : 'Tax'}</span>
                <span>{formatBookingAmount(booking.taxAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>{isID ? 'Biaya layanan' : 'Service fee'}</span>
                <span>{formatBookingAmount(booking.serviceFeeAmount)}</span>
              </div>
              {booking.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>{isID ? 'Diskon' : 'Discount'}</span>
                  <span>-{formatBookingAmount(booking.discountAmount)}</span>
                </div>
              )}
            </div>

            {booking.nights.length > 0 && (
              <details className="pt-2 border-t border-navy-soft group">
                <summary className="text-[11px] font-semibold text-navy cursor-pointer">
                  {isID ? 'Lihat tarif aktual per malam' : 'View actual nightly rates'}
                </summary>
                <div className="mt-2 space-y-1.5">
                  {booking.nights.map((night) => (
                    <div key={night.id} className="flex justify-between text-[11px] text-slate-500">
                      <span>{night.stayDate}</span>
                      <span>{formatBookingAmount(night.pricePerNight)}</span>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}

        {checkError && <p className="text-[12px] text-rose-600" role="alert">{checkError}</p>}

        {(needsPaymentSession || recoveryFailed || (paymentStatus === 'FAILED' && onRetry)) && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            disabled={isChecking}
            className={primaryBtn}
          >
            {isChecking ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <RotateCw className="w-4 h-4" aria-hidden />}
            {paymentStatus === 'FAILED'
              ? (isID ? 'Coba pembayaran baru' : 'Try a new payment')
              : (isID ? 'Pulihkan / coba pembayaran' : 'Resume / retry payment')}
          </button>
        )}

        {isPending && (
          <>
            {redirectUrl && onReopen && (
              <button type="button" onClick={onReopen} className={secondaryBtn}>
                <ExternalLink className="w-4 h-4" aria-hidden />
                {isID ? 'Buka halaman pembayaran' : 'Open payment page'}
              </button>
            )}

            {onCheck && (
              <button
                type="button"
                onClick={onCheck}
                disabled={isChecking}
                className={primaryBtn}
              >
                {isChecking ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <RotateCw className="w-4 h-4" aria-hidden />}
                {isID ? 'Saya sudah bayar, cek sekarang' : "I've paid, check now"}
              </button>
            )}
          </>
        )}

        <button
          type="button"
          onClick={onDone}
          className={isPaid || isRefunded || isFailed
            ? primaryBtn
            : 'text-[13px] text-slate-500 hover:text-navy font-medium transition-colors duration-200 cursor-pointer'}
        >
          {isID ? 'Lihat Pesanan Saya' : 'View my bookings'}
        </button>
      </motion.div>
    </div>
  );
};
