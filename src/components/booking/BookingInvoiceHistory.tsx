import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { AlertCircle, ArrowDown, ChevronDown, Download, FileText, Loader2, RefreshCw } from 'lucide-react';
import { invoiceApi } from '../../api/invoices';
import { useAuth } from '../../context/AuthContext';
import { AuthUser, Language } from '../../types';
import { InvoiceStatus, InvoiceSummaryResponse } from '../../types/api';
import { formatDate } from '../../lib/utils';

interface BookingInvoiceHistoryProps {
  language: Language;
  open: boolean;
  onToggle: () => void;
  refreshKey: number;
  onAvailableBookingIdsChange: (ids: string[]) => void;
}

interface InvoiceHistoryState {
  owner: AuthUser | null;
  rows: InvoiceSummaryResponse[];
  total: number | null;
  totalPages: number;
  lastPage: number;
  pending: 'initial' | 'refresh' | 'more' | null;
  failedPage: number | null;
}

const emptyHistory = (owner: AuthUser | null): InvoiceHistoryState => ({
  owner, rows: [], total: null, totalPages: 0, lastPage: -1,
  pending: owner?.role === 'CUSTOMER' ? 'initial' : null, failedPage: null,
});

const invoiceStatus: Record<InvoiceStatus, { id: string; en: string; className: string }> = {
  ISSUED: { id: 'Terbit', en: 'Issued', className: 'border-emerald-100 bg-emerald-50 text-emerald-700' },
  DRAFT: { id: 'Draf', en: 'Draft', className: 'border-slate-200 bg-slate-50 text-slate-600' },
  VOID: { id: 'Tidak berlaku', en: 'Void', className: 'border-rose-100 bg-rose-50 text-rose-700' },
  REFUNDED: { id: 'Dana dikembalikan', en: 'Refunded', className: 'border-violet-100 bg-violet-50 text-violet-700' },
};

function invoiceAmount(invoice: InvoiceSummaryResponse, isID: boolean): string {
  if (!Number.isFinite(invoice.totalAmount)) return '—';
  const locale = isID ? 'id-ID' : 'en-GB';
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency', currency: invoice.currency,
      minimumFractionDigits: 0, maximumFractionDigits: invoice.currency === 'IDR' ? 0 : 2,
    }).format(invoice.totalAmount);
  } catch {
    return `${new Intl.NumberFormat(locale).format(invoice.totalAmount)} ${invoice.currency}`.trim();
  }
}

