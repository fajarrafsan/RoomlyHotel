import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import {
  ArrowRight, Ban, CalendarClock, CheckCircle2, CreditCard, Hourglass, LoaderCircle, ReceiptText,
  RotateCw, Search, Undo2, Wallet, X,
} from 'lucide-react';
import { adminApi } from '../api/admin';
import { paymentApi } from '../api/payments';
import { useAuth } from '../context/AuthContext';
import { useOperationsQuery } from '../hooks/useOperationsQuery';
import { ApiError } from '../lib/http';
import { formatCurrency } from '../lib/utils';
import type { Language } from '../types';
import type { BookingCancellationResponse, CancellationStatus, PaymentResponse, PaymentStatus, RefundStatus } from '../types/api';
import { AdminAccessGuard } from '../components/admin/AdminAccessGuard';
import { OperationsDialog } from '../components/admin/OperationsDialog';
import {
  OperationsEmpty, OperationsList, OperationsNotice, operationDanger, operationDate, operationField,
  operationPrimary, operationSecondary,
} from '../components/admin/OperationsPage';
import { StatusPill } from '../components/admin/StatusPill';

const paymentLabels: Record<PaymentStatus, [string, string]> = {
  PENDING: ['Menunggu', 'Pending'], PAID: ['Lunas', 'Paid'], FAILED: ['Gagal', 'Failed'],
  EXPIRED: ['Kedaluwarsa', 'Expired'], CANCELLED: ['Dibatalkan', 'Cancelled'], REFUNDED: ['Dana dikembalikan', 'Refunded'],
};
const cancellationLabels: Record<CancellationStatus, [string, string]> = {
  REQUESTED: ['Diajukan', 'Requested'], COMPLETED: ['Selesai', 'Completed'], REJECTED: ['Ditolak', 'Rejected'],
};
const refundLabels: Record<RefundStatus, [string, string]> = {
  NOT_REQUIRED: ['Tidak diperlukan', 'Not required'], PENDING: ['Menunggu', 'Pending'], PROCESSING: ['Diproses', 'Processing'],
  REFUNDED: ['Dana dikembalikan', 'Refunded'], FAILED: ['Gagal', 'Failed'], REJECTED: ['Ditolak', 'Rejected'],
};
const emptyRefund = { amount: '', reason: '', force: false };

type Mode = 'details' | 'refund' | 'expire' | 'cancel';
type View = 'payments' | 'cancellations';

