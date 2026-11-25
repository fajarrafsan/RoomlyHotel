import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Ban, ChevronLeft, ChevronRight, Download, FileText, History, LoaderCircle, Search, Send, X } from 'lucide-react';
import { adminApi } from '../api/admin';
import { useAuth } from '../context/AuthContext';
import { useOperationsQuery } from '../hooks/useOperationsQuery';
import { ApiError } from '../lib/http';
import { formatCurrency } from '../lib/utils';
import type { Language } from '../types';
import type { InvoiceStatus, InvoiceSummaryResponse } from '../types/api';
import { AdminAccessGuard } from '../components/admin/AdminAccessGuard';
import { OperationsDialog } from '../components/admin/OperationsDialog';
import {
  OperationsEmpty, OperationsFilters, OperationsList, OperationsNotice, OperationsPage,
  operationDanger, operationDate, operationField, operationPanel, operationPrimary, operationSecondary,
} from '../components/admin/OperationsPage';
import { StatusPill } from '../components/admin/StatusPill';

const statusLabels: Record<InvoiceStatus, [string, string]> = {
  DRAFT: ['Draf', 'Draft'], ISSUED: ['Diterbitkan', 'Issued'], VOID: ['Dibatalkan', 'Voided'], REFUNDED: ['Dikembalikan', 'Refunded'],
};
const pageSize = 25;

