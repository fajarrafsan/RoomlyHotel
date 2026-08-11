import React, { useCallback, useEffect, useState } from 'react';
import { CreditCard, Ban, Loader2 } from 'lucide-react';
import { adminApi } from '../api/admin';
import { ApiError } from '../lib/http';
import { formatCurrency } from '../lib/utils';
import { Language } from '../types';
import { BookingCancellationResponse } from '../types/api/booking';
import { PaymentResponse } from '../types/api/payment';
import { AdminAccessGuard } from '../components/admin/AdminAccessGuard';
import { AdminFilterChips, AdminPageShell, AdminTableCard } from '../components/admin/AdminPageShell';
import { StatusPill } from '../components/admin/StatusPill';

const STATUS_OPTIONS = (isID: boolean) => [
  { value: '', label: isID ? 'Semua' : 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PAID', label: 'Paid' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'REFUNDED', label: 'Refunded' },
];

const dateTime = (value: string | null) => (value ? value.replace('T', ' ').slice(0, 16) : '—');

export const AdminPaymentsPage: React.FC<{ language: Language; onOpenAuth?: () => void }> = ({
  language,
  onOpenAuth,
}) => {
  const isID = language === 'ID';
  const [tab, setTab] = useState<'payments' | 'cancellations'>('payments');

  const [payments, setPayments] = useState<PaymentResponse[]>([]);
  const [cancellations, setCancellations] = useState<BookingCancellationResponse[]>([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expiringId, setExpiringId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (tab === 'payments') {
        setPayments(await adminApi.listPayments(status || undefined));
      } else {
        setCancellations(await adminApi.listCancellations(status || undefined));
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (isID ? 'Gagal memuat data.' : 'Failed to load data.'));
    } finally {
      setLoading(false);
    }
  }, [tab, status, isID]);

  useEffect(() => { load(); }, [load]);

  // payment-service only allows expiring a payment that hasn't settled yet.
  const handleExpire = async (payment: PaymentResponse) => {
    setExpiringId(payment.id);
    setError(null);
    try {
      const updated = await adminApi.expirePayment(payment.id);
      setPayments((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (isID ? 'Gagal menghentikan pembayaran.' : 'Failed to expire payment.'));
    } finally {
      setExpiringId(null);
    }
  };

  const isEmpty = tab === 'payments' ? payments.length === 0 : cancellations.length === 0;

  return (
    <AdminAccessGuard isID={isID} onOpenAuth={onOpenAuth}>
      <AdminPageShell
        icon={CreditCard}
        title={isID ? 'Pembayaran & Pembatalan' : 'Payments & Cancellations'}
        subtitle={
          isID
            ? 'Seluruh transaksi Midtrans dan pengajuan pembatalan pada sistem, lintas semua tamu.'
            : 'Every Midtrans transaction and cancellation record across all guests.'
        }
        endpoint={tab === 'payments' ? 'GET /api/admin/payments' : 'GET /api/admin/cancellations'}
        isID={isID}
        loading={loading}
        error={error}
        onRefresh={load}
        filters={
          <>
            <div className="flex items-center gap-1 mr-2">
              {(['payments', 'cancellations'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setStatus(''); }}
                  className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                    tab === t ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {t === 'payments'
                    ? (isID ? 'Pembayaran' : 'Payments')
                    : (isID ? 'Pembatalan' : 'Cancellations')}
                </button>
              ))}
            </div>
            <span className="w-px h-5 bg-slate-200" />
            <AdminFilterChips options={STATUS_OPTIONS(isID)} active={status} onChange={setStatus} />
          </>
        }
      >
        <AdminTableCard
          isID={isID}
          loading={loading}
          isEmpty={isEmpty}
          emptyLabel={isID ? 'Tidak ada data untuk filter ini.' : 'No records match this filter.'}
        >
          {tab === 'payments' ? (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">{isID ? 'Kode' : 'Code'}</th>
                  <th className="px-4 py-3">Booking</th>
                  <th className="px-4 py-3">{isID ? 'Metode' : 'Method'}</th>
                  <th className="px-4 py-3 text-right">{isID ? 'Jumlah' : 'Amount'}</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">{isID ? 'Dibayar' : 'Paid at'}</th>
                  <th className="px-4 py-3 text-right">{isID ? 'Aksi' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{p.paymentCode}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{p.bookingCode}</td>
                    <td className="px-4 py-3 text-slate-500">{p.paymentMethod || p.gateway || '—'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900 whitespace-nowrap">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="px-4 py-3"><StatusPill status={p.status} /></td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{dateTime(p.paidAt)}</td>
                    <td className="px-4 py-3 text-right">
                      {p.status === 'PENDING' && (
                        <button
                          onClick={() => handleExpire(p)}
                          disabled={expiringId === p.id}
                          className="px-2.5 py-1 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold text-[11px] transition-all inline-flex items-center gap-1 cursor-pointer disabled:opacity-40"
                        >
                          {expiringId === p.id
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <Ban className="w-3 h-3" />}
                          <span>{isID ? 'Kedaluwarsakan' : 'Expire'}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Booking</th>
                  <th className="px-4 py-3">{isID ? 'Dibatalkan Oleh' : 'Cancelled by'}</th>
                  <th className="px-4 py-3">{isID ? 'Alasan' : 'Reason'}</th>
                  <th className="px-4 py-3 text-right">{isID ? 'Biaya' : 'Fee'}</th>
                  <th className="px-4 py-3 text-right">Refund</th>
                  <th className="px-4 py-3">Refund status</th>
                  <th className="px-4 py-3">{isID ? 'Tanggal' : 'Date'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700">
                {cancellations.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">{c.bookingCode}</td>
                    <td className="px-4 py-3 text-slate-500">{c.cancelledByRole || '—'}</td>
                    <td className="px-4 py-3 text-slate-500 max-w-[220px] truncate" title={c.cancellationReason || ''}>
                      {c.cancellationReason || '—'}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {c.cancellationFeeAmount != null ? formatCurrency(c.cancellationFeeAmount) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900 whitespace-nowrap">
                      {c.refundAmount != null ? formatCurrency(c.refundAmount) : '—'}
                    </td>
                    <td className="px-4 py-3"><StatusPill status={c.refundStatus} /></td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{dateTime(c.cancelledAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </AdminTableCard>
      </AdminPageShell>
    </AdminAccessGuard>
  );
};
