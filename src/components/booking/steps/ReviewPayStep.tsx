import React, { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { AlertCircle, CalendarDays, CreditCard, Info, LoaderCircle, MessageSquare, Pencil, RotateCw, UserRound, UsersRound, type LucideIcon } from 'lucide-react';
import { formatCurrency, formatDate } from '../../../lib/utils';
import type { BookingQuoteResponse } from '../../../types/api';
import { fadeTween } from '../../../lib/motion';
import { formatGuests, formatNights } from '../BookingSummary';

interface ReviewPayStepProps {
  isID: boolean;
  nights: number;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  specialRequests: string;
  error: string | null;
  quote?: BookingQuoteResponse | null;
  onRetryQuote: () => void;
  isSubmitting: boolean;
  onEditStep: (step: 1 | 2) => void;
}

export const ReviewPayStep: React.FC<ReviewPayStepProps> = ({
  isID, nights, checkIn, checkOut, adults, children,
  guestName, guestEmail, guestPhone, specialRequests, error, quote, onRetryQuote, isSubmitting, onEditStep,
}) => {
  const reduceMotion = useReducedMotion();
  const errorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  const lang = isID ? 'ID' : 'EN';
  const emptyValue = isID ? 'Belum diisi' : 'Not provided';
  const rows: { icon: LucideIcon; label: string; value: string; detail?: string; editStep: 1 | 2; editLabel: string }[] = [
    {
      icon: CalendarDays,
      label: isID ? 'Tanggal menginap' : 'Your stay',
      value: `${formatDate(checkIn, lang)} – ${formatDate(checkOut, lang)}`,
      detail: formatNights(nights, isID),
      editStep: 1,
      editLabel: isID ? 'Ubah tanggal menginap' : 'Change your stay',
    },
    {
      icon: UsersRound,
      label: isID ? 'Tamu' : 'Guests',
      value: formatGuests(adults, children, isID),
      editStep: 1,
      editLabel: isID ? 'Ubah jumlah tamu' : 'Change guests',
    },
    {
      icon: UserRound,
      label: isID ? 'Tamu utama' : 'Lead guest',
      value: guestName.trim() || emptyValue,
      detail: [guestEmail.trim(), guestPhone.trim()].filter(Boolean).join(' · ') || undefined,
      editStep: 2,
      editLabel: isID ? 'Ubah data tamu utama' : 'Change lead guest',
    },
    ...(specialRequests.trim() ? [{
      icon: MessageSquare,
      label: isID ? 'Permintaan khusus' : 'Special requests',
      value: specialRequests.trim(),
      editStep: 2 as const,
      editLabel: isID ? 'Ubah permintaan khusus' : 'Change special requests',
    }] : []),
  ];

  return (
    <div className="space-y-4 sm:space-y-5">
      <div>
        <h2 className="font-serif text-[25px] leading-tight tracking-tight text-navy-dark sm:text-[31px]" tabIndex={-1} data-checkout-step-heading>
          {isID ? 'Tinjau & bayar' : 'Review & pay'}
        </h2>
        <p className="mt-1 text-sm leading-5 text-slate-600">
          {isID ? 'Periksa detail reservasi Anda sebelum melanjutkan ke pembayaran.' : 'Please review your booking details before proceeding to payment.'}
        </p>
      </div>

      <ul className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-slate-50 px-2.5 sm:px-4" data-checkout-review>
        {rows.map(({ icon: Icon, ...row }) => (
          <li key={row.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-1.5 py-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:gap-x-3.5">
            <span className="mt-0.5 hidden size-9 place-items-center rounded-lg border border-slate-200 bg-white text-gold-dark sm:grid">
              <Icon className="size-4" aria-hidden />
            </span>
            <dl className="min-w-0 [overflow-wrap:anywhere]">
              <dt className="text-xs font-semibold leading-5 text-slate-600">{row.label}</dt>
              <dd className="whitespace-pre-line text-[15px] font-bold leading-6 text-navy-dark">{row.value}</dd>
              {row.detail && <dd className="text-sm leading-5 text-slate-600">{row.detail}</dd>}
            </dl>
            <button type="button" onClick={() => onEditStep(row.editStep)} disabled={isSubmitting} aria-label={row.editLabel}
              className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-xs font-bold text-navy hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 sm:px-3 sm:text-sm">
              <Pencil className="hidden size-3.5 sm:block" aria-hidden />
              {isID ? 'Ubah' : 'Edit'}
            </button>
          </li>
        ))}
      </ul>

      {quote ? (
        <section className="rounded-2xl border border-slate-200 px-3 py-3.5 sm:px-4" aria-labelledby="checkout-rates-title">
          <h3 id="checkout-rates-title" className="font-bold text-navy-dark">{isID ? 'Rincian tarif menginap' : 'Stay price breakdown'}</h3>
          <details open={quote.nights.length <= 4} className="mt-1">
            <summary className="min-h-10 cursor-pointer py-2 text-sm font-semibold text-navy">{isID ? 'Tarif per malam' : 'Nightly rates'} · {formatNights(nights, isID)}</summary>
            <dl className="space-y-2 pb-2 text-sm text-slate-700">
              {quote.nights.map(night => (
                <div key={night.stayDate} className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <dt>{formatDate(night.stayDate, lang)}</dt>
                  <dd className="tabular-nums">{formatCurrency(night.pricePerNight)}</dd>
                </div>
              ))}
              {quote.taxAmount > 0 && <div className="flex justify-between gap-3"><dt>{isID ? 'Pajak' : 'Tax'}</dt><dd>{formatCurrency(quote.taxAmount)}</dd></div>}
              {quote.serviceFeeAmount > 0 && <div className="flex justify-between gap-3"><dt>{isID ? 'Biaya layanan' : 'Service fee'}</dt><dd>{formatCurrency(quote.serviceFeeAmount)}</dd></div>}
              {quote.discountAmount > 0 && <div className="flex justify-between gap-3"><dt>{isID ? 'Diskon' : 'Discount'}</dt><dd>−{formatCurrency(quote.discountAmount)}</dd></div>}
            </dl>
          </details>
          <p className="flex flex-wrap items-baseline justify-between gap-x-3 border-t border-slate-200 pt-2.5 text-sm font-bold text-navy-dark">
            <span>{isID ? 'Total pembayaran' : 'Total payment'}</span><span className="text-lg tabular-nums" data-checkout-quote-total>{formatCurrency(quote.totalAmount)}</span>
          </p>
        </section>
      ) : quote === null ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          <p role="alert">{isID ? 'Tarif belum dapat dimuat.' : 'Could not load the rates.'}</p>
          <button type="button" onClick={onRetryQuote} className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-2 font-bold hover:bg-rose-100">
            <RotateCw className="size-4" aria-hidden />{isID ? 'Muat ulang tarif' : 'Reload rates'}
          </button>
        </div>
      ) : (
        <p role="status" className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
          <LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden />{isID ? 'Memeriksa tarif untuk tanggal menginap…' : 'Checking rates for your stay…'}
        </p>
      )}

      <section className="flex items-start gap-3 rounded-2xl border border-[#eadcc2] bg-gold-soft/45 p-3 sm:p-4" aria-labelledby="checkout-payment-methods">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-gold-dark"><CreditCard className="size-4" aria-hidden /></span>
        <div className="min-w-0 text-sm leading-5 text-slate-700">
          <h3 id="checkout-payment-methods" className="mb-1 font-bold text-navy-dark">{isID ? 'Pembayaran via Midtrans' : 'Payment via Midtrans'}</h3>
          <p>{isID ? 'Pilih metode pembayaran di tab Midtrans yang terbuka setelah konfirmasi.' : 'Choose your payment method in the Midtrans tab that opens after confirmation.'}</p>
          <p className="mt-1 text-xs font-medium">{isID ? 'Transfer bank, GoPay, QRIS, atau kartu kredit' : 'Bank transfer, GoPay, QRIS, or credit card'}</p>
        </div>
      </section>

      <div className="space-y-2 text-xs leading-5 text-slate-600">
        <p className="flex items-start gap-2.5">
          <Info className="mt-0.5 size-4 shrink-0 text-gold-dark" aria-hidden />
          {isID
            ? 'Ketentuan pembatalan dan jumlah pengembalian dana mengikuti kebijakan kamar saat pembatalan diajukan.'
            : 'Cancellation eligibility and refund amounts follow the room policy when cancellation is requested.'}
        </p>
      </div>

      {error && (
        <motion.div
          ref={errorRef}
          tabIndex={-1}
          initial={reduceMotion ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduceMotion ? { duration: 0 } : fadeTween}
          className="flex items-start gap-2.5 rounded-xl border border-rose-100 bg-rose-50 p-3.5 text-[13px] font-medium leading-5 text-rose-700"
          role="alert"
        >
          <AlertCircle className="mt-px size-4 shrink-0" aria-hidden />
          {error}
        </motion.div>
      )}
    </div>
  );
};
