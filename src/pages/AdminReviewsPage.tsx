import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, BadgeCheck, EyeOff, LoaderCircle, MessageSquareText, Star, Trash2 } from 'lucide-react';
import { adminApi } from '../api/admin';
import { AdminAccessGuard } from '../components/admin/AdminAccessGuard';
import { AdminCardsSkeleton } from '../components/admin/AdminSkeleton';
import { OperationsDialog } from '../components/admin/OperationsDialog';
import {
  OperationsEmpty, OperationsFilters, OperationsNotice, OperationsPage, OperationsPager,
  operationDanger, operationDate, operationPanel, operationPrimary, operationSecondary,
} from '../components/admin/OperationsPage';
import { StatusPill } from '../components/admin/StatusPill';
import { useAuth } from '../context/AuthContext';
import { useOperationsQuery } from '../hooks/useOperationsQuery';
import { ApiError } from '../lib/http';
import type { Hotel, Language } from '../types';
import type { ReviewResponse, ReviewStatus } from '../types/api/review';

const statusLabels: Record<ReviewStatus, [string, string]> = {
  APPROVED: ['Tayang', 'Published'],
  PENDING: ['Menunggu', 'Pending'],
  HIDDEN: ['Tersembunyi', 'Hidden'],
  REJECTED: ['Ditolak', 'Rejected'],
};

function ReviewRating({ rating, isID }: { rating: number; isID: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-bold tabular-nums text-navy-dark">
      <span className="sr-only">{isID ? `${rating} dari 5 bintang` : `${rating} out of 5 stars`}</span>
      <span aria-hidden className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star key={star} className={`size-3.5 ${star <= rating ? 'fill-[#b17420] text-[#b17420]' : 'text-slate-400'}`} />
        ))}
      </span>
      <span aria-hidden>{rating}/5</span>
    </span>
  );
}