export function BookingInvoiceHistory({ language, open, onToggle, refreshKey, onAvailableBookingIdsChange }: BookingInvoiceHistoryProps) {
  const isID = language === 'ID';
  const { user } = useAuth();
  const titleId = useId();
  const contentId = useId();
  const currentUser = useRef(user);
  currentUser.current = user;
  const mounted = useRef(false);
  const requestSequence = useRef(0);
  const requestInFlight = useRef(false);
  const downloadSequence = useRef(0);
  const downloadInFlight = useRef(false);
  const [history, setHistory] = useState<InvoiceHistoryState>(() => emptyHistory(user));
  const historyRef = useRef(history);
  historyRef.current = history;
  const [download, setDownload] = useState<{ owner: AuthUser | null; id: number | null; error: boolean }>({ owner: user, id: null, error: false });

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      requestSequence.current += 1;
      downloadSequence.current += 1;
    };
  }, []);

  const loadPage = useCallback(async (account: AuthUser, pageIndex: number, replaceRequest = false) => {
    if (!mounted.current || currentUser.current !== account || account.role !== 'CUSTOMER') return;
    if (requestInFlight.current && !replaceRequest) return;
    const sequence = ++requestSequence.current;
    requestInFlight.current = true;
    const isCurrent = () => mounted.current && currentUser.current === account && requestSequence.current === sequence;
    const previous = historyRef.current.owner === account ? historyRef.current : emptyHistory(account);
    const pending: InvoiceHistoryState = {
      ...previous, failedPage: null,
      pending: pageIndex > 0 ? 'more' : previous.total === null ? 'initial' : 'refresh',
    };
    historyRef.current = pending;
    setHistory(pending);
    try {
      const page = await invoiceApi.myInvoices(pageIndex, 6);
      if (!isCurrent()) return;
      if (!Array.isArray(page.content) || !Number.isInteger(page.totalElements) || page.totalElements < 0
        || !Number.isInteger(page.totalPages) || page.totalPages < 0 || page.number !== pageIndex) {
        throw new Error('Invalid invoice page');
      }
      const rows = pageIndex === 0
        ? page.content
        : [...new Map([...historyRef.current.rows, ...page.content].map(row => [row.id, row])).values()];
      const next: InvoiceHistoryState = {
        owner: account, rows, total: page.totalElements, totalPages: page.totalPages,
        lastPage: page.number, pending: null, failedPage: null,
      };
      historyRef.current = next;
      setHistory(next);
      onAvailableBookingIdsChange([...new Set(rows.map(row => String(row.bookingId)))]);
    } catch {
      if (!isCurrent()) return;
      const next: InvoiceHistoryState = { ...historyRef.current, pending: null, failedPage: pageIndex };
      historyRef.current = next;
      setHistory(next);
    } finally {
      if (isCurrent()) requestInFlight.current = false;
    }
  }, [onAvailableBookingIdsChange]);

  useEffect(() => {
    requestSequence.current += 1;
    requestInFlight.current = false;
    if (historyRef.current.owner !== user) {
      const empty = emptyHistory(user);
      historyRef.current = empty;
      setHistory(empty);
      downloadSequence.current += 1;
      downloadInFlight.current = false;
      setDownload({ owner: user, id: null, error: false });
      onAvailableBookingIdsChange([]);
    }
    if (user?.role === 'CUSTOMER') void loadPage(user, 0, true);
    else onAvailableBookingIdsChange([]);
  }, [user, refreshKey, loadPage, onAvailableBookingIdsChange]);

  const downloadPdf = async (invoice: InvoiceSummaryResponse) => {
    const account = user;
    if (!account || account.role !== 'CUSTOMER' || !mounted.current || currentUser.current !== account || downloadInFlight.current) return;
    downloadInFlight.current = true;
    const sequence = ++downloadSequence.current;
    const isCurrent = () => mounted.current && currentUser.current === account && downloadSequence.current === sequence;
    setDownload({ owner: account, id: invoice.id, error: false });
    try {
      const { blob, filename } = await invoiceApi.downloadPdf(invoice.id);
      // A PDF requested by the previous account must never download after switching accounts.
      if (!isCurrent()) return;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename || `${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch {
      if (isCurrent()) setDownload({ owner: account, id: null, error: true });
    } finally {
      if (isCurrent()) {
        downloadInFlight.current = false;
        setDownload(previous => isCurrent() ? { ...previous, id: null } : previous);
      }
    }
  };

  if (user?.role !== 'CUSTOMER') return null;
  const visible = history.owner === user ? history : emptyHistory(user);
  const downloadBusy = download.owner === user && download.id !== null;
  const downloadError = download.owner === user && download.error;
  const hasError = visible.failedPage !== null;
  const canLoadMore = visible.lastPage + 1 < visible.totalPages;
  const totalLabel = visible.total === null
    ? (visible.pending ? '…' : '—')
    : new Intl.NumberFormat(isID ? 'id-ID' : 'en-GB').format(visible.total);

  return (
    <section className="min-w-0 overflow-hidden rounded-[26px] border border-[#e7e0d4] bg-[#f8f6f1] shadow-[0_10px_36px_rgba(15,35,68,0.04)]" data-bookings-invoices>
      <header className="flex min-w-0 items-center gap-2 bg-navy-dark px-4 py-4 text-white sm:gap-4 sm:px-6 sm:py-5">
        <button type="button" onClick={onToggle} aria-expanded={open} aria-controls={contentId} className="flex min-h-14 min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-xl text-left outline-offset-4 focus-visible:outline-2 focus-visible:outline-gold-light sm:gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/5 text-gold-light sm:size-12"><FileText className="size-5" aria-hidden /></span>
          <span className="min-w-0 flex-1">
            <span id={titleId} className="flex flex-wrap items-center gap-x-3 gap-y-1 font-serif text-[22px] leading-tight tracking-tight sm:text-[26px]">
              {isID ? 'Dokumen perjalanan' : 'Travel documents'}
              <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 font-sans text-xs font-semibold tracking-normal text-gold-light" aria-label={`${visible.total === null ? (isID ? 'Jumlah belum tersedia' : 'Count not available') : `${totalLabel} invoice`}`}>{totalLabel}</span>
            </span>
            <span className="mt-1 block text-xs leading-5 text-white/75 sm:text-[13px]">{isID ? 'Invoice dan bukti perjalanan, tersimpan di satu tempat.' : 'Your invoices and travel records, all in one place.'}</span>
          </span>
          <ChevronDown className={`size-4 shrink-0 text-white/75 transition-transform duration-200 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} aria-hidden />
        </button>
        <button type="button" disabled={visible.pending !== null} onClick={() => { void loadPage(user, 0, true); }} aria-label={isID ? 'Perbarui invoice' : 'Refresh invoices'} title={isID ? 'Perbarui invoice' : 'Refresh invoices'} className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/20 text-white/85 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-light disabled:cursor-wait disabled:opacity-50">
          {visible.pending !== null ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden /> : <RefreshCw className="size-4" aria-hidden />}
        </button>
      </header>

      <div id={contentId} role="region" aria-labelledby={titleId} aria-busy={visible.pending !== null} hidden={!open} className={open ? 'space-y-4 px-4 py-5 sm:px-6 sm:py-6' : 'hidden'}>
        <p className="max-w-3xl text-[13px] leading-6 text-slate-600">{isID ? 'Invoice diterbitkan setelah pembayaran berhasil dikonfirmasi. Jika baru membayar, perbarui daftar beberapa saat lagi.' : 'Invoices are issued after your payment is confirmed. If you have just paid, refresh this list in a moment.'}</p>

        {hasError && <div role="alert" className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-2 text-[13px] text-rose-700"><AlertCircle className="size-4 shrink-0" aria-hidden /><p className="min-w-0 flex-1 basis-40 leading-6">{visible.rows.length > 0 ? (isID ? 'Dokumen terbaru belum dapat dimuat. Daftar sebelumnya masih ditampilkan.' : 'The latest documents could not be loaded. Your previous list is still shown.') : (isID ? 'Dokumen belum dapat dimuat. Silakan coba lagi.' : 'Documents could not be loaded. Please try again.')}</p><button type="button" disabled={visible.pending !== null} onClick={() => { void loadPage(user, visible.failedPage ?? 0); }} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-2 text-xs font-semibold underline underline-offset-4 hover:bg-white/70 disabled:opacity-50"><RefreshCw className="size-3.5" aria-hidden />{isID ? 'Coba lagi' : 'Try again'}</button></div>}
        {downloadError && <p role="alert" className="flex items-start gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-[13px] leading-6 text-rose-700"><AlertCircle className="mt-1 size-4 shrink-0" aria-hidden />{isID ? 'PDF belum dapat diunduh. Coba kembali melalui tombol pada dokumen.' : 'The PDF could not be downloaded. Try the button on the document again.'}</p>}

        {visible.pending === 'initial' && visible.rows.length === 0 ? (
          <div className="flex min-h-32 items-center justify-center gap-3 rounded-2xl border border-[#e8e2d6] bg-white px-4 text-sm text-slate-500" role="status"><Loader2 className="size-5 animate-spin text-gold motion-reduce:animate-none" aria-hidden />{isID ? 'Menyiapkan dokumenmu…' : 'Loading your documents…'}</div>
        ) : visible.total === 0 && !hasError ? (
          <div className="flex min-h-36 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#ded5c4] bg-white/70 px-5 py-6 text-center"><span className="flex size-11 items-center justify-center rounded-2xl bg-[#f4efe4] text-gold"><FileText className="size-5" aria-hidden /></span><p className="text-sm font-semibold text-navy-dark">{isID ? 'Belum ada invoice yang terbit' : 'No invoices have been issued yet'}</p><p className="max-w-sm text-xs leading-5 text-slate-500">{isID ? 'Dokumen dari reservasi yang sudah dibayar akan muncul di sini.' : 'Documents for your paid reservations will appear here.'}</p></div>
        ) : visible.rows.length > 0 ? (
          <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visible.rows.map(invoice => {
              const status = invoiceStatus[invoice.status];
              return <article key={invoice.id} className="flex min-w-0 flex-col rounded-[20px] border border-[#e7e2d8] bg-white p-4 shadow-[0_3px_12px_rgba(15,35,68,0.025)] sm:p-5" data-booking-invoice data-invoice-id={invoice.id}>
                <div className="mb-4 flex items-start justify-between gap-2"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-navy-soft text-navy"><FileText className="size-[18px]" aria-hidden /></span><span className={`min-w-0 rounded-full border px-2.5 py-1 text-right text-[11px] font-semibold ${status?.className ?? 'border-slate-200 bg-slate-50 text-slate-600'}`}>{status ? (isID ? status.id : status.en) : invoice.status}</span></div>
                <h3 className="break-all font-mono text-[13px] font-semibold leading-6 text-navy-dark">{invoice.invoiceNumber}</h3>
                <p className="mt-1 break-words text-sm font-medium leading-6 text-slate-700">{invoice.hotelName}</p>
                <p className="mt-1 break-all text-xs leading-5 text-slate-500">{invoice.bookingCode}</p>
                <dl className="mt-4 grid min-w-0 grid-cols-2 gap-x-3 gap-y-3 border-t border-dashed border-slate-200 pt-4 text-xs">
                  <div className="min-w-0"><dt className="text-slate-500">{isID ? 'Tanggal invoice' : 'Invoice date'}</dt><dd className="mt-1 font-medium leading-5 text-slate-700">{formatDate(invoice.invoiceDate, language) || '—'}</dd></div>
                  <div className="min-w-0 text-right"><dt className="text-slate-500">Total</dt><dd className="mt-1 break-words text-[13px] font-semibold leading-5 text-navy-dark">{invoiceAmount(invoice, isID)}</dd></div>
                  <div className="col-span-2 min-w-0"><dt className="text-slate-500">{isID ? 'Tanggal menginap' : 'Stay dates'}</dt><dd className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 font-medium leading-5 text-slate-700"><span>{formatDate(invoice.checkInDate, language) || '—'}</span><span className="text-slate-400" aria-hidden>—</span><span>{formatDate(invoice.checkOutDate, language) || '—'}</span></dd></div>
                </dl>
                <div className="mt-auto pt-5"><button type="button" disabled={downloadBusy} onClick={() => { void downloadPdf(invoice); }} className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-navy-dark transition-colors hover:border-navy/30 hover:bg-navy-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:cursor-wait disabled:opacity-50">{downloadBusy && download.id === invoice.id ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden /> : <Download className="size-4" aria-hidden />}{downloadBusy && download.id === invoice.id ? (isID ? 'Mengunduh…' : 'Downloading…') : (isID ? 'Unduh PDF' : 'Download PDF')}</button></div>
              </article>;
            })}
          </div>
        ) : null}

        {visible.pending === 'refresh' && <p role="status" className="flex items-center justify-center gap-2 py-1 text-xs text-slate-500"><Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" aria-hidden />{isID ? 'Memperbarui dokumen…' : 'Refreshing documents…'}</p>}
        {canLoadMore && <div className="flex flex-col items-center gap-2 pt-1"><p className="text-xs text-slate-500">{isID ? `${visible.rows.length} dari ${totalLabel} invoice ditampilkan` : `Showing ${visible.rows.length} of ${totalLabel} invoices`}</p><button type="button" disabled={visible.pending !== null} onClick={() => { void loadPage(user, visible.lastPage + 1); }} className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#dcd2c0] bg-white px-5 py-2.5 text-xs font-semibold text-navy-dark transition-colors hover:border-gold hover:bg-[#fdfaf4] disabled:cursor-wait disabled:opacity-50">{visible.pending === 'more' ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden /> : <ArrowDown className="size-4" aria-hidden />}{visible.pending === 'more' ? (isID ? 'Memuat…' : 'Loading…') : (isID ? 'Lihat dokumen lainnya' : 'Load more documents')}</button></div>}
      </div>
    </section>
  );
}
