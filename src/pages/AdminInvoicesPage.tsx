import React, { useCallback, useEffect, useState } from 'react';
import { FileText, Download, Ban, Send, History, Loader2, Search, X } from 'lucide-react';
import { adminApi } from '../api/admin';
import { ApiError } from '../lib/http';
import { formatCurrency } from '../lib/utils';
import { Language } from '../types';
import { InvoiceEventResponse, InvoiceStatus, InvoiceSummaryResponse } from '../types/api/invoice';
import { AdminAccessGuard } from '../components/admin/AdminAccessGuard';
import { AdminFilterChips, AdminPageShell, AdminTableCard } from '../components/admin/AdminPageShell';
import { StatusPill } from '../components/admin/StatusPill';

const STATUS_OPTIONS = (isID: boolean) => [
  { value: '', label: isID ? 'Semua' : 'All' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ISSUED', label: 'Issued' },
  { value: 'VOID', label: 'Void' },
  { value: 'REFUNDED', label: 'Refunded' },
];

export const AdminInvoicesPage: React.FC<{ language: Language; onOpenAuth?: () => void }> = ({
  language,
  onOpenAuth,
}) => {
  const isID = language === 'ID';

  const [invoices, setInvoices] = useState<InvoiceSummaryResponse[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [status, setStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  // Audit trail is loaded on demand — one invoice's history at a time.
  const [historyFor, setHistoryFor] = useState<InvoiceSummaryResponse | null>(null);
  const [history, setHistory] = useState<InvoiceEventResponse[] | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await adminApi.searchInvoices({
        status: (status || undefined) as InvoiceStatus | undefined,
        // The backend filters by exact bookingCode, so a typed term is sent as-is.
        bookingCode: appliedSearch || undefined,
        size: 50,
      });
      const content = page?.content ?? [];
      setInvoices(content);
      setTotalElements(page?.totalElements ?? content.length);
    } catch (err) {
      setInvoices([]);
      setTotalElements(0);
      setError(err instanceof ApiError ? err.message : (isID ? 'Gagal memuat invoice.' : 'Failed to load invoices.'));
    } finally {
      setLoading(false);
    }
  }, [status, appliedSearch]);

  useEffect(() => { load(); }, [load]);

  const withBusy = async (id: number, action: () => Promise<void>) => {
    setBusyId(id);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (isID ? 'Aksi gagal.' : 'Action failed.'));
    } finally {
      setBusyId(null);
    }
  };

  const handleDownload = (inv: InvoiceSummaryResponse) =>
    withBusy(inv.id, async () => {
      const { blob, filename } = await adminApi.downloadInvoicePdf(inv.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `${inv.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });

  const handleVoid = (inv: InvoiceSummaryResponse) => {
    const reason = window.prompt(
      isID ? `Alasan pembatalan invoice ${inv.invoiceNumber}:` : `Reason for voiding ${inv.invoiceNumber}:`
    );
    if (!reason) return;
    return withBusy(inv.id, async () => {
      const updated = await adminApi.voidInvoice(inv.id, reason);
      setInvoices((prev) => prev.map((i) => (i.id === inv.id ? { ...i, status: updated.status } : i)));
    });
  };

  const handleResend = (inv: InvoiceSummaryResponse) =>
    withBusy(inv.id, async () => { await adminApi.resendInvoice(inv.id); });

  const handleHistory = (inv: InvoiceSummaryResponse) => {
    setHistoryFor(inv);
    setHistory(null);
    return withBusy(inv.id, async () => {
      setHistory(await adminApi.invoiceHistory(inv.id));
    });
  };

  return (
    <AdminAccessGuard isID={isID} onOpenAuth={onOpenAuth}>
      <AdminPageShell
        icon={FileText}
        title={isID ? 'Invoice' : 'Invoices'}
        subtitle={
          isID
            ? `Seluruh invoice sistem — unduh PDF, batalkan (void), kirim ulang, dan lihat riwayat status. ${totalElements} total.`
            : `Every invoice in the system — download the PDF, void, resend, and inspect the status history. ${totalElements} total.`
        }
        endpoint="GET /api/admin/invoices"
        isID={isID}
        loading={loading}
        error={error}
        onRefresh={load}
        filters={
          <>
            <AdminFilterChips options={STATUS_OPTIONS(isID)} active={status} onChange={setStatus} />
            <span className="w-px h-5 bg-slate-200" />
            <form
              onSubmit={(e) => { e.preventDefault(); setAppliedSearch(searchTerm.trim()); }}
              className="flex items-center gap-1.5"
            >
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-300 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={isID ? 'Kode booking...' : 'Booking code...'}
                  className="w-44 pl-8 pr-3 py-1.5 rounded-full border border-slate-200 text-[11px] text-slate-900 placeholder-slate-300 focus:outline-none focus:border-slate-900 transition-colors"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold transition-colors cursor-pointer"
              >
                {isID ? 'Cari' : 'Search'}
              </button>
              {appliedSearch && (
                <button
                  type="button"
                  onClick={() => { setSearchTerm(''); setAppliedSearch(''); }}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
                  title={isID ? 'Hapus pencarian' : 'Clear search'}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>
          </>
        }
      >
        <AdminTableCard
          isID={isID}
          loading={loading}
          isEmpty={invoices.length === 0}
          emptyLabel={isID ? 'Tidak ada invoice untuk filter ini.' : 'No invoices match this filter.'}
        >
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">{isID ? 'No. Invoice' : 'Invoice no.'}</th>
                <th className="px-4 py-3">Booking</th>
                <th className="px-4 py-3">{isID ? 'Tamu' : 'Guest'}</th>
                <th className="px-4 py-3">Hotel</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">{isID ? 'Aksi' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-[11px] font-semibold text-slate-900">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3 text-slate-500">{inv.bookingCode}</td>
                  <td className="px-4 py-3 text-slate-500 max-w-[160px] truncate">{inv.customerName}</td>
                  <td className="px-4 py-3 text-slate-500 max-w-[160px] truncate">{inv.hotelName}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900 whitespace-nowrap">
                    {formatCurrency(inv.totalAmount)}
                  </td>
                  <td className="px-4 py-3"><StatusPill status={inv.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {busyId === inv.id && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400 mr-1" />}
                      <button
                        onClick={() => handleDownload(inv)}
                        disabled={busyId === inv.id}
                        title={isID ? 'Unduh PDF' : 'Download PDF'}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer disabled:opacity-40"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleHistory(inv)}
                        disabled={busyId === inv.id}
                        title={isID ? 'Riwayat status' : 'Status history'}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer disabled:opacity-40"
                      >
                        <History className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleResend(inv)}
                        disabled={busyId === inv.id}
                        title={isID ? 'Kirim ulang ke email tamu' : 'Resend to guest email'}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition-all cursor-pointer disabled:opacity-40"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                      {inv.status !== 'VOID' && (
                        <button
                          onClick={() => handleVoid(inv)}
                          disabled={busyId === inv.id}
                          title={isID ? 'Batalkan invoice' : 'Void invoice'}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-all cursor-pointer disabled:opacity-40"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminTableCard>

        {/* Status history drawer */}
        {historyFor && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  {isID ? 'Riwayat Status' : 'Status History'} · {historyFor.invoiceNumber}
                </h3>
                <p className="text-[11px] text-slate-400 font-light font-mono mt-0.5">
                  GET /api/admin/invoices/{historyFor.id}/history
                </p>
              </div>
              <button
                onClick={() => { setHistoryFor(null); setHistory(null); }}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {history === null ? (
              <p className="text-xs text-slate-400 font-light flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {isID ? 'Memuat riwayat...' : 'Loading history...'}
              </p>
            ) : history.length === 0 ? (
              <p className="text-xs text-slate-400 font-light">
                {isID ? 'Belum ada peristiwa tercatat.' : 'No events recorded yet.'}
              </p>
            ) : (
              <ol className="space-y-3">
                {history.map((ev) => (
                  <li key={ev.id} className="flex items-start gap-3 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-800">{ev.eventType}</span>
                        <StatusPill status={ev.fromStatus} />
                        <span className="text-slate-300">→</span>
                        <StatusPill status={ev.toStatus} />
                        <span className="text-[10px] text-slate-400">
                          {ev.createdAt?.replace('T', ' ').slice(0, 16)}
                        </span>
                      </div>
                      {ev.message && (
                        <p className="text-[11px] text-slate-500 font-light mt-0.5">{ev.message}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </AdminPageShell>
    </AdminAccessGuard>
  );
};
