import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, Building2, CalendarDays, CheckCircle2, Download, FileText, Loader2, X } from 'lucide-react';
import { Booking, Language } from '../types';
import { BookingCancellationResponse, InvoiceSummaryResponse } from '../types/api';
import { BookingCard } from '../components/booking/BookingCard';
import { StatusPill } from '../components/admin/StatusPill';
import { ApiError } from '../lib/http';
import { formatCurrency } from '../lib/utils';
import { bookingApi } from '../api/bookings';
import { invoiceApi } from '../api/invoices';
import { useAuth } from '../context/AuthContext';

interface BookingsPageProps {
  bookings: Booking[];
  onOpenInvoice: (booking: Booking) => void;
  onCancelBooking: (bookingId: string, reason?: string) => Promise<BookingCancellationResponse>;
  language: Language;
}

export const BookingsPage: React.FC<BookingsPageProps> = ({
  bookings,
  onOpenInvoice,
  onCancelBooking,
  language
}) => {
  const isID = language === 'ID';
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelResult, setCancelResult] = useState<BookingCancellationResponse | null>(null);
  const [cancelMode, setCancelMode] = useState<'cancel' | 'view'>('cancel');
  const [invoices, setInvoices] = useState<InvoiceSummaryResponse[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<number | null>(null);

  useEffect(() => {
    if (user?.role !== 'CUSTOMER') {
      setInvoices([]);
      setInvoiceError(null);
      return;
    }

    let cancelled = false;
    setInvoicesLoading(true);
    setInvoiceError(null);
    invoiceApi.myInvoices(0, 50)
      .then((page) => {
        if (!cancelled) setInvoices(page.content);
      })
      .catch((err) => {
        if (!cancelled) {
          setInvoiceError(err instanceof ApiError
            ? err.message
            : (isID ? 'Riwayat invoice tidak dapat dimuat.' : 'Invoice history could not be loaded.'));
        }
      })
      .finally(() => {
        if (!cancelled) setInvoicesLoading(false);
      });

    return () => { cancelled = true; };
  }, [isID, user?.role, user?.userId]);

  const downloadInvoice = async (invoice: InvoiceSummaryResponse) => {
    setDownloadingInvoiceId(invoice.id);
    setInvoiceError(null);
    try {
      const { blob, filename } = await invoiceApi.downloadPdf(invoice.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename || `${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setInvoiceError(err instanceof ApiError
        ? err.message
        : (isID ? 'PDF invoice tidak dapat diunduh.' : 'The invoice PDF could not be downloaded.'));
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  const closeCancellation = () => {
    if (cancelSubmitting) return;
    setCancellingBooking(null);
    setCancelReason('');
    setCancelError(null);
    setCancelResult(null);
    setCancelMode('cancel');
  };

  const viewCancellation = async (booking: Booking) => {
    setCancellingBooking(booking);
    setCancelMode('view');
    setCancelResult(null);
    setCancelError(null);
    setCancelSubmitting(true);
    try {
      setCancelResult(await bookingApi.cancellation(Number(booking.id)));
    } catch (err) {
      setCancelError(err instanceof ApiError
        ? err.message
        : (isID ? 'Rincian pembatalan tidak dapat dimuat.' : 'Cancellation details could not be loaded.'));
    } finally {
      setCancelSubmitting(false);
    }
  };

  const submitCancellation = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!cancellingBooking) return;
    setCancelSubmitting(true);
    setCancelError(null);
    try {
      const result = await onCancelBooking(cancellingBooking.id, cancelReason.trim() || undefined);
      setCancelResult(result);
    } catch (err) {
      setCancelError(err instanceof ApiError
        ? err.message
        : (isID ? 'Pembatalan gagal diproses. Coba lagi.' : 'Cancellation could not be processed. Please try again.'));
    } finally {
      setCancelSubmitting(false);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'all') return true;
    return b.status === activeTab;
  });

  const tabs = [
    { key: 'all' as const, label: isID ? 'Semua' : 'All' },
    { key: 'pending' as const, label: isID ? 'Menunggu' : 'Pending' },
    { key: 'confirmed' as const, label: isID ? 'Aktif' : 'Active' },
    { key: 'completed' as const, label: isID ? 'Selesai' : 'Completed' },
    { key: 'cancelled' as const, label: isID ? 'Dibatalkan' : 'Cancelled' },
  ] as const;

  return (
    <>
    <div className="max-w-[1800px] mx-auto space-y-8 pb-20 px-4 sm:px-6 lg:px-12 2xl:px-16">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-5"
      >
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-semibold text-slate-950 tracking-tight">
            {isID ? 'Reservasi Saya' : 'My Bookings'}
          </h1>
          <div className="h-px w-12 bg-slate-200" />
          <p className="text-[14px] text-slate-400 font-light max-w-md">
            {isID
              ? 'Kelola invoice, lihat detail pembayaran, dan pantau status reservasi Anda.'
              : 'Manage invoices, view payment details, and track your reservation status.'}
          </p>
        </div>

        <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-white border border-slate-100 shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
          <span className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500">
            <CalendarDays className="w-5 h-5" />
          </span>
          <div>
            <p className="text-xl font-bold text-slate-950 leading-none">{bookings.length}</p>
            <p className="text-[11px] text-slate-400 font-medium mt-1">{isID ? 'Total Reservasi' : 'Total Bookings'}</p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1.5 bg-slate-50 rounded-2xl border border-slate-100 w-fit overflow-x-auto max-w-full">
        {tabs.map((tab) => {
          const count = bookings.filter((b) => tab.key === 'all' || b.status === tab.key).length;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative px-4 py-2 rounded-xl text-[13px] font-semibold transition-all duration-200 whitespace-nowrap flex items-center gap-1.5 ${
                active
                  ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.label}
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md leading-none ${
                active ? 'bg-slate-100 text-slate-700' : 'bg-slate-100/60 text-slate-400'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Booking List */}
      <div className="space-y-5">
        {filteredBookings.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-16 text-center bg-white rounded-3xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center mx-auto">
              <Building2 className="w-7 h-7 text-slate-300" />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-slate-700">
                {isID ? 'Tidak ada reservasi' : 'No bookings found'}
              </p>
              <p className="text-[13px] text-slate-400 font-light mt-1">
                {isID ? 'Belum ada reservasi di kategori ini.' : 'There are no reservations in this category.'}
              </p>
            </div>
          </motion.div>
        ) : (
          filteredBookings.map((booking, idx) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              isID={isID}
              index={idx}
              onOpenInvoice={onOpenInvoice}
              onCancelBooking={() => {
                setCancellingBooking(booking);
                setCancelReason('');
                setCancelError(null);
                setCancelResult(null);
                setCancelMode('cancel');
              }}
              onViewCancellation={() => { void viewCancellation(booking); }}
            />
          ))
        )}
      </div>

      {user?.role === 'CUSTOMER' && (
        <section className="space-y-4" aria-labelledby="invoice-history-title">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 pt-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-700">
                {isID ? 'Dokumen pembayaran' : 'Payment documents'}
              </p>
              <h2 id="invoice-history-title" className="text-xl sm:text-2xl font-semibold text-slate-950 mt-1">
                {isID ? 'Riwayat invoice' : 'Invoice history'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {isID
                  ? 'Invoice resmi dari reservasi yang pembayarannya telah diproses.'
                  : 'Official invoices from bookings whose payments have been processed.'}
              </p>
            </div>
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
              <FileText className="w-4 h-4" />
              {invoices.length} {isID ? 'invoice' : 'invoices'}
            </span>
          </div>

          {invoiceError && (
            <p role="alert" className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700">
              {invoiceError}
            </p>
          )}

          {invoicesLoading ? (
            <div className="min-h-28 rounded-2xl border border-slate-100 bg-white flex items-center justify-center gap-2 text-sm text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              {isID ? 'Memuat riwayat invoice...' : 'Loading invoice history...'}
            </div>
          ) : invoices.length === 0 ? (
            <div className="min-h-28 rounded-2xl border border-slate-100 bg-white flex flex-col items-center justify-center gap-2 text-center px-4">
              <FileText className="w-6 h-6 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">
                {isID ? 'Belum ada invoice yang diterbitkan.' : 'No invoices have been issued yet.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {invoices.map((invoice) => (
                <article key={invoice.id} className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-5 shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{invoice.invoiceNumber}</p>
                      <p className="text-xs text-slate-500 mt-1 truncate">{invoice.hotelName} · {invoice.bookingCode}</p>
                    </div>
                    <StatusPill status={invoice.status} />
                  </div>
                  <dl className="grid grid-cols-2 gap-3 mt-4 text-xs">
                    <div><dt className="text-slate-400">{isID ? 'Tanggal' : 'Date'}</dt><dd className="font-medium text-slate-700 mt-1">{invoice.invoiceDate}</dd></div>
                    <div><dt className="text-slate-400">Total</dt><dd className="font-semibold text-slate-900 mt-1">{formatCurrency(invoice.totalAmount)}</dd></div>
                    <div><dt className="text-slate-400">Check-in</dt><dd className="font-medium text-slate-700 mt-1">{invoice.checkInDate}</dd></div>
                    <div><dt className="text-slate-400">Check-out</dt><dd className="font-medium text-slate-700 mt-1">{invoice.checkOutDate}</dd></div>
                  </dl>
                  <button
                    type="button"
                    onClick={() => { void downloadInvoice(invoice); }}
                    disabled={downloadingInvoiceId === invoice.id}
                    className="mt-4 min-h-11 w-full rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center justify-center gap-2 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {downloadingInvoiceId === invoice.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Download className="w-4 h-4" />}
                    {isID ? 'Unduh PDF' : 'Download PDF'}
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>

    {cancellingBooking && (
      <div className="fixed inset-0 z-[70] bg-slate-950/55 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="cancel-booking-title">
        <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-100 shadow-2xl overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${cancelResult ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                {cancelResult ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              </span>
              <div>
                <h2 id="cancel-booking-title" className="text-base font-semibold text-slate-900">
                  {cancelResult
                    ? (isID ? 'Pembatalan Diproses' : 'Cancellation Processed')
                    : cancelMode === 'view'
                      ? (isID ? 'Rincian Pembatalan' : 'Cancellation Details')
                      : (isID ? 'Konfirmasi Pembatalan' : 'Confirm Cancellation')}
                </h2>
                <p className="text-xs text-slate-500 mt-1">{cancellingBooking.bookingCode} · {cancellingBooking.hotelName}</p>
              </div>
            </div>
            <button type="button" onClick={closeCancellation} disabled={cancelSubmitting} className="w-11 h-11 rounded-xl hover:bg-slate-100 text-slate-500 flex items-center justify-center disabled:opacity-40" aria-label={isID ? 'Tutup' : 'Close'}>
              <X className="w-4 h-4" />
            </button>
          </div>

          {cancelMode === 'view' && cancelSubmitting ? (
            <div className="p-10 flex items-center justify-center gap-2 text-sm text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              {isID ? 'Memuat rincian pembatalan...' : 'Loading cancellation details...'}
            </div>
          ) : cancelResult ? (
            <div className="p-5 sm:p-6 space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                {isID
                  ? 'Reservasi sudah dibatalkan. Rincian finansial di bawah berasal langsung dari kebijakan pembatalan backend.'
                  : 'The booking has been cancelled. The financial details below come directly from the backend cancellation policy.'}
              </p>
              <dl className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3"><dt className="text-slate-400">{isID ? 'Biaya pembatalan' : 'Cancellation fee'}</dt><dd className="text-sm font-semibold text-slate-900 mt-1">{cancelResult.cancellationFeeAmount == null ? '—' : formatCurrency(cancelResult.cancellationFeeAmount)}</dd></div>
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3"><dt className="text-slate-400">{isID ? 'Nilai refund' : 'Refund amount'}</dt><dd className="text-sm font-semibold text-slate-900 mt-1">{cancelResult.refundAmount == null ? '—' : formatCurrency(cancelResult.refundAmount)}</dd></div>
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3"><dt className="text-slate-400">{isID ? 'Status pembatalan' : 'Cancellation status'}</dt><dd className="text-sm font-semibold text-slate-900 mt-1">{cancelResult.status.replace(/_/g, ' ')}</dd></div>
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3"><dt className="text-slate-400">{isID ? 'Status refund' : 'Refund status'}</dt><dd className="text-sm font-semibold text-slate-900 mt-1">{cancelResult.refundStatus.replace(/_/g, ' ')}</dd></div>
              </dl>
              <button type="button" onClick={closeCancellation} className="w-full min-h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold">
                {isID ? 'Selesai' : 'Done'}
              </button>
            </div>
          ) : cancelMode === 'view' ? (
            <div className="p-5 sm:p-6 space-y-4">
              <p role="alert" className="rounded-xl bg-rose-50 border border-rose-100 p-3 text-xs text-rose-700">
                {cancelError || (isID ? 'Rincian pembatalan belum tersedia.' : 'Cancellation details are not available yet.')}
              </p>
              <button type="button" onClick={closeCancellation} className="w-full min-h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold">
                {isID ? 'Tutup' : 'Close'}
              </button>
            </div>
          ) : (
            <form onSubmit={submitCancellation} className="p-5 sm:p-6 space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                {isID
                  ? 'Biaya atau refund dihitung oleh kebijakan hotel setelah Anda mengonfirmasi. Tindakan ini tidak dapat dibatalkan.'
                  : 'Any fee or refund is calculated from the hotel policy after confirmation. This action cannot be undone.'}
              </p>
              <label className="block space-y-1.5 text-xs font-medium text-slate-700">
                <span>{isID ? 'Alasan pembatalan (opsional)' : 'Cancellation reason (optional)'}</span>
                <textarea value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} rows={4} maxLength={500} className="w-full rounded-xl border border-slate-200 p-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-slate-300" placeholder={isID ? 'Tuliskan alasan singkat...' : 'Add a short reason...'} />
              </label>
              {cancelError && <p role="alert" className="text-xs text-rose-700">{cancelError}</p>}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                <button type="button" onClick={closeCancellation} disabled={cancelSubmitting} className="min-h-11 px-5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 disabled:opacity-40">{isID ? 'Kembali' : 'Go back'}</button>
                <button type="submit" disabled={cancelSubmitting} className="min-h-11 px-5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50">
                  {cancelSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isID ? 'Ya, Batalkan Reservasi' : 'Yes, Cancel Booking'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    )}
    </>
  );
};
