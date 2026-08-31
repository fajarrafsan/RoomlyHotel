import React, { useCallback, useEffect, useState } from 'react';
import { CreditCard, Ban, Loader2, RotateCcw, Undo2, X, AlertCircle } from 'lucide-react';
import { adminApi } from '../api/admin';
import { paymentApi } from '../api/payments';
import { ApiError } from '../lib/http';
import { formatCurrency } from '../lib/utils';
import { Language } from '../types';
import { BookingCancellationResponse, CancellationStatus } from '../types/api/booking';
import { PaymentResponse } from '../types/api/payment';
import { AdminAccessGuard } from '../components/admin/AdminAccessGuard';
import { AdminFilterChips, AdminPageShell, AdminTableCard } from '../components/admin/AdminPageShell';
import { StatusPill } from '../components/admin/StatusPill';

const PAYMENT_STATUS_OPTIONS = (isID: boolean) => [
  { value: '', label: isID ? 'Semua' : 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PAID', label: 'Paid' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'REFUNDED', label: 'Refunded' },
];

const CANCELLATION_STATUS_OPTIONS = (isID: boolean) => [
  { value: '', label: isID ? 'Semua' : 'All' },
  { value: 'REQUESTED', label: isID ? 'Diajukan' : 'Requested' },
  { value: 'COMPLETED', label: isID ? 'Selesai' : 'Completed' },
  { value: 'REJECTED', label: isID ? 'Ditolak' : 'Rejected' },
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
  const [busyId, setBusyId] = useState<number | null>(null);
  const [refundTarget, setRefundTarget] = useState<PaymentResponse | null>(null);
  const [refundForm, setRefundForm] = useState({ amount: '', reason: '', force: false });
  const [refundError, setRefundError] = useState<string | null>(null);
  const [refunding, setRefunding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (tab === 'payments') {
        setPayments(await adminApi.listPayments(status || undefined));
      } else {
        setCancellations(await adminApi.listCancellations((status || undefined) as CancellationStatus | undefined));
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (isID ? 'Gagal memuat data.' : 'Failed to load data.'));
    } finally {
      setLoading(false);
    }
  }, [tab, status, isID]);

  useEffect(() => { load(); }, [load]);

  const applyUpdated = (updated: PaymentResponse) =>
    setPayments((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));

  const runPaymentAction = async (
    payment: PaymentResponse,
    action: () => Promise<PaymentResponse>,
    fallbackMessage: string
  ) => {
    setBusyId(payment.id);
    setError(null);
    try {
      applyUpdated(await action());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : fallbackMessage);
    } finally {
      setBusyId(null);
    }
  };

  // payment-service only allows expiring a payment that hasn't settled yet.
  const handleExpire = (payment: PaymentResponse) =>
    runPaymentAction(
      payment,
      () => adminApi.expirePayment(payment.id),
      isID ? 'Gagal menghentikan pembayaran.' : 'Failed to expire payment.'
    );

  // Cancel voids the Midtrans transaction as well, so it is only offered while
  // the payment is still open.
  const handleCancel = (payment: PaymentResponse) =>
    runPaymentAction(
      payment,
      () => paymentApi.cancel(payment.id),
      isID ? 'Gagal membatalkan pembayaran.' : 'Failed to cancel payment.'
    );

  const openRefund = (payment: PaymentResponse) => {
    setRefundTarget(payment);
    setRefundForm({ amount: '', reason: '', force: false });
    setRefundError(null);
  };

  const handleRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundTarget) return;

    const amount = refundForm.amount.trim() === '' ? undefined : Number(refundForm.amount);
    if (amount !== undefined && (!Number.isFinite(amount) || amount <= 0)) {
      setRefundError(isID ? 'Nominal refund harus lebih besar dari 0.' : 'The refund amount must be greater than 0.');
      return;
    }
    // The backend requires a reason whenever an active booking is force-refunded;
    // catching it here saves a round trip and explains the rule up front.
    if (refundForm.force && !refundForm.reason.trim()) {
      setRefundError(isID ? 'Alasan wajib diisi untuk refund paksa.' : 'A reason is required for a forced refund.');
      return;
    }

    setRefunding(true);
    setRefundError(null);
    try {
      const updated = await paymentApi.refund(refundTarget.id, {
        amount,
        reason: refundForm.reason.trim() || undefined,
        force: refundForm.force || undefined,
      });
      applyUpdated(updated);
      setRefundTarget(null);
    } catch (err) {
      setRefundError(
        err instanceof ApiError ? err.message : (isID ? 'Gagal memproses refund.' : 'Failed to process the refund.')
      );
    } finally {
      setRefunding(false);
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
            <AdminFilterChips
              options={tab === 'payments' ? PAYMENT_STATUS_OPTIONS(isID) : CANCELLATION_STATUS_OPTIONS(isID)}
              active={status}
              onChange={setStatus}
            />
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
                    <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                      {busyId === p.id ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          {isID ? 'Memproses' : 'Processing'}
                        </span>
                      ) : (
                        <>
                          {p.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleExpire(p)}
                                className="px-2.5 py-1 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold text-[11px] transition-all inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Ban className="w-3 h-3" />
                                <span>{isID ? 'Kedaluwarsakan' : 'Expire'}</span>
                              </button>
                              <button
                                onClick={() => handleCancel(p)}
                                className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-[11px] transition-all inline-flex items-center gap-1 cursor-pointer"
                                title={isID ? 'Batalkan transaksi di Midtrans' : 'Void the transaction at Midtrans'}
                              >
                                <X className="w-3 h-3" />
                                <span>{isID ? 'Batalkan' : 'Cancel'}</span>
                              </button>
                            </>
                          )}

                          {p.status === 'PAID' && (
                            <button
                              onClick={() => openRefund(p)}
                              className="px-2.5 py-1 rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50 font-semibold text-[11px] transition-all inline-flex items-center gap-1 cursor-pointer"
                              title={isID ? 'Kembalikan dana ke tamu' : 'Refund the guest'}
                            >
                              <Undo2 className="w-3 h-3" />
                              <span>Refund</span>
                            </button>
                          )}
                        </>
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
                  <th className="px-4 py-3">{isID ? 'Status pembatalan' : 'Cancellation status'}</th>
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
                    <td className="px-4 py-3"><StatusPill status={c.status} /></td>
                    <td className="px-4 py-3"><StatusPill status={c.refundStatus} /></td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{dateTime(c.cancelledAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </AdminTableCard>

        {refundTarget && (
          <div
            className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="refund-dialog-title"
          >
            <form
              onSubmit={handleRefund}
              className="w-full max-w-lg bg-white rounded-2xl border border-slate-100 p-5 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 id="refund-dialog-title" className="text-base font-semibold text-slate-900">
                    {isID ? 'Refund pembayaran' : 'Refund payment'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {refundTarget.paymentCode} · {refundTarget.bookingCode} · {formatCurrency(refundTarget.amount)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setRefundTarget(null)}
                  className="w-11 h-11 rounded-xl hover:bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer"
                  aria-label={isID ? 'Tutup' : 'Close'}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[11px] text-slate-500 bg-slate-50 border border-slate-100 rounded-xl p-3 leading-relaxed">
                {isID
                  ? 'Refund normal hanya berlaku bila booking sudah CANCELLED, EXPIRED, atau NO_SHOW. Untuk booking yang masih aktif, admin dapat memaksa refund dengan menyertakan alasan.'
                  : 'A normal refund requires the booking to be CANCELLED, EXPIRED, or NO_SHOW. For a still-active booking an admin can force the refund by giving a reason.'}
              </p>

              <label className="block">
                <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                  {isID ? 'Nominal refund' : 'Refund amount'}
                </span>
                <input
                  type="number"
                  min={1}
                  step="0.01"
                  value={refundForm.amount}
                  onChange={(e) => setRefundForm({ ...refundForm, amount: e.target.value })}
                  placeholder={isID ? 'Kosongkan untuk refund penuh' : 'Leave blank to refund in full'}
                  className="w-full min-h-11 p-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-900 placeholder-slate-300 focus:outline-none focus:border-slate-900"
                />
              </label>

              <label className="block">
                <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                  {isID ? 'Alasan' : 'Reason'}
                </span>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={refundForm.reason}
                  onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-3 text-[13px] text-slate-900 resize-y focus:outline-none focus:border-slate-900"
                />
              </label>

              <label className="flex items-start gap-2 text-xs font-medium text-slate-700 min-h-11">
                <input
                  type="checkbox"
                  checked={refundForm.force}
                  onChange={(e) => setRefundForm({ ...refundForm, force: e.target.checked })}
                  className="w-4 h-4 mt-0.5 rounded border-slate-300 accent-slate-900"
                />
                <span>
                  {isID ? 'Paksa refund pada booking aktif (khusus admin, wajib alasan)' : 'Force the refund on an active booking (admin only, reason required)'}
                </span>
              </label>

              {refundError && (
                <p role="alert" className="flex items-start gap-2 text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
                  <span>{refundError}</span>
                </p>
              )}

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRefundTarget(null)}
                  className="min-h-11 px-4 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold cursor-pointer hover:bg-slate-50"
                >
                  {isID ? 'Batal' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={refunding}
                  className="min-h-11 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {refunding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                  {isID ? 'Proses refund' : 'Process refund'}
                </button>
              </div>
            </form>
          </div>
        )}
      </AdminPageShell>
    </AdminAccessGuard>
  );
};
