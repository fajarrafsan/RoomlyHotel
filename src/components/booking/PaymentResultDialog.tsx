import { useEffect, useId, useRef, useState } from 'react';
import {
  AlertCircle, ArrowRight, Check, Clock3, CreditCard, Home, LoaderCircle,
  ReceiptText, RefreshCw, RotateCcw, X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { PaymentStatus } from '../../types/api';
import { bookingHoldTime } from '../../lib/bookingPresentation';

export type PaymentResult = PaymentStatus | 'CHECKING' | 'UNAVAILABLE';

interface PaymentResultDialogProps {
  isID: boolean;
  result: PaymentResult;
  summary?: { bookingCode: string; amount: number; currency: string; paidAt?: string | null };
  isChecking?: boolean;
  onCheck?: () => void;
  onDismiss: () => void;
  onViewBookings: () => void;
}

const successTone = 'border-emerald-200/70 bg-emerald-50 text-emerald-800';
const failureTone = 'border-rose-200/70 bg-rose-50 text-rose-800';
const pendingTone = 'border-amber-200/70 bg-amber-50 text-amber-900';
const neutralTone = 'border-slate-200 bg-slate-50 text-navy-dark';

const results = {
  PAID: {
    icon: Check, tone: successTone,
    title: ['Pembayaran berhasil', 'Payment successful'],
    detail: ['Pembayaran untuk reservasi ini sudah terkonfirmasi. Buka pesanan untuk melihat detail dan invoice.', 'Your payment is confirmed. Open your bookings for the reservation details and invoice.'],
    label: ['Total dibayar', 'Total paid'],
  },
  FAILED: {
    icon: X, tone: failureTone,
    title: ['Pembayaran gagal', 'Payment failed'],
    detail: ['Pembayaran belum berhasil. Buka pesanan untuk melihat status reservasi dan pilihan pembayaran yang tersedia.', 'The payment did not go through. Open your bookings to see the reservation status and available payment options.'],
    label: ['Total tagihan', 'Amount due'],
  },
  EXPIRED: {
    icon: Clock3, tone: pendingTone,
    title: ['Pembayaran kedaluwarsa', 'Payment expired'],
    detail: ['Waktu pembayaran sudah berakhir. Buka pesanan untuk meninjau status reservasi.', 'The payment window has ended. Open your bookings to review the reservation status.'],
    label: ['Total tagihan', 'Original amount'],
  },
  CANCELLED: {
    icon: X, tone: failureTone,
    title: ['Pembayaran dibatalkan', 'Payment cancelled'],
    detail: ['Transaksi ini sudah dibatalkan. Rincian reservasi tersedia di halaman pesanan.', 'This transaction was cancelled. The reservation details are available in your bookings.'],
    label: ['Total tagihan', 'Original amount'],
  },
  REFUNDED: {
    icon: RotateCcw, tone: neutralTone,
    title: ['Pembayaran dikembalikan', 'Payment refunded'],
    detail: ['Buka pesanan untuk melihat rincian pengembalian dana.', 'Open your bookings to see the refund details.'],
    label: ['Total transaksi', 'Transaction total'],
  },
  PENDING: {
    icon: Clock3, tone: pendingTone,
    title: ['Menunggu konfirmasi pembayaran', 'Awaiting payment confirmation'],
    detail: ['Status masih menunggu konfirmasi. Jika sudah membayar, periksa statusnya kembali.', 'The payment is still awaiting confirmation. If you already paid, check the status again.'],
    label: ['Total tagihan', 'Amount due'],
  },
  CHECKING: {
    icon: LoaderCircle, tone: neutralTone,
    title: ['Memeriksa pembayaran', 'Checking payment'],
    detail: ['Roomly sedang memeriksa status transaksi.', 'Roomly is verifying the transaction status.'],
    label: ['Total tagihan', 'Amount due'],
  },
  UNAVAILABLE: {
    icon: AlertCircle, tone: neutralTone,
    title: ['Status pembayaran belum tersedia', 'Payment status is unavailable'],
    detail: ['Periksa statusnya lagi atau buka halaman pesanan untuk melihat reservasi Anda.', 'Check the status again or open your bookings to find the reservation.'],
    label: ['Total tagihan', 'Amount due'],
  },
} as const;

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/60 focus-visible:ring-offset-2';
const action = 'min-h-12 rounded-xl px-3.5 py-3 text-sm font-bold inline-flex items-center justify-center gap-2 cursor-pointer motion-safe:transition-colors ' + focusRing;

export function PaymentResultDialog({
  isID, result, summary, isChecking, onCheck, onDismiss, onViewBookings,
}: PaymentResultDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const detailId = useId();
  const locale = isID ? 'id-ID' : 'en-GB';
  const language = isID ? 0 : 1;
  const { icon: Icon, tone, title, detail, label } = results[result];
  const paidAt = result === 'PAID' && summary?.paidAt ? bookingHoldTime(summary.paidAt) : NaN;
  const money = summary
    ? new Intl.NumberFormat(locale, {
        style: 'currency', currency: summary.currency || 'IDR',
        ...(summary.currency === 'IDR' ? { maximumFractionDigits: 0 } : {}),
      }).format(summary.amount)
    : null;
  const paidOn = Number.isFinite(paidAt)
    ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' }).format(paidAt)
    : null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousFocus = document.activeElement;
    const originalOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = originalOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={detailId}
      data-payment-result={result}
      className="booking-checkout fixed inset-0 m-auto max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] max-w-[470px] overflow-auto overscroll-contain rounded-[26px] border border-white/80 bg-white p-0 text-navy-dark shadow-2xl backdrop:bg-[#0c1832]/60 backdrop:backdrop-blur-[3px]"
      onCancel={event => { event.preventDefault(); onDismiss(); }}
      onClick={event => { if (event.target === event.currentTarget) onDismiss(); }}
    >
      <div>
        <div className={'relative border-b px-5 pb-5 pt-6 sm:px-7 sm:pb-6 sm:pt-7 ' + tone}>
          <button
            type="button"
            onClick={onDismiss}
            aria-label={isID ? 'Tutup hasil pembayaran' : 'Close payment result'}
            className={'absolute right-3 top-3 grid size-11 cursor-pointer place-items-center rounded-full hover:bg-white/80 sm:right-4 sm:top-4 ' + focusRing}
          >
            <X className="size-5" aria-hidden />
          </button>
          <div role="status">
            <span className="mb-4 grid size-12 place-items-center rounded-2xl border border-current/15 bg-white/85 shadow-sm sm:size-14" aria-hidden>
              <Icon className={'size-6 ' + (result === 'CHECKING' ? 'motion-safe:animate-spin' : '')} />
            </span>
            <h2 id={titleId} className="pr-2 font-serif text-[1.65rem] font-semibold leading-tight tracking-tight sm:text-[1.9rem]">{title[language]}</h2>
            <p id={detailId} className="mt-2 max-w-[35ch] text-sm leading-relaxed text-slate-700">{detail[language]}</p>
          </div>
        </div>

        <div className="space-y-4 p-4 sm:space-y-5 sm:p-6">
          {summary && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <dl className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <dt className="flex items-center gap-2 text-sm font-medium text-slate-600"><ReceiptText className="size-4" aria-hidden />{isID ? 'Kode reservasi' : 'Booking code'}</dt>
                  <dd className="break-all text-sm font-bold">{summary.bookingCode}</dd>
                </div>
                {paidOn && (
                  <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-sm">
                    <dt className="text-slate-600">{isID ? 'Dibayar pada' : 'Paid on'}</dt>
                    <dd className="font-semibold">{paidOn} WIB</dd>
                  </div>
                )}
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-slate-200 pt-2.5">
                  <dt className="text-sm font-semibold text-slate-700">{label[language]}</dt>
                  <dd className="text-xl font-extrabold tracking-tight tabular-nums">{money}</dd>
                </div>
              </dl>
            </div>
          )}

          {onCheck && (
            <button type="button" onClick={onCheck} disabled={isChecking} className={action + ' w-full border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-60'}>
              <RefreshCw className={'size-4 ' + (isChecking ? 'motion-safe:animate-spin' : '')} aria-hidden />
              {isChecking ? (isID ? 'Memeriksa…' : 'Checking…') : (isID ? 'Periksa status lagi' : 'Check status again')}
            </button>
          )}

          <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
            <button type="button" onClick={onViewBookings} className={action + ' bg-[#172953] text-white hover:bg-[#233d72]'}>
              <CreditCard className="size-4 shrink-0" aria-hidden />
              {isID ? 'Lihat pesanan' : 'View bookings'}
              <ArrowRight className="size-4 shrink-0" aria-hidden />
            </button>
            <Link to="/" replace className={action + ' border border-slate-200 bg-white hover:bg-slate-50'}>
              <Home className="size-4 shrink-0" aria-hidden />
              {isID ? 'Kembali ke beranda' : 'Back to home'}
            </Link>
          </div>
        </div>
      </div>
    </dialog>
  );
}

export function CheckoutPaymentResult(props: Omit<PaymentResultDialogProps, 'onDismiss'>) {
  const [dismissed, setDismissed] = useState(false);
  return dismissed ? null : <PaymentResultDialog {...props} onDismiss={() => setDismissed(true)} />;
}