function paymentAmount(payment: PaymentResponse, language: Language) {
  const currency = payment.currency?.trim().toUpperCase();
  return new Intl.NumberFormat(language === 'ID' ? 'id-ID' : 'en-US', {
    style: 'currency',
    currency: currency && /^[A-Z]{3}$/.test(currency) ? currency : 'IDR',
    minimumFractionDigits: Number.isInteger(payment.amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(payment.amount);
}

function paymentMethod(payment: PaymentResponse) {
  return payment.paymentMethod?.replaceAll('_', ' ') || '—';
}

function PaymentOverview({ rows, view, status, isID, onStatus }: {
  rows: (PaymentResponse | BookingCancellationResponse)[] | undefined;
  view: View;
  status: string;
  isID: boolean;
  onStatus: (status: string) => void;
}) {
  const payments = view === 'payments';
  const metrics = [
    { key: '', icon: Wallet, tone: 'bg-white/10 text-[#f0d58f]', label: payments ? (isID ? 'Semua transaksi' : 'All transactions') : (isID ? 'Semua pembatalan' : 'All cancellations') },
    { key: payments ? 'PAID' : 'COMPLETED', icon: CheckCircle2, tone: 'bg-emerald-300/15 text-emerald-200', label: payments ? (isID ? 'Pembayaran lunas' : 'Paid') : (isID ? 'Selesai' : 'Completed') },
    { key: payments ? 'PENDING' : 'REQUESTED', icon: Hourglass, tone: 'bg-amber-300/15 text-amber-200', label: payments ? (isID ? 'Menunggu bayar' : 'Awaiting payment') : (isID ? 'Diajukan' : 'Requested') },
  ];

  return (
    <div aria-label={isID ? 'Ringkasan dan filter cepat' : 'Summary and quick filters'} role="group"
      className="grid gap-px overflow-hidden rounded-[22px] border border-[#233c69] bg-[#314872] shadow-[0_12px_26px_rgba(15,31,61,0.12)] sm:grid-cols-3">
      {metrics.map(({ key, label, tone, icon: Icon }) => {
        const count = key ? rows?.filter(row => row.status === key).length : rows?.length;
        return (
          <button key={key} type="button" aria-pressed={status === key} onClick={() => onStatus(key)}
            className="relative flex min-w-0 cursor-pointer items-center gap-3 bg-[#162850] px-3.5 py-2.5 text-left text-white transition-colors hover:bg-[#263d67] focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-gold-light aria-pressed:bg-[#223a63] sm:px-5 sm:py-4 lg:px-6">
            <span className={'grid size-9 shrink-0 place-items-center rounded-[11px] sm:size-11 ' + tone}><Icon size={18} aria-hidden /></span>
            <span className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 pr-1 sm:block">
              <span className="block text-xs font-semibold leading-5 text-slate-200 sm:text-sm">{label}</span>
              <span className="block text-lg font-semibold leading-tight tabular-nums sm:mt-0.5 sm:text-[29px]">{count?.toLocaleString(isID ? 'id-ID' : 'en-US') ?? '—'}</span>
            </span>
            <ArrowRight className={'size-4 shrink-0 ' + (status === key ? 'text-gold-light' : 'text-slate-300')} aria-hidden />
            {status === key && <span className="pointer-events-none absolute inset-y-1 left-0 w-0.5 rounded-full bg-gold-light sm:inset-x-5 sm:inset-y-auto sm:bottom-0 sm:h-0.5 sm:w-auto" />}
          </button>
        );
      })}
    </div>
  );
}

export function AdminPaymentsPage({ language, onOpenAuth }: { language: Language; onOpenAuth?: () => void }) {
  const isID = language === 'ID';
  const locale = isID ? 0 : 1;
  const { user, isLoading: authLoading } = useAuth();
  const allowed = user?.role === 'ADMIN';
  const [view, setView] = useState<View>('payments');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ payment: PaymentResponse; mode: Mode } | null>(null);
  const [refund, setRefund] = useState(emptyRefund);
  const [actionError, setActionError] = useState<string | null>(null);
  const dialogContent = useRef<HTMLDivElement>(null);
  const searchField = useRef<HTMLInputElement>(null);
  const mode = dialog?.mode;

  useEffect(() => {
    if (mode && !dialogContent.current?.closest('[role="dialog"]')?.contains(document.activeElement)) {
      dialogContent.current?.focus();
    }
  }, [mode]);

  const read = useCallback(async () => view === 'payments'
    ? { payments: await adminApi.listPayments(), cancellations: [] }
    : { payments: [], cancellations: await adminApi.listCancellations() },
  [view, user?.userId]);
  const { data, loading, error, refresh } = useOperationsQuery(read, allowed, isID ? 'Gagal memuat transaksi.' : 'Could not load transactions.');

  const changeMode = (payment: PaymentResponse, mode: Mode) => {
    setDialog({ payment, mode });
    setActionError(null);
    if (mode === 'refund') setRefund(emptyRefund);
  };

  const run = async (task: () => Promise<PaymentResponse>, success: string) => {
    if (busy || loading) return;
    setBusy(true);
    setNotice(null);
    setActionError(null);
    try {
      await task();
      setNotice(success);
      setDialog(null);
      await refresh();
    } catch (failure) {
      setActionError(failure instanceof ApiError ? failure.message : (isID ? 'Transaksi gagal diproses.' : 'The transaction action failed.'));
    } finally {
      setBusy(false);
    }
  };

  const handleRefund = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!dialog) return;
    const { payment } = dialog;
    const amount = refund.amount.trim() ? Number(refund.amount) : undefined;
    if (amount !== undefined && (!Number.isFinite(amount) || amount <= 0 || amount > payment.amount)) {
      setActionError(isID ? 'Masukkan nominal lebih dari 0 dan paling banyak sebesar total pembayaran.' : 'Enter an amount above zero and no higher than the payment total.');
      return;
    }
    if (refund.force && !refund.reason.trim()) {
      setActionError(isID ? 'Alasan wajib diisi untuk refund reservasi aktif.' : 'A reason is required to refund an active reservation.');
      return;
    }
    void run(
      () => paymentApi.refund(payment.id, { amount, reason: refund.reason.trim() || undefined, force: refund.force || undefined }),
      isID ? 'Refund berhasil diproses.' : 'Refund processed.',
    );
  };

  if (!allowed) {
    if (authLoading) return <OperationsEmpty loading isID={isID} empty="" />;
    return <AdminAccessGuard isID={isID} onOpenAuth={onOpenAuth}>{null}</AdminAccessGuard>;
  }

  const isPayments = view === 'payments';
  const needle = search.trim().toLowerCase();
  const matches = (row: PaymentResponse | BookingCancellationResponse) =>
    (!status || row.status === status) && (!needle || row.bookingCode.toLowerCase().includes(needle)
      || ('paymentCode' in row && row.paymentCode.toLowerCase().includes(needle)));
  const payments = data?.payments.filter(matches) ?? [];
  const cancellations = data?.cancellations.filter(matches) ?? [];
  const labels = isPayments ? paymentLabels : cancellationLabels;
  const count = isPayments ? payments.length : cancellations.length;
  const listText = !loading && !error
    ? isID ? `${count} ${isPayments ? 'transaksi' : 'pembatalan'} ditampilkan`
      : `${count} ${isPayments ? 'transactions' : 'cancellations'} shown`
    : undefined;
  const emptyText = error
    ? (isID ? 'Daftar transaksi belum tersedia.' : 'The list is unavailable.')
    : status || needle ? (isID ? 'Tidak ada hasil untuk pencarian atau filter ini.' : 'No results match the search or filter.')
      : (isID ? 'Belum ada data untuk ditampilkan.' : 'There are no records to show yet.');
  const controls = (
    <div className="grid w-full min-w-0 gap-2 min-[540px]:grid-cols-[minmax(0,1fr)_minmax(140px,auto)] lg:w-auto lg:grid-cols-[minmax(235px,1fr)_minmax(160px,auto)]">
      <div className="relative min-w-0">
        <Search className="pointer-events-none absolute top-3.5 left-3 size-4 text-slate-500" aria-hidden />
        <input ref={searchField} type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder={isID ? 'Cari kode…' : 'Search by code…'}
          aria-label={isPayments ? (isID ? 'Cari kode pembayaran atau reservasi' : 'Find payment or booking code') : (isID ? 'Cari kode reservasi' : 'Find booking code')}
          className={operationField + ' pl-9 ' + (search ? 'pr-11 [&::-webkit-search-cancel-button]:hidden' : '')} />
        {search && <button type="button" onClick={() => { setSearch(''); searchField.current?.focus(); }} aria-label={isID ? 'Hapus pencarian' : 'Clear search'}
          className="absolute inset-y-0 right-0 grid w-11 cursor-pointer place-items-center rounded-xl text-slate-600 hover:text-navy-dark"><X size={15} aria-hidden /></button>}
      </div>
      <select aria-label={isID ? 'Filter status' : 'Filter by status'} value={status} onChange={event => setStatus(event.target.value)}
        className={operationField + ' cursor-pointer bg-white'}>
        <option value="">{isID ? 'Semua status' : 'All statuses'}</option>
        {Object.entries(labels).map(([value, pair]) => <option key={value} value={value}>{pair[locale]}</option>)}
      </select>
    </div>
  );
  const selected = dialog?.payment;
  const expire = mode === 'expire';

  return (
    <div className="operations-page mx-auto max-w-[1280px] space-y-4 pb-14 text-slate-800 sm:space-y-5">
      <header className="flex items-start justify-between gap-3 py-1 sm:items-center sm:gap-5 sm:py-2">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-[13px] border border-[#dfcfaa] bg-[#fcf5e6] text-[#805819] sm:size-14 sm:rounded-[17px]"><CreditCard className="size-5 sm:size-6" aria-hidden /></span>
          <div className="min-w-0">
            <h1 className="font-serif text-[clamp(1.75rem,4vw,2.7rem)] leading-tight tracking-tight text-navy-dark">{isID ? 'Pembayaran' : 'Payments'}</h1>
            <p className="mt-0.5 text-xs leading-5 text-slate-600 sm:text-sm">{isID ? 'Transaksi, pembatalan, dan pengembalian dana.' : 'Transactions, cancellations, and refunds.'}</p>
          </div>
        </div>
        <button type="button" disabled={loading || busy} aria-busy={loading} aria-label={isID ? 'Muat ulang' : 'Refresh'}
          onClick={() => void refresh()} className={operationSecondary + ' size-11 shrink-0 sm:size-auto'}>
          <RotateCw className={`size-4 shrink-0 ${loading ? 'motion-safe:animate-spin' : ''}`} aria-hidden />
          <span className="hidden sm:inline">{isID ? 'Muat ulang' : 'Refresh'}</span>
        </button>
      </header>
      <div className="flex min-w-0 items-center gap-4 border-b border-slate-200 sm:gap-6" role="group" aria-label={isID ? 'Jenis data transaksi' : 'Transaction record type'}>
        {([
          { value: 'payments', icon: ReceiptText, label: isID ? 'Transaksi' : 'Transactions' },
          { value: 'cancellations', icon: Undo2, label: isID ? 'Pembatalan' : 'Cancellations' },
        ] as const).map(({ value, icon: Icon, label }) => (
          <button key={value} type="button" aria-pressed={view === value} disabled={busy}
            onClick={() => { if (view !== value) { setView(value); setStatus(''); setSearch(''); setNotice(null); } }}
            className="relative -mb-px flex min-h-11 cursor-pointer items-center gap-2 border-b-2 border-transparent px-1 pb-1 text-sm font-semibold text-slate-600 transition-colors hover:text-navy-dark aria-pressed:border-[#a37120] aria-pressed:text-navy-dark sm:px-2">
            <Icon className="size-4" aria-hidden />{label}
          </button>
        ))}
      </div>
      <PaymentOverview rows={isPayments ? data?.payments : data?.cancellations} view={view} status={status} isID={isID} onStatus={setStatus} />

      {error && <OperationsNotice>{error}</OperationsNotice>}
      {notice && <OperationsNotice success>{notice}</OperationsNotice>}

      {isPayments ? (
        <OperationsList isID={isID} title={isID ? 'Daftar pembayaran' : 'Payment list'} description={listText} rows={payments} loading={loading} empty={emptyText} controls={controls}
          primary={{ label: isID ? 'Pembayaran / reservasi' : 'Payment / reservation', render: payment => <>
            <p className="[overflow-wrap:anywhere] font-mono text-xs font-bold text-navy-dark">{payment.paymentCode}</p>
            <p className="mt-1 [overflow-wrap:anywhere] text-xs text-slate-600">{payment.bookingCode}</p>
          </> }}
          columns={[
            { label: isID ? 'Nominal' : 'Amount', render: payment => <span className="font-bold text-navy-dark tabular-nums">{paymentAmount(payment, language)}</span> },
            { label: isID ? 'Metode' : 'Method', render: payment => <>
              <span className="capitalize">{paymentMethod(payment)}</span>
              {payment.gateway && <p className="mt-0.5 text-xs capitalize text-slate-600">{payment.gateway.toLowerCase()}</p>}
            </> },
            { label: isID ? 'Dibuat' : 'Created at', render: payment => operationDate(payment.createdAt, language) },
          ]}
          status={payment => <StatusPill status={payment.status} label={paymentLabels[payment.status]?.[locale]} />}
          actions={payment => (
            <button type="button" disabled={loading || busy} onClick={() => changeMode(payment, 'details')}
              aria-label={`${isID ? 'Detail pembayaran' : 'Payment details'} ${payment.paymentCode}`} className={operationSecondary + ' w-full sm:w-auto'}>
              {isID ? 'Lihat detail' : 'View details'}<ArrowRight className="size-4" aria-hidden />
            </button>
          )}
        />
      ) : (
        <OperationsList isID={isID} title={isID ? 'Daftar pembatalan' : 'Cancellation list'} description={listText} rows={cancellations} loading={loading} empty={emptyText} controls={controls}
          primary={{ label: isID ? 'Reservasi' : 'Reservation', render: row => <>
            <p className="[overflow-wrap:anywhere] font-mono text-xs font-bold text-navy-dark">{row.bookingCode}</p>
            <p className="mt-1 text-xs text-slate-600">{operationDate(row.cancelledAt, language)}</p>
          </> }}
          columns={[
            { label: isID ? 'Dibatalkan oleh' : 'Cancelled by', render: row => row.cancelledByRole || '—' },
            { label: isID ? 'Alasan' : 'Reason', render: row => <span className="block max-w-60 break-words">{row.cancellationReason || '—'}</span> },
            { label: isID ? 'Biaya' : 'Fee', render: row => row.cancellationFeeAmount == null ? '—' : formatCurrency(row.cancellationFeeAmount) },
            { label: 'Refund', render: row => row.refundAmount == null ? '—' : <span className="font-semibold text-navy-dark tabular-nums">{formatCurrency(row.refundAmount)}</span> },
            { label: isID ? 'Status refund' : 'Refund status', render: row => <StatusPill status={row.refundStatus} label={refundLabels[row.refundStatus]?.[locale]} /> },
          ]}
          status={row => <StatusPill status={row.status} label={cancellationLabels[row.status]?.[locale]} />}
        />
      )}

      {selected && (
        <OperationsDialog title={mode === 'refund' ? (isID ? 'Kembalikan dana' : 'Refund payment') : (isID ? 'Detail pembayaran' : 'Payment details')}
          description={selected.paymentCode} isID={isID} busy={busy} onClose={() => setDialog(null)}>
          <div ref={dialogContent} tabIndex={-1} className="space-y-4 outline-none">
            <div className="flex flex-wrap items-start justify-between gap-2 rounded-[15px] border border-[#ded3b8] bg-[#fcf8ee] p-4">
              <div>
                <p className="text-xs font-semibold text-slate-600">{isID ? 'Total pembayaran' : 'Payment total'}</p>
                <p className="mt-1 text-2xl font-bold text-navy-dark tabular-nums">{paymentAmount(selected, language)}</p>
              </div>
              <StatusPill status={selected.status} label={paymentLabels[selected.status]?.[locale]} />
            </div>

            {mode === 'details' && <>
              <dl className="grid grid-cols-2 gap-3 rounded-[15px] border border-slate-200 bg-slate-50 p-4 text-sm">
                {[
                  [isID ? 'Kode reservasi' : 'Booking code', selected.bookingCode],
                  [isID ? 'Metode' : 'Method', paymentMethod(selected)],
                  ['Gateway', selected.gateway || '—'],
                  [isID ? 'Dibuat' : 'Created at', operationDate(selected.createdAt, language)],
                  [isID ? 'Dibayar' : 'Paid at', selected.paidAt && operationDate(selected.paidAt, language)],
                  [isID ? 'Kedaluwarsa' : 'Expired at', selected.expiredAt && operationDate(selected.expiredAt, language)],
                  [isID ? 'Dibatalkan' : 'Cancelled at', selected.cancelledAt && operationDate(selected.cancelledAt, language)],
                  [isID ? 'Dana dikembalikan' : 'Refunded at', selected.refundedAt && operationDate(selected.refundedAt, language)],
                ].map(([label, value]) => value && <div key={label} className="min-w-0">
                  <dt className="text-xs text-slate-600">{label}</dt><dd className="mt-1 [overflow-wrap:anywhere] font-semibold text-navy-dark">{value}</dd>
                </div>)}
              </dl>
              {selected.failureReason && <OperationsNotice>{selected.failureReason}</OperationsNotice>}
              {(selected.status === 'PENDING' || selected.status === 'PAID') && (
                <div className="flex flex-wrap justify-end gap-2">
                  {selected.status === 'PAID' ? <button type="button" onClick={() => changeMode(selected, 'refund')} className={operationPrimary}>
                    <Undo2 size={16} aria-hidden />{isID ? 'Kembalikan dana' : 'Refund'}
                  </button> : <>
                    <button type="button" onClick={() => changeMode(selected, 'expire')} className={operationSecondary}><CalendarClock size={16} aria-hidden />{isID ? 'Kedaluwarsakan' : 'Expire'}</button>
                    <button type="button" onClick={() => changeMode(selected, 'cancel')} className={operationDanger}><Ban size={16} aria-hidden />{isID ? 'Batalkan pembayaran' : 'Cancel payment'}</button>
                  </>}
                </div>
              )}
            </>}

            {(mode === 'expire' || mode === 'cancel') && <>
              <p className="text-sm leading-6 text-slate-700">
                {expire ? (isID ? 'Tandai pembayaran ini sebagai kedaluwarsa?' : 'Mark this payment as expired?')
                  : (isID ? 'Batalkan pembayaran ini?' : 'Cancel this payment?')}
              </p>
              {actionError && <OperationsNotice>{actionError}</OperationsNotice>}
              <div className="flex flex-wrap justify-end gap-2">
                <button type="button" disabled={busy} onClick={() => changeMode(selected, 'details')} className={operationSecondary}>{isID ? 'Kembali' : 'Back'}</button>
                <button type="button" disabled={busy} className={expire ? operationPrimary : operationDanger} onClick={() => void run(
                  () => expire ? adminApi.expirePayment(selected.id) : paymentApi.cancel(selected.id),
                  expire ? (isID ? 'Pembayaran ditandai kedaluwarsa.' : 'Payment expired.') : (isID ? 'Pembayaran dibatalkan.' : 'Payment cancelled.'),
                )}>
                  {busy && <LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden />}
                  {expire ? (isID ? 'Kedaluwarsakan' : 'Expire') : (isID ? 'Batalkan pembayaran' : 'Cancel payment')}
                </button>
              </div>
            </>}

            {mode === 'refund' && (
              <form onSubmit={handleRefund} className="space-y-4">
                <fieldset disabled={busy} className="space-y-3">
                  <label className="block text-sm font-semibold">{isID ? 'Nominal refund' : 'Refund amount'}
                    <input type="number" min="0.01" step="0.01" max={selected.amount} value={refund.amount} onChange={event => setRefund({ ...refund, amount: event.target.value })}
                      placeholder={isID ? 'Kosong untuk refund penuh' : 'Blank for a full refund'} className={operationField + ' mt-1 font-normal'} />
                  </label>
                  <label className="block text-sm font-semibold">{isID ? 'Alasan' : 'Reason'}
                    <textarea maxLength={500} rows={3} required={refund.force} value={refund.reason} onChange={event => setRefund({ ...refund, reason: event.target.value })}
                      className={operationField + ' mt-1 resize-y'} />
                  </label>
                  <label className="flex min-h-11 items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                    <input type="checkbox" checked={refund.force} onChange={event => setRefund({ ...refund, force: event.target.checked })} className="mt-0.5 size-4 shrink-0 accent-navy" />
                    <span>
                      <span className="block font-semibold">{isID ? 'Refund untuk reservasi aktif' : 'Refund an active reservation'}</span>
                      <span className="mt-0.5 block text-xs leading-5">{isID ? 'Alasan wajib diisi untuk refund reservasi aktif.' : 'A reason is required to refund an active reservation.'}</span>
                    </span>
                  </label>
                </fieldset>
                {actionError && <OperationsNotice>{actionError}</OperationsNotice>}
                <div className="flex flex-wrap justify-end gap-2">
                  <button type="button" disabled={busy} onClick={() => changeMode(selected, 'details')} className={operationSecondary}>{isID ? 'Kembali' : 'Back'}</button>
                  <button type="submit" disabled={busy} className={operationPrimary}>{busy ? <LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden /> : <Undo2 size={16} aria-hidden />}{isID ? 'Proses refund' : 'Process refund'}</button>
                </div>
              </form>
            )}
          </div>
        </OperationsDialog>
      )}
    </div>
  );
}
