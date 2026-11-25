import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'motion/react';
import {
  AlertCircle, CalendarDays, ChevronDown, CreditCard, Download, LoaderCircle,
  MapPin, ReceiptText, RotateCw, Ticket, X,
} from 'lucide-react';
import type { Booking, Language } from '../../types';
import type { InvoiceItemType, InvoiceResponse, InvoiceStatus } from '../../types/api';
import { formatCurrency, formatDate } from '../../lib/utils';
import { easeSmooth, fadeTween } from '../../lib/motion';
import { useInvoice } from './useInvoice';
import { InvoiceSkeleton } from './InvoiceSkeleton';
import { applyImageFallback } from '../../lib/imageFallback';

interface InvoiceModalProps {
  booking: Booking | null;
  onClose: () => void;
  language: Language;
}

const lineLabels: Record<InvoiceItemType, [string, string]> = {
  ROOM_NIGHT: ['Kamar', 'Room'],
  TAX: ['Pajak', 'Tax'],
  SERVICE_FEE: ['Biaya layanan', 'Service fee'],
  DISCOUNT: ['Diskon', 'Discount'],
};

type Badge = { labels: [string, string]; tone: string };
const invoiceStatuses: Record<InvoiceStatus, Badge> = {
  ISSUED: { labels: ['Diterbitkan', 'Issued'], tone: 'bg-white/10 text-white ring-white/25' },
  DRAFT: { labels: ['Draf', 'Draft'], tone: 'bg-white/10 text-white ring-white/25' },
  VOID: { labels: ['Dibatalkan', 'Voided'], tone: 'bg-rose-100 text-rose-800 ring-rose-200' },
  REFUNDED: { labels: ['Dikembalikan', 'Refunded'], tone: 'bg-violet-100 text-violet-800 ring-violet-200' },
};
const paymentStatuses: Record<Booking['paymentStatus'], Badge> = {
  paid: { labels: ['Lunas', 'Paid'], tone: 'bg-emerald-50 text-emerald-800 ring-emerald-200' },
  unpaid: { labels: ['Belum dibayar', 'Unpaid'], tone: 'bg-amber-50 text-amber-900 ring-amber-200' },
  pending: { labels: ['Menunggu pembayaran', 'Payment pending'], tone: 'bg-amber-50 text-amber-900 ring-amber-200' },
  failed: { labels: ['Pembayaran gagal', 'Payment failed'], tone: 'bg-rose-50 text-rose-800 ring-rose-200' },
  expired: { labels: ['Kedaluwarsa', 'Expired'], tone: 'bg-slate-100 text-slate-700 ring-slate-200' },
  cancelled: { labels: ['Dibatalkan', 'Cancelled'], tone: 'bg-slate-100 text-slate-700 ring-slate-200' },
  refunded: { labels: ['Dana dikembalikan', 'Refunded'], tone: 'bg-violet-50 text-violet-800 ring-violet-200' },
};
const cardClass = 'min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5';
const buttonClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed';
const primaryButton = buttonClass + ' bg-navy-dark text-white hover:bg-navy disabled:bg-slate-100 disabled:text-slate-600';
const neutralButton = buttonClass + ' border border-slate-200 bg-white text-navy-dark hover:bg-navy-soft disabled:opacity-60';

