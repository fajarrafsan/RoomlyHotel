import React from 'react';
import { motion } from 'motion/react';
import {
  X,
  Download,
  CheckCircle2,
  Building2,
  CalendarDays,
  Clock,
  MapPin,
  ShieldCheck,
  User,
  Mail,
  Loader2,
  AlertCircle,
  RotateCw,
  ArrowUpRight,
  Receipt,
  Ticket,
  ReceiptText
} from 'lucide-react';
import { Booking, Language } from '../../types';
import { InvoiceItemType } from '../../types/api';
import { formatCurrency, formatDate } from '../../lib/utils';
import { useInvoice } from './useInvoice';
import { InvoiceSkeleton } from './InvoiceSkeleton';

interface InvoiceModalProps {
  booking: Booking | null;
  onClose: () => void;
  language: Language;
}

const ITEM_TYPE_LABELS: Record<InvoiceItemType, { id: string; en: string }> = {
  ROOM_NIGHT: { id: 'Kamar', en: 'Room' },
  TAX: { id: 'Pajak', en: 'Tax' },
  SERVICE_FEE: { id: 'Biaya Layanan', en: 'Service Fee' },
  DISCOUNT: { id: 'Diskon', en: 'Discount' },
};

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
  ISSUED: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  DRAFT: { bg: 'bg-slate-50', text: 'text-slate-600', dot: 'bg-slate-400' },
  VOID: { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' },
  REFUNDED: { bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-500' },
};

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ booking, onClose, language }) => {
  const isID = language === 'ID';
  const {
    invoice, loading, notFound, error, downloading, downloadError, reload, downloadPdf,
  } = useInvoice(booking, isID);

  if (!booking) return null;

  const statusConfig = invoice ? (STATUS_CONFIG[invoice.status] || STATUS_CONFIG.DRAFT) : null;
  const issuedOn = invoice?.issuedAt || invoice?.createdAt;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="bg-white rounded-2xl max-w-lg w-full shadow-[0_24px_60px_rgba(15,23,42,0.18)] border border-slate-100 overflow-hidden relative max-h-[92vh] flex flex-col my-auto"
      >
        {/* Hairline accent */}
        <div className="h-1 w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent shrink-0" />

        {/* ===== Header ===== */}
        <header className="relative px-5 py-4 border-b border-slate-100 overflow-hidden shrink-0">
          <span className="absolute -right-2 -top-6 font-serif italic text-[80px] leading-none text-slate-900/[0.03] select-none pointer-events-none">
            Inv
          </span>

          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-slate-950 text-white flex items-center justify-center shadow-md shadow-slate-950/15 shrink-0">
                <Receipt className="w-4 h-4" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  {isID ? 'Struk Resmi' : 'Official Receipt'}
                </p>
                <h3 className="font-serif text-lg text-slate-950 tracking-tight leading-tight mt-0.5">
                  {invoice ? invoice.invoiceNumber : `${isID ? 'Booking' : 'Booking'} ${booking.bookingCode}`}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {statusConfig && (
                <span className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.bg.replace('bg-', 'border-').replace('50', '100')}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                  {invoice?.status}
                </span>
              )}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center border border-slate-100"
                aria-label={isID ? 'Tutup' : 'Close'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 font-light">
            <span className="inline-flex items-center gap-1.5">
              <Ticket className="w-3.5 h-3.5 text-slate-300" />
              <code className="font-mono font-semibold text-slate-500">{booking.bookingCode}</code>
            </span>
            {issuedOn && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-slate-300" />
                {isID ? 'Diterbitkan' : 'Issued'} · {formatDate(issuedOn, language)}
              </span>
            )}
          </div>
        </header>

        {/* ===== Body ===== */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Hotel & guest summary */}
          <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 ring-1 ring-slate-100 shrink-0">
                <img
                  src={booking.hotelImage}
                  alt={booking.hotelName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <h2 className="font-serif text-lg text-slate-950 tracking-tight leading-snug truncate">
                  {booking.hotelName}
                </h2>
                <div className="flex items-center gap-1.5 text-[12px] text-slate-400 font-light truncate">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{booking.hotelAddress}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[12px] text-slate-500 font-light truncate">
                  <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">
                    {booking.roomType}
                    {booking.bedType && ` · ${booking.bedType}`}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50/70 border border-slate-100/80">
                <span className="w-7 h-7 rounded-lg bg-white border border-slate-100 flex items-center justify-center shrink-0">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                </span>
                <div className="min-w-0">
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                    {isID ? 'Nama Tamu' : 'Guest'}
                  </p>
                  <p className="text-[12px] font-semibold text-slate-800 truncate">
                    {booking.guestName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50/70 border border-slate-100/80">
                <span className="w-7 h-7 rounded-lg bg-white border border-slate-100 flex items-center justify-center shrink-0">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                </span>
                <div className="min-w-0">
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                    Email
                  </p>
                  <p className="text-[12px] font-semibold text-slate-800 truncate">
                    {booking.guestEmail}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Stay summary */}
          <section className="grid grid-cols-3 gap-0 rounded-2xl border border-slate-100 overflow-hidden divide-x divide-slate-100">
            <div className="p-3 text-center space-y-0.5 bg-white">
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">
                {isID ? 'Check-in' : 'Check-in'}
              </span>
              <span className="text-[13px] font-semibold text-slate-900 block truncate">
                {formatDate(booking.checkIn, language)}
              </span>
              <span className="text-[10px] text-slate-400 font-light flex items-center justify-center gap-1">
                <Clock className="w-3 h-3" />
                14:00
              </span>
            </div>
            <div className="p-3 text-center flex flex-col items-center justify-center bg-slate-50/50">
              <span className="px-2.5 py-0.5 rounded-full bg-white border border-slate-100 text-[10px] font-bold text-slate-600 shadow-2xs">
                {booking.nights} {isID ? 'malam' : 'nights'}
              </span>
            </div>
            <div className="p-3 text-center space-y-0.5 bg-white">
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">
                {isID ? 'Check-out' : 'Check-out'}
              </span>
              <span className="text-[13px] font-semibold text-slate-900 block truncate">
                {formatDate(booking.checkOut, language)}
              </span>
              <span className="text-[10px] text-slate-400 font-light flex items-center justify-center gap-1">
                <Clock className="w-3 h-3" />
                12:00
              </span>
            </div>
          </section>

          {/* Invoice data */}
          {loading ? (
            <InvoiceSkeleton />
          ) : notFound ? (
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-3">
              <div className="w-11 h-11 rounded-xl bg-white border border-slate-100 flex items-center justify-center mx-auto shadow-2xs">
                <ReceiptText className="w-5 h-5 text-slate-300" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-slate-700">
                  {isID ? 'Invoice belum tersedia' : 'Invoice not available yet'}
                </p>
                <p className="text-[12px] text-slate-400 font-light max-w-sm mx-auto mt-1 leading-relaxed">
                  {booking.paymentStatus !== 'paid'
                    ? (isID
                        ? 'Invoice akan tersedia setelah pembayaran dikonfirmasi.'
                        : 'Invoice will be available once payment is confirmed.')
                    : (isID
                        ? 'Invoice sedang diproses. Coba periksa lagi nanti.'
                        : 'Invoice is being generated. Please check again shortly.')}
                </p>
              </div>
              <button
                onClick={reload}
                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-700 hover:text-slate-900 transition-colors"
              >
                <RotateCw className="w-3.5 h-3.5" />
                {isID ? 'Muat ulang' : 'Reload'}
              </button>
            </div>
          ) : error ? (
            <div className="p-6 rounded-2xl bg-rose-50 border border-rose-100 text-center space-y-3">
              <div className="w-11 h-11 rounded-xl bg-white border border-rose-100 flex items-center justify-center mx-auto shadow-2xs">
                <AlertCircle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-rose-700">
                  {isID ? 'Gagal memuat invoice' : 'Failed to load the invoice'}
                </p>
                <p className="text-[12px] text-rose-500/80 font-light mt-1">{error}</p>
              </div>
              <button
                onClick={reload}
                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-rose-700 hover:text-rose-900 transition-colors"
              >
                <RotateCw className="w-3.5 h-3.5" />
                {isID ? 'Coba lagi' : 'Try again'}
              </button>
            </div>
          ) : invoice ? (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.12em]">
                  {isID ? 'Rincian Pembayaran' : 'Payment Details'}
                </h4>
                {statusConfig && (
                  <span className={`sm:hidden inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.bg.replace('bg-', 'border-').replace('50', '100')}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                    {invoice.status}
                  </span>
                )}
              </div>

              {/* Itemized lines */}
              <div className="rounded-2xl border border-slate-100 divide-y divide-slate-50 overflow-hidden text-[12px]">
                {invoice.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50/30 transition-colors">
                    <div className="min-w-0">
                      <span className="font-medium text-slate-700 block truncate">
                        {isID ? ITEM_TYPE_LABELS[item.itemType].id : ITEM_TYPE_LABELS[item.itemType].en}
                        {item.quantity > 1 && (
                          <span className="text-slate-300 font-light"> · {item.quantity}x</span>
                        )}
                      </span>
                      {item.description && (
                        <span className="text-[11px] text-slate-400 font-light block truncate">{item.description}</span>
                      )}
                    </div>
                    <span className={`font-semibold shrink-0 ml-3 ${item.amount < 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                ))}

                {/* Summary */}
                <div className="px-4 py-2.5 space-y-1 bg-slate-50/40 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-light">{isID ? 'Subtotal' : 'Subtotal'}</span>
                    <span className="font-medium text-slate-600">{formatCurrency(invoice.subtotalAmount)}</span>
                  </div>
                  {invoice.taxAmount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-light">{isID ? 'Pajak' : 'Tax'}</span>
                      <span className="font-medium text-slate-600">{formatCurrency(invoice.taxAmount)}</span>
                    </div>
                  )}
                  {invoice.serviceFeeAmount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-light">{isID ? 'Biaya Layanan' : 'Service Fee'}</span>
                      <span className="font-medium text-slate-600">{formatCurrency(invoice.serviceFeeAmount)}</span>
                    </div>
                  )}
                  {invoice.discountAmount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-light">{isID ? 'Diskon' : 'Discount'}</span>
                      <span className="font-semibold text-emerald-600">-{formatCurrency(invoice.discountAmount)}</span>
                    </div>
                  )}
                </div>

                <div className="px-4 py-3 bg-slate-50 flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-slate-700">{isID ? 'Total' : 'Total'}</span>
                  <span className="font-serif text-xl font-semibold text-slate-950 tracking-tight">
                    {formatCurrency(invoice.totalAmount)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] px-1">
                <span className="text-slate-400 font-light">{isID ? 'Metode Pembayaran' : 'Payment Method'}</span>
                <span className="font-medium text-slate-700">{invoice.paymentMethod || '—'}</span>
              </div>

              {downloadError && (
                <p className="text-[11px] text-rose-600 text-center font-medium">{downloadError}</p>
              )}
            </section>
          ) : null}

          {/* Check-in instructions */}
          <div className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-white border border-slate-100 flex items-center justify-center shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
              </span>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                {isID ? 'Instruksi Check-in' : 'Check-in Instructions'}
              </span>
            </div>
            <p className="text-[12px] text-slate-600 font-light leading-relaxed pl-8">
              {isID
                ? `Tunjukkan kode booking Anda kepada resepsionis saat tiba di hotel: `
                : `Present your booking code to the receptionist upon arrival: `}
              <code className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-900 font-mono text-[11px] font-semibold">
                {booking.bookingCode}
              </code>
            </p>
          </div>
        </div>

        {/* ===== Footer ===== */}
        <div className="px-5 py-3.5 bg-white border-t border-slate-100 flex flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-light">
            <span className="w-4 h-4 rounded-md bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            </span>
            {isID ? 'Pemesanan terkonfirmasi' : 'Booking confirmed'}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={downloadPdf}
              disabled={!invoice || downloading}
              className="py-2 px-3 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50 text-[12px] font-semibold transition-all flex items-center justify-center gap-1.5 disabled:opacity-30"
            >
              {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>{isID ? 'Unduh PDF' : 'Download PDF'}</span>
            </button>
            <button
              onClick={onClose}
              className="py-2 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-[12px] font-semibold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-slate-950/10 active:scale-[0.97]"
            >
              {isID ? 'Selesai' : 'Done'}
              <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