export function AdminReviewsPage({ language, hotels, onOpenAuth }: { language: Language; hotels: Pick<Hotel, 'id' | 'name'>[]; onOpenAuth?: () => void }) {
  const isID = language === 'ID';
  const locale = isID ? 0 : 1;
  const { user, isLoading: authLoading } = useAuth();
  const allowed = user?.role === 'ADMIN';
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState<ReviewResponse | null>(null);
  const [action, setAction] = useState<'hide' | 'delete' | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const read = useCallback(() => adminApi.listReviews(page, 12), [page, user?.userId]);
  const { data, loading, error, refresh } = useOperationsQuery(read, allowed, isID ? 'Gagal memuat ulasan.' : 'Could not load reviews.');
  const totalPages = data?.totalPages;

  useEffect(() => {
    if (totalPages !== undefined && page > 0 && page >= totalPages) setPage(Math.max(0, totalPages - 1));
  }, [page, totalPages]);

  const close = () => {
    setSelected(null);
    setAction(null);
    setActionError(null);
  };

  const moderate = async () => {
    if (!selected || !action || busy) return;
    setBusy(true);
    setActionError(null);
    setNotice(null);
    try {
      if (action === 'hide') {
        await adminApi.hideReview(selected.id);
        setNotice(isID ? 'Ulasan disembunyikan dari publik.' : 'Review hidden from the public.');
      } else {
        await adminApi.deleteReview(selected.id);
        setNotice(isID ? 'Ulasan dihapus.' : 'Review deleted.');
      }
      close();
      await refresh();
    } catch (failure) {
      setActionError(failure instanceof ApiError ? failure.message : (isID ? 'Moderasi ulasan gagal.' : 'Could not moderate the review.'));
    } finally {
      setBusy(false);
    }
  };

  if (!allowed) {
    if (authLoading) return <OperationsEmpty loading isID={isID} empty="" />;
    return <AdminAccessGuard isID={isID} onOpenAuth={onOpenAuth}>{null}</AdminAccessGuard>;
  }

  const rows = data?.content ?? [];
  const reviews = status ? rows.filter(review => review.status === status) : rows;
  const statusBadge = (review: ReviewResponse) => <StatusPill status={review.status} label={statusLabels[review.status]?.[locale]} />;
  const hotelNames = new Map(hotels.map(hotel => [hotel.id, hotel.name]));
  const hotelRef = (review: ReviewResponse) => hotelNames.get(String(review.hotelId)) ?? `Hotel #${review.hotelId}`;
  const reviewer = (review: ReviewResponse) => review.isAnonymous
    ? (isID ? 'Anonim' : 'Anonymous')
    : (isID ? `Tamu #${review.userId}` : `Guest #${review.userId}`);

  return (
    <OperationsPage icon={MessageSquareText} title={isID ? 'Ulasan' : 'Reviews'}
      description={isID ? 'Tinjau ulasan tamu dan kelola yang tampil di halaman hotel.' : 'Review guest feedback and manage what appears on hotel pages.'}
      isID={isID} loading={loading} onRefresh={() => void refresh()} blocked={busy || !!selected}>
      {error && <OperationsNotice>{error}</OperationsNotice>}
      {notice && <OperationsNotice success>{notice}</OperationsNotice>}
      <section aria-labelledby="guest-reviews" aria-busy={loading} className={operationPanel + ' overflow-hidden'}>
        <div className="border-b border-slate-200 px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 id="guest-reviews" className="text-xl font-semibold text-navy-dark">{isID ? 'Ulasan tamu' : 'Guest reviews'}</h2>
            {data && <p className="text-sm font-medium text-slate-600">
              {data.totalElements.toLocaleString(isID ? 'id-ID' : 'en-US')} {isID ? 'ulasan tersimpan' : 'reviews in total'}
            </p>}
          </div>
          {rows.length > 0 && (
            <div className="mt-3">
              <p className="mb-1.5 text-xs font-semibold text-slate-600">{isID ? 'Status di halaman ini' : 'Status on this page'}</p>
              <OperationsFilters label={isID ? 'Status di halaman ini' : 'Status on this page'} value={status} onChange={setStatus}
                items={[{ value: '', label: isID ? 'Semua' : 'All' }, ...Object.entries(statusLabels).map(([value, pair]) => ({ value, label: pair[locale] }))]} />
            </div>
          )}
        </div>

        {loading && reviews.length === 0 ? <AdminCardsSkeleton isID={isID} layout="reviews" /> : reviews.length === 0 ? (
          <OperationsEmpty loading={false} isID={isID} empty={error ? (isID ? 'Daftar ulasan belum tersedia.' : 'The review list is unavailable.')
            : status && rows.length ? (isID ? 'Tidak ada ulasan dengan status ini di halaman ini.' : 'No reviews with this status on this page.')
              : (isID ? 'Belum ada ulasan.' : 'No reviews yet.')} />
        ) : (
          <ul className="grid divide-y divide-slate-200 md:grid-cols-2 md:gap-px md:divide-y-0 md:bg-slate-200">
            {reviews.map(review => (
              <li key={review.id} className="flex min-w-0 flex-col gap-3 bg-white p-4 sm:p-5 lg:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <ReviewRating rating={review.rating} isID={isID} />
                  {statusBadge(review)}
                </div>
                <div className="min-w-0">
                  {review.title && <h3 className="line-clamp-2 text-lg font-semibold leading-tight text-navy-dark [overflow-wrap:anywhere]">{review.title}</h3>}
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-700 [overflow-wrap:anywhere]">
                    {review.comment || (isID ? 'Tanpa komentar.' : 'No comment.')}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600">
                  <span className="font-semibold">{reviewer(review)}</span>
                  {review.isVerifiedStay && <span className="inline-flex items-center gap-1 text-emerald-800">
                    <BadgeCheck className="size-3.5" aria-hidden />{isID ? 'Menginap terverifikasi' : 'Verified stay'}
                  </span>}
                </div>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <div className="min-w-0 text-xs text-slate-600">
                    <p className="font-semibold text-slate-700 [overflow-wrap:anywhere]">{hotelRef(review)}</p>
                    <p className="mt-0.5">{operationDate(review.createdAt, language)}</p>
                  </div>
                  <button type="button" disabled={loading || busy} onClick={() => setSelected(review)}
                    aria-label={`${isID ? 'Tinjau ulasan' : 'Review details'} ${review.reviewCode}`} className={operationSecondary}>
                    {isID ? 'Tinjau' : 'Review'}<ArrowRight className="size-4" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {(page > 0 || (totalPages ?? 0) > 1) && (
          <div className="border-t border-slate-200 px-4 py-3 sm:px-6">
            <OperationsPager page={page} totalPages={totalPages ?? 0} isID={isID} disabled={loading || busy} onChange={setPage} />
          </div>
        )}
      </section>

      {selected && (
        <OperationsDialog title={isID ? 'Tinjau ulasan' : 'Review details'} description={selected.reviewCode} isID={isID} busy={busy} onClose={close}>
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <ReviewRating rating={selected.rating} isID={isID} />{statusBadge(selected)}
              </div>
              {selected.title && <h3 className="mt-3 text-lg font-semibold text-navy-dark [overflow-wrap:anywhere]">{selected.title}</h3>}
              <p className="mt-2 text-sm leading-6 whitespace-pre-wrap text-slate-700 [overflow-wrap:anywhere]">
                {selected.comment || (isID ? 'Tanpa komentar.' : 'No comment.')}
              </p>
              <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-700">
                <span>{reviewer(selected)}</span><span aria-hidden>·</span><span>{hotelRef(selected)}</span>
                <span aria-hidden>·</span><span>{operationDate(selected.createdAt, language)}</span>
              </p>
            </div>

            {action && <p className="text-sm leading-6 text-slate-700">{action === 'hide'
              ? (isID ? 'Ulasan akan hilang dari halaman publik dan rating hotel akan dihitung ulang.' : 'The review will be removed from public view and the hotel rating will be recalculated.')
              : (isID ? 'Ulasan akan dihapus permanen. Rating hotel akan dihitung ulang.' : 'The review will be permanently deleted. The hotel rating will be recalculated.')}</p>}
            {actionError && <OperationsNotice>{actionError}</OperationsNotice>}

            <div className="flex flex-wrap justify-end gap-2">
              {action ? <>
                <button type="button" disabled={busy} onClick={() => { setAction(null); setActionError(null); }} className={operationSecondary}>{isID ? 'Kembali' : 'Back'}</button>
                <button type="button" disabled={busy} onClick={() => void moderate()} className={action === 'hide' ? operationPrimary : operationDanger}>
                  {busy && <LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden />}
                  {action === 'hide' ? (isID ? 'Konfirmasi sembunyikan' : 'Confirm hide') : (isID ? 'Hapus permanen' : 'Delete permanently')}
                </button>
              </> : <>
                {selected.status !== 'HIDDEN' && <button type="button" onClick={() => setAction('hide')} className={operationSecondary}>
                  <EyeOff className="size-4" aria-hidden />{isID ? 'Sembunyikan' : 'Hide'}
                </button>}
                <button type="button" onClick={() => setAction('delete')} className={operationDanger}>
                  <Trash2 className="size-4" aria-hidden />{isID ? 'Hapus ulasan' : 'Delete review'}
                </button>
              </>}
            </div>
          </div>
        </OperationsDialog>
      )}
    </OperationsPage>
  );
}
