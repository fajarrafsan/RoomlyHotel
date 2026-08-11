import React, { useCallback, useEffect, useState } from 'react';
import { Star, EyeOff, Trash2, Loader2, BadgeCheck } from 'lucide-react';
import { adminApi } from '../api/admin';
import { ApiError } from '../lib/http';
import { Language } from '../types';
import { ReviewResponse } from '../types/api/review';
import { AdminAccessGuard } from '../components/admin/AdminAccessGuard';
import { AdminPageShell, AdminTableCard } from '../components/admin/AdminPageShell';
import { StatusPill } from '../components/admin/StatusPill';

export const AdminReviewsPage: React.FC<{ language: Language; onOpenAuth?: () => void }> = ({
  language,
  onOpenAuth,
}) => {
  const isID = language === 'ID';

  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await adminApi.listReviews(0, 100);
      setReviews(page.content);
      setTotalElements(page.totalElements);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (isID ? 'Gagal memuat ulasan.' : 'Failed to load reviews.'));
    } finally {
      setLoading(false);
    }
  }, [isID]);

  useEffect(() => { load(); }, [load]);

  // Hiding is a soft moderation action: the row stays but drops out of the
  // public list and the hotel's rating aggregate, which the backend recomputes.
  const handleHide = async (review: ReviewResponse) => {
    setBusyId(review.id);
    setError(null);
    try {
      const updated = await adminApi.hideReview(review.id);
      setReviews((prev) => prev.map((r) => (r.id === review.id ? { ...r, status: updated.status } : r)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (isID ? 'Gagal menyembunyikan ulasan.' : 'Failed to hide review.'));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (review: ReviewResponse) => {
    const ok = window.confirm(
      isID
        ? `Hapus permanen ulasan ${review.reviewCode}? Tindakan ini tidak bisa dibatalkan.`
        : `Permanently delete review ${review.reviewCode}? This cannot be undone.`
    );
    if (!ok) return;

    setBusyId(review.id);
    setError(null);
    try {
      await adminApi.deleteReview(review.id);
      setReviews((prev) => prev.filter((r) => r.id !== review.id));
      setTotalElements((prev) => Math.max(0, prev - 1));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (isID ? 'Gagal menghapus ulasan.' : 'Failed to delete review.'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminAccessGuard isID={isID} onOpenAuth={onOpenAuth}>
      <AdminPageShell
        icon={Star}
        title={isID ? 'Moderasi Ulasan' : 'Review Moderation'}
        subtitle={
          isID
            ? `Semua ulasan lintas status (termasuk yang disembunyikan). Menyembunyikan atau menghapus akan langsung memperbarui rating hotel. ${totalElements} total.`
            : `Every review across all statuses, including hidden ones. Hiding or deleting immediately recomputes the hotel's rating. ${totalElements} total.`
        }
        endpoint="GET /api/admin/reviews"
        isID={isID}
        loading={loading}
        error={error}
        onRefresh={load}
      >
        <AdminTableCard
          isID={isID}
          loading={loading}
          isEmpty={reviews.length === 0}
          emptyLabel={isID ? 'Belum ada ulasan.' : 'No reviews yet.'}
        >
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">{isID ? 'Kode' : 'Code'}</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">{isID ? 'Ulasan' : 'Review'}</th>
                <th className="px-4 py-3">Hotel</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">{isID ? 'Tanggal' : 'Date'}</th>
                <th className="px-4 py-3 text-right">{isID ? 'Aksi' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700">
              {reviews.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50 transition-colors align-top">
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">{r.reviewCode}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-lg font-semibold text-slate-700">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {r.rating}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-[320px]">
                    {r.title && <p className="font-semibold text-slate-800 truncate">{r.title}</p>}
                    <p className="text-slate-500 font-light line-clamp-2">{r.comment || '—'}</p>
                    <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                      <span>{r.isAnonymous ? (isID ? 'Anonim' : 'Anonymous') : `User #${r.userId}`}</span>
                      {r.isVerifiedStay && (
                        <span className="inline-flex items-center gap-0.5 text-emerald-600 font-medium">
                          <BadgeCheck className="w-3 h-3" />
                          {isID ? 'Terverifikasi' : 'Verified'}
                        </span>
                      )}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">#{r.hotelId}</td>
                  <td className="px-4 py-3"><StatusPill status={r.status} /></td>
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{r.createdAt?.slice(0, 10)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {busyId === r.id && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400 mr-1" />}
                      {r.status !== 'HIDDEN' && (
                        <button
                          onClick={() => handleHide(r)}
                          disabled={busyId === r.id}
                          title={isID ? 'Sembunyikan dari publik' : 'Hide from public'}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-50 transition-all cursor-pointer disabled:opacity-40"
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(r)}
                        disabled={busyId === r.id}
                        title={isID ? 'Hapus permanen' : 'Delete permanently'}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-all cursor-pointer disabled:opacity-40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminTableCard>
      </AdminPageShell>
    </AdminAccessGuard>
  );
};