function InvoiceCharges({ invoice, isID, money }: { invoice: InvoiceResponse; isID: boolean; money: (amount: number) => string }) {
  const rows = [
    { label: 'Subtotal', amount: invoice.subtotalAmount },
    ...(invoice.taxAmount > 0 ? [{ label: isID ? 'Pajak' : 'Tax', amount: invoice.taxAmount }] : []),
    ...(invoice.serviceFeeAmount > 0 ? [{ label: isID ? 'Biaya layanan' : 'Service fee', amount: invoice.serviceFeeAmount }] : []),
    ...(invoice.discountAmount > 0 ? [{ label: isID ? 'Diskon' : 'Discount', amount: -invoice.discountAmount }] : []),
  ];
  return (
    <section className={cardClass}>
      <h3 className="text-base font-semibold text-navy-dark">{isID ? 'Rincian biaya' : 'Cost breakdown'}</h3>
      <dl className="mt-3 divide-y divide-slate-100">
        {rows.map(row => (
          <div key={row.label} className="flex items-baseline justify-between gap-3 py-2.5 text-sm">
            <dt className="text-slate-600">{row.label}</dt>
            <dd className={`min-w-0 break-words text-right font-semibold tabular-nums ${row.amount < 0 ? 'text-emerald-800' : 'text-slate-900'}`}>{money(row.amount)}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-1 flex items-baseline justify-between gap-3 rounded-lg bg-navy-soft/55 px-3 py-2.5 text-sm">
        <span className="font-semibold text-navy-dark">Total</span>
        <span className="min-w-0 break-words text-right font-bold text-navy-dark tabular-nums">{money(invoice.totalAmount)}</span>
      </div>
      {invoice.items?.length > 0 && (
        <details className="group mt-3 border-t border-slate-200 pt-1.5">
          <summary tabIndex={0} className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-md text-sm font-semibold text-navy [&::-webkit-details-marker]:hidden">
            {isID ? 'Lihat item invoice' : 'View invoice items'}
            <ChevronDown className="size-4 shrink-0 motion-safe:transition-transform group-open:rotate-180" aria-hidden />
          </summary>
          <ul className="divide-y divide-slate-100">
            {invoice.items.map(item => (
              <li key={item.id} className="flex justify-between gap-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="break-words font-semibold text-slate-800">{lineLabels[item.itemType]?.[isID ? 0 : 1] ?? item.itemType}{item.quantity > 1 && <span className="font-normal text-slate-600"> × {item.quantity}</span>}</p>
                  {item.description && <p className="mt-0.5 break-words text-xs leading-5 text-slate-600">{item.description}</p>}
                </div>
                <span className={`text-right font-medium tabular-nums ${item.amount < 0 ? 'text-emerald-800' : 'text-slate-800'}`}>{money(item.amount)}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

export function InvoiceModal({ booking, onClose, language }: InvoiceModalProps) {
  const isID = language === 'ID';
  const reduceMotion = useReducedMotion();
  const { invoice, loading, notFound, error, downloading, downloadError, reload, downloadPdf } = useInvoice(booking, isID);
  const open = Boolean(booking);
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const downloadRef = useRef<HTMLButtonElement>(null);
  const dialogState = useRef({ downloading, onClose });
  dialogState.current = { downloading, onClose };

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (!dialogState.current.downloading) dialogState.current.onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const controls = Array.from(panelRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], summary, [tabindex="0"]') ?? [])
        .filter(element => element.tabIndex >= 0 && element.getClientRects().length > 0);
      const first = controls[0];
      const last = controls.at(-1);
      if (!first || !last) {
        event.preventDefault();
        panelRef.current?.focus();
      } else {
        const activeElement = document.activeElement as HTMLElement | null;
        const outsideControls = !activeElement || !controls.includes(activeElement);
        if (event.shiftKey && (activeElement === first || outsideControls)) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && (activeElement === last || outsideControls)) { event.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = previousOverflow;
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, [open]);

  useEffect(() => {
    if (open && downloading) panelRef.current?.focus({ preventScroll: true });
    else if (open && document.activeElement === panelRef.current) {
      (downloadRef.current && !downloadRef.current.disabled ? downloadRef.current : closeRef.current)?.focus({ preventScroll: true });
    }
  }, [open, downloading]);

  if (!booking) return null;

  const dismiss = () => { if (!dialogState.current.downloading) dialogState.current.onClose(); };
  const currency = invoice?.currency?.toUpperCase();
  const money = currency && currency !== 'IDR' && /^[A-Z]{3}$/.test(currency)
    ? new Intl.NumberFormat(isID ? 'id-ID' : 'en-US', { style: 'currency', currency }).format
    : formatCurrency;
  const paymentStatus = invoice?.status === 'REFUNDED' ? 'refunded'
    : invoice?.status === 'ISSUED' && invoice.paidAt && ['pending', 'unpaid'].includes(booking.paymentStatus) ? 'paid'
      : booking.paymentStatus;
  const paymentBadge = paymentStatuses[paymentStatus];
  const invoiceBadge = invoice && invoiceStatuses[invoice.status];
  const invoiceDate = invoice?.issuedAt || invoice?.invoiceDate || invoice?.createdAt;
  const nights = invoice?.nightsCount ?? booking.nights;

  return createPortal(
    <motion.div
      initial="enter" animate="open" exit="exit"
      className="fixed inset-0 z-[80] flex items-end justify-center p-2 sm:items-center sm:p-5"
      onClick={event => { if (event.target === event.currentTarget) dismiss(); }}
      data-invoice-modal
    >
      <motion.div
        aria-hidden onClick={dismiss}
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-[3px]"
        variants={{ enter: { opacity: 0 }, open: { opacity: 1 }, exit: { opacity: 0 } }}
        transition={reduceMotion ? { duration: 0 } : fadeTween}
      />
      <motion.div
        ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-busy={loading || downloading} tabIndex={-1}
        variants={{
          enter: { y: reduceMotion ? 0 : 14, scale: reduceMotion ? 1 : 0.99 },
          open: { y: 0, scale: 1, opacity: 1 },
          exit: { y: reduceMotion ? 0 : 8, opacity: 0 },
        }}
        transition={{ duration: reduceMotion ? 0 : 0.22, ease: easeSmooth }}
        className="invoice-dialog relative flex max-h-[calc(100dvh-1rem)] w-full max-w-[800px] flex-col overflow-hidden rounded-[22px] border border-white/70 bg-white text-slate-800 shadow-[0_28px_90px_rgba(8,24,54,0.3)] outline-none sm:max-h-[calc(100dvh-2.5rem)] sm:rounded-[26px]"
      >
        <header className="relative shrink-0 overflow-hidden border-t-2 border-gold-light bg-[#14264d] bg-[radial-gradient(ellipse_at_left_top,#233d74_0%,transparent_70%)] px-4 py-4 text-white sm:px-6 sm:py-5">
          <div className="flex items-start gap-3 pr-12">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/15 bg-white/10 text-gold-light sm:size-11"><ReceiptText className="size-5" aria-hidden /></span>
            <div className="min-w-0">
              <h2 id={titleId} className="font-serif text-[1.65rem] leading-none tracking-tight sm:text-[2rem]">Invoice</h2>
              <code className="mt-1.5 block min-w-0 break-all font-mono text-xs text-white/85">{invoice?.invoiceNumber || booking.bookingCode}</code>
            </div>
          </div>
          <button ref={closeRef} type="button" onClick={dismiss} disabled={downloading} aria-label={isID ? 'Tutup invoice' : 'Close invoice'} className="absolute top-3 right-3 grid size-11 cursor-pointer place-items-center rounded-xl border border-white/20 text-white transition-colors hover:bg-white/15 disabled:cursor-wait disabled:opacity-60 sm:top-4 sm:right-5">
            <X className="size-5" aria-hidden />
          </button>
          {invoice && (
            <div className="mt-3 flex flex-wrap items-center gap-2.5 text-xs text-white/85">
              {invoiceBadge && <span className={`rounded-full px-2.5 py-1 font-semibold ring-1 ring-inset ${invoiceBadge.tone}`}>{invoiceBadge.labels[isID ? 0 : 1]}</span>}
              {invoiceDate && <span className="flex items-center gap-1.5"><CalendarDays className="size-3.5 text-gold-light" aria-hidden />{invoice.issuedAt ? (isID ? 'Terbit ' : 'Issued ') : ''}{formatDate(invoiceDate, language)}</span>}
            </div>
          )}
        </header>

        <div role="region" aria-label={isID ? 'Isi invoice' : 'Invoice content'} tabIndex={0} className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-slate-50/80 px-3 py-3 sm:px-5 sm:py-5">
          <section className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-2xl border border-gold-soft bg-[#fcf8ee] px-4 py-3.5 sm:mb-4 sm:px-5 sm:py-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-700">{invoice ? 'Total invoice' : isID ? 'Total reservasi' : 'Reservation total'}</p>
              <p className="mt-1 break-words text-[clamp(1.25rem,5vw,1.9rem)] font-bold leading-tight tracking-tight text-navy-dark tabular-nums">{money(invoice?.totalAmount ?? booking.totalPrice)}</p>
            </div>
            <div className="flex min-w-0 flex-wrap items-center gap-2 sm:justify-end">
              {paymentBadge && <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${paymentBadge.tone}`}>{paymentBadge.labels[isID ? 0 : 1]}</span>}
              {invoice?.paymentMethod && <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"><CreditCard className="size-4 text-navy" aria-hidden />{invoice.paymentMethod}</span>}
            </div>
          </section>

          {invoice?.status === 'VOID' && invoice.voidReason && (
            <p className="mb-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm leading-5 text-rose-800"><AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />{invoice.voidReason}</p>
          )}

          <div className="grid items-start gap-3 sm:gap-4 min-[680px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <section className={cardClass}>
              <h3 className="text-base font-semibold text-navy-dark">{isID ? 'Detail reservasi' : 'Reservation details'}</h3>
              <div className="mt-3 flex items-start gap-3">
                {booking.hotelImage && <img src={booking.hotelImage} alt="" onError={applyImageFallback} className="size-13 shrink-0 rounded-xl bg-navy-soft object-cover sm:size-14" />}
                <div className="min-w-0">
                  <p className="break-words font-semibold leading-snug text-navy-dark">{invoice?.hotelName || booking.hotelName}</p>
                  <p className="mt-0.5 break-words text-xs leading-5 text-slate-600">{invoice?.roomName || booking.roomType}</p>
                  {booking.hotelAddress && <p className="mt-1 flex items-start gap-1 text-xs leading-4 text-slate-600"><MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />{booking.hotelAddress}</p>}
                </div>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-x-2 gap-y-3 border-t border-slate-200 pt-3 text-sm">
                <div>
                  <dt className="text-xs text-slate-600">Check-in</dt>
                  <dd className="mt-0.5 font-medium text-slate-900">{formatDate(invoice?.checkInDate || booking.checkIn, language)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-600">Check-out</dt>
                  <dd className="mt-0.5 font-medium text-slate-900">{formatDate(invoice?.checkOutDate || booking.checkOut, language)}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs text-slate-600">{isID ? 'Tamu' : 'Guest'}</dt>
                  <dd className="mt-0.5 break-words font-medium text-slate-900">{invoice?.customerName || booking.guestName || '—'}</dd>
                  {(invoice?.customerEmail || booking.guestEmail) && <dd className="break-all text-xs text-slate-600">{invoice?.customerEmail || booking.guestEmail}</dd>}
                </div>
              </dl>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-2.5 py-2.5 text-xs text-slate-600">
                <span className="flex min-w-0 items-center gap-1.5"><Ticket className="size-4 shrink-0 text-navy" aria-hidden /><span className="sr-only">{isID ? 'Kode reservasi' : 'Reservation code'}</span><code className="break-all font-mono font-semibold text-navy-dark">{booking.bookingCode}</code></span>
                <span>{nights} {isID ? 'malam' : nights === 1 ? 'night' : 'nights'}</span>
              </div>
            </section>

            {loading ? <InvoiceSkeleton isID={isID} /> : invoice ? (
              <InvoiceCharges invoice={invoice} isID={isID} money={money} />
            ) : (
              <section className={cardClass + ' space-y-3'} role={error ? 'alert' : 'status'}>
                <span className={`grid size-10 place-items-center rounded-xl ${error ? 'bg-rose-50 text-rose-700' : 'bg-navy-soft text-navy'}`}>
                  {error ? <AlertCircle className="size-5" aria-hidden /> : <ReceiptText className="size-5" aria-hidden />}
                </span>
                <div>
                  <h3 className="text-base font-semibold text-navy-dark">
                    {error ? (isID ? 'Invoice gagal dimuat' : 'The invoice could not be loaded') : (isID ? 'Invoice belum tersedia' : 'Invoice not available')}
                  </h3>
                  <p className="mt-1 break-words text-sm leading-6 text-slate-600">
                    {error || (notFound && (paymentStatus === 'unpaid' || paymentStatus === 'pending')
                      ? (isID ? 'Invoice terbit setelah pembayaran dikonfirmasi.' : 'The invoice is issued after payment is confirmed.')
                      : paymentStatus === 'paid'
                        ? (isID ? 'Pembayaran tercatat. Muat ulang untuk memeriksa apakah invoice sudah terbit.' : 'Payment is recorded. Reload to check whether the invoice has been issued.')
                        : (isID ? 'Belum ada invoice untuk reservasi ini.' : 'This reservation has no invoice yet.'))}
                  </p>
                </div>
                <button type="button" onClick={reload} className={neutralButton}><RotateCw className="size-4" aria-hidden />{error ? (isID ? 'Coba lagi' : 'Try again') : (isID ? 'Muat ulang' : 'Reload')}</button>
              </section>
            )}
          </div>
        </div>

        <footer className="shrink-0 space-y-2 border-t border-slate-200 bg-white px-3 py-3 sm:px-5">
          {downloadError && <p role="alert" className="flex items-start gap-2 break-words rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800"><AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />{downloadError}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={dismiss} disabled={downloading} className={neutralButton + ' cursor-pointer'}>{isID ? 'Tutup' : 'Close'}</button>
            <button
              ref={downloadRef} type="button" onClick={() => void downloadPdf()} disabled={!invoice || loading || downloading} aria-busy={downloading}
              className={primaryButton + ' flex-1 cursor-pointer sm:min-w-36 sm:flex-none'}
            >
              {downloading ? <LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden /> : <Download className="size-4" aria-hidden />}
              {downloading ? (isID ? 'Mengunduh…' : 'Downloading…') : (isID ? 'Unduh PDF' : 'Download PDF')}
            </button>
          </div>
        </footer>
      </motion.div>
    </motion.div>,
    document.body,
  );
}