export function AdminInvoicesPage({ language, onOpenAuth }: { language: Language; onOpenAuth?: () => void }) {
  const isID = language === 'ID';
  const locale = isID ? 0 : 1;
  const { user, isLoading: authLoading } = useAuth();
  const allowed = user?.role === 'ADMIN';
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', search: '', page: 0 });
  const [busyId, setBusyId] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ text: string; success: boolean } | null>(null);
  const [historyFor, setHistoryFor] = useState<InvoiceSummaryResponse | null>(null);
  const [voidTarget, setVoidTarget] = useState<InvoiceSummaryResponse | null>(null);
  const [reason, setReason] = useState('');
  const [voidError, setVoidError] = useState<string | null>(null);

  const read = useCallback(() => adminApi.searchInvoices({
    status: (filters.status || undefined) as InvoiceStatus | undefined,
    bookingCode: filters.search || undefined,
    page: filters.page,
    size: pageSize,
  }), [filters, user?.userId]);
  const { data, loading, error, refresh } = useOperationsQuery(read, allowed, isID ? 'Gagal memuat daftar invoice.' : 'Could not load the invoice list.');
  const rows = data?.content ?? [];
  const readHistory = useCallback(() => historyFor ? adminApi.invoiceHistory(historyFor.id) : Promise.resolve([]), [historyFor, user?.userId]);
  const history = useOperationsQuery(readHistory, allowed && !!historyFor, isID ? 'Gagal memuat riwayat.' : 'Could not load the status history.');

  useEffect(() => {
    if (!loading && data && filters.page >= data.totalPages && filters.page > 0) {
      setFilters(current => ({ ...current, page: Math.max(0, data.totalPages - 1) }));
    }
  }, [data, filters.page, loading]);

  const runAction = async (id: number, task: () => Promise<void>, success?: string) => {
    if (busyId != null || loading) return;
    setBusyId(id);
    setNotice(null);
    try {
      await task();
      if (success) setNotice({ text: success, success: true });
    } catch (failure) {
      setNotice({ text: failure instanceof ApiError ? failure.message : (isID ? 'Tindakan invoice gagal.' : 'The invoice action failed.'), success: false });
    } finally {
      setBusyId(null);
    }
  };

  const download = (invoice: InvoiceSummaryResponse) => void runAction(invoice.id, async () => {
    const file = await adminApi.downloadInvoicePdf(invoice.id);
    const url = URL.createObjectURL(file.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = !file.filename || file.filename === 'download' ? `${invoice.invoiceNumber}.pdf` : file.filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  });

  const submitVoid = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!voidTarget || busyId != null || !reason.trim()) return;
    setBusyId(voidTarget.id);
    setVoidError(null);
    setNotice(null);
    try {
      await adminApi.voidInvoice(voidTarget.id, reason.trim());
      setVoidTarget(null);
      setNotice({ text: isID ? 'Invoice dibatalkan.' : 'Invoice voided.', success: true });
      await refresh();
    } catch (failure) {
      setVoidError(failure instanceof ApiError ? failure.message : (isID ? 'Invoice gagal dibatalkan.' : 'The invoice could not be voided.'));
    } finally {
      setBusyId(null);
    }
  };

  if (!allowed) {
    if (authLoading) return <OperationsEmpty loading isID={isID} empty="" />;
    return <AdminAccessGuard isID={isID} onOpenAuth={onOpenAuth}>{null}</AdminAccessGuard>;
  }

  const options = [{ value: '', label: isID ? 'Semua status' : 'All statuses' },
    ...Object.entries(statusLabels).map(([value, labels]) => ({ value, label: labels[locale] }))];
  const applySearch = (term: string) => {
    const value = term.trim();
    if (filters.search === value && filters.page === 0) { void refresh(); return; }
    setFilters(current => ({ ...current, search: value, page: 0 }));
  };
  const busy = busyId != null;
  const listText = !loading && data
    ? (isID ? `${rows.length} dari ${data.totalElements} invoice ditampilkan` : `Showing ${rows.length} of ${data.totalElements} invoices`)
    : undefined;

  return (
    <OperationsPage icon={FileText} title={isID ? 'Invoice' : 'Invoices'} image="/images/seed/hotels/plataran-borobudur.jpg"
      description={isID ? 'Cari dokumen reservasi, unduh PDF, dan telusuri riwayat penerbitan.' : 'Find reservation documents, download PDFs, and review their history.'}
      isID={isID} loading={loading} onRefresh={() => void refresh()} blocked={busy || !!voidTarget}>
      <div className={operationPanel + ' flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4'}>
        <form className="flex w-full min-w-0 items-center gap-2 sm:max-w-md" onSubmit={event => { event.preventDefault(); applySearch(search); }}>
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">{isID ? 'Kode reservasi' : 'Reservation code'}</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-600" aria-hidden />
            <input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder={isID ? 'Kode reservasi, mis. BK-…' : 'Reservation code, e.g. BK-…'} className={operationField + ' pl-9'} />
          </label>
          <button type="submit" disabled={busy} className={operationPrimary}>{isID ? 'Cari' : 'Search'}</button>
          {filters.search && <button type="button" disabled={busy} onClick={() => { setSearch(''); applySearch(''); }} className={operationSecondary + ' w-11 px-0'} aria-label={isID ? 'Hapus pencarian' : 'Clear search'}><X className="size-4" aria-hidden /></button>}
        </form>
        <OperationsFilters label={isID ? 'Status invoice' : 'Invoice status'} items={options} value={filters.status} onChange={status => { if (!busy && status !== filters.status) setFilters(current => ({ ...current, status, page: 0 })); }} />
      </div>

      {error && <OperationsNotice>{error}</OperationsNotice>}
      {notice && <OperationsNotice success={notice.success}>{notice.text}</OperationsNotice>}

      <OperationsList
        title={isID ? 'Daftar invoice' : 'Invoice list'} isID={isID} rows={rows} loading={loading} description={listText}
        empty={error ? (isID ? 'Daftar invoice belum tersedia.' : 'The invoice list is unavailable.') : (isID ? 'Tidak ada invoice untuk filter ini.' : 'No invoices match this filter.')}
        primary={{ label: isID ? 'Invoice / reservasi' : 'Invoice / reservation', render: row => <>
          <p className="break-all font-mono text-xs font-bold text-navy-dark">{row.invoiceNumber}</p>
          <p className="mt-0.5 break-all text-xs text-slate-600">{row.bookingCode}</p>
        </> }}
        columns={[
          { label: isID ? 'Tamu' : 'Guest', render: row => <span className="font-medium text-slate-900">{row.customerName || '—'}</span> },
          { label: 'Hotel', render: row => row.hotelName || '—' },
          { label: isID ? 'Tanggal' : 'Date', render: row => operationDate(row.issuedAt || row.invoiceDate || row.createdAt, language) },
          { label: 'Total', render: row => <span className="font-semibold text-navy-dark tabular-nums">{formatCurrency(row.totalAmount)}</span> },
        ]}
        status={row => <StatusPill status={row.status} label={statusLabels[row.status]?.[locale]} />}
        actions={row => busyId === row.id ? <span role="status" className="flex min-h-11 items-center gap-2 text-xs text-slate-600"><LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden />{isID ? 'Memproses…' : 'Processing…'}</span> : (
          <>
            <button type="button" disabled={busy || loading} onClick={() => download(row)} className={operationPrimary + ' text-xs'} aria-label={isID ? 'Unduh PDF' : 'Download PDF'}><Download className="size-4" aria-hidden />PDF</button>
            <button type="button" disabled={busy || loading} onClick={() => setHistoryFor(row)} className={operationSecondary + ' text-xs'}><History className="size-4" aria-hidden />{isID ? 'Riwayat' : 'History'}</button>
            {row.status === 'ISSUED' && (
              <>
                <button type="button" disabled={busy || loading} onClick={() => void runAction(row.id, async () => { await adminApi.resendInvoice(row.id); }, isID ? 'Permintaan kirim ulang diterima.' : 'Resend requested.')} className={operationSecondary + ' text-xs'}><Send className="size-4" aria-hidden />{isID ? 'Kirim ulang' : 'Resend'}</button>
                <button type="button" disabled={busy || loading} onClick={() => { setVoidTarget(row); setReason(''); setVoidError(null); }} className={operationDanger + ' text-xs'}><Ban className="size-4" aria-hidden />{isID ? 'Batalkan' : 'Void'}</button>
              </>
            )}
          </>
        )}
        footer={data && (data.totalPages > 1 || filters.page > 0) && (
          <nav aria-label={isID ? 'Halaman invoice' : 'Invoice pages'} className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium text-slate-600">{isID ? 'Halaman' : 'Page'} {filters.page + 1} / {Math.max(1, data.totalPages)}</span>
            <div className="flex gap-2">
              <button type="button" disabled={loading || busy || filters.page === 0} onClick={() => setFilters(current => ({ ...current, page: current.page - 1 }))} className={operationSecondary} aria-label={isID ? 'Halaman sebelumnya' : 'Previous page'}><ChevronLeft className="size-4" aria-hidden /></button>
              <button type="button" disabled={loading || busy || filters.page + 1 >= data.totalPages} onClick={() => setFilters(current => ({ ...current, page: current.page + 1 }))} className={operationSecondary} aria-label={isID ? 'Halaman berikutnya' : 'Next page'}><ChevronRight className="size-4" aria-hidden /></button>
            </div>
          </nav>
        )}
      />

      {historyFor && (
        <OperationsDialog title={isID ? 'Riwayat invoice' : 'Invoice history'} description={historyFor.invoiceNumber} isID={isID} onClose={() => setHistoryFor(null)}>
          {history.error ? (
            <div className="space-y-3"><OperationsNotice>{history.error}</OperationsNotice><button type="button" onClick={() => void history.refresh()} className={operationSecondary}>{isID ? 'Coba lagi' : 'Try again'}</button></div>
          ) : history.loading || !history.data?.length ? (
            <OperationsEmpty isID={isID} loading={history.loading} empty={isID ? 'Belum ada perubahan status.' : 'No status changes recorded.'} />
          ) : (
            <ol className="space-y-3">
              {history.data.map(event => (
                <li key={event.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <time className="text-xs text-slate-600">{operationDate(event.createdAt, language)}</time>
                  <p className="mt-1 break-words text-sm font-semibold text-navy-dark">{event.eventType.replaceAll('_', ' ')}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                    {event.fromStatus && <><StatusPill status={event.fromStatus} label={statusLabels[event.fromStatus]?.[locale]} /><span aria-hidden>→</span></>}
                    <StatusPill status={event.toStatus} label={event.toStatus ? statusLabels[event.toStatus]?.[locale] : undefined} />
                  </div>
                  {event.message && <p className="mt-2 break-words text-sm leading-5 text-slate-700">{event.message}</p>}
                </li>
              ))}
            </ol>
          )}
        </OperationsDialog>
      )}

      {voidTarget && (
        <OperationsDialog title={isID ? 'Batalkan invoice' : 'Void invoice'} description={voidTarget.invoiceNumber} isID={isID} busy={busy} onClose={() => setVoidTarget(null)}>
          <form onSubmit={submitVoid} className="space-y-4">
            <label className="block text-sm font-semibold">{isID ? 'Alasan pembatalan' : 'Reason for voiding'}
              <textarea required maxLength={500} rows={3} value={reason} disabled={busy} onChange={event => setReason(event.target.value)} className={operationField + ' mt-1 resize-y'} />
            </label>
            {voidError && <OperationsNotice>{voidError}</OperationsNotice>}
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" disabled={busy} onClick={() => setVoidTarget(null)} className={operationSecondary}>{isID ? 'Kembali' : 'Back'}</button>
              <button type="submit" disabled={busy || !reason.trim()} className={operationDanger}>{busy && <LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden />}{isID ? 'Batalkan invoice' : 'Void invoice'}</button>
            </div>
          </form>
        </OperationsDialog>
      )}
    </OperationsPage>
  );
}
