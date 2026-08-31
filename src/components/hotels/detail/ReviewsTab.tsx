import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Star, Loader2, BadgeCheck, ThumbsUp, AlertCircle, CheckCircle2, Send } from 'lucide-react';
import { Hotel } from '../../../types';
import { BookingResponse } from '../../../types/api';
import { useAuth } from '../../../context/AuthContext';
import { reviewApi } from '../../../api/reviews';
import { bookingApi } from '../../../api/bookings';
import { ApiError } from '../../../lib/http';
import { formatDate } from '../../../lib/utils';
import { StarRating, RatingBar } from './StarRating';

export const ReviewsTab: React.FC<{ hotel: Hotel; isID: boolean }> = ({ hotel, isID }) => {
  const { user } = useAuth();
  // review-service only allows a review for a booking that is (a) the caller's
  // own, (b) CHECKED_OUT, and (c) not already reviewed (unique per booking) —
  // so instead of asking the guest to type a raw booking ID, we fetch their
  // own bookings + their own reviews and only offer stays that actually qualify.
  const [eligibleBookings, setEligibleBookings] = useState<BookingResponse[] | null>(null);
  const [loadingEligible, setLoadingEligible] = useState(false);
  const [reviewBookingId, setReviewBookingId] = useState('');
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Real per-star counts from review-service. Undefined until the detail data
  // loads — we render nothing rather than inventing a distribution.
  const ratingBreakdown = hotel.ratingBreakdown;

  useEffect(() => {
    if (!user) {
      setEligibleBookings(null);
      return;
    }
    let cancelled = false;
    setLoadingEligible(true);
    Promise.all([bookingApi.myBookings(), reviewApi.myReviews(0, 100)])
      .then(([bookings, myReviews]) => {
        if (cancelled) return;
        const reviewedBookingIds = new Set(myReviews.content.map((r) => r.bookingId));
        setEligibleBookings(
          bookings.filter(
            (b) => String(b.hotelId) === hotel.id && b.status === 'CHECKED_OUT' && !reviewedBookingIds.has(b.id)
          )
        );
      })
      .catch((err) => {
        console.error('Failed to load eligible bookings for review', err);
        if (!cancelled) setEligibleBookings([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingEligible(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, hotel.id]);

  useEffect(() => {
    if (eligibleBookings && eligibleBookings.length > 0 && !reviewBookingId) {
      setReviewBookingId(String(eligibleBookings[0].id));
    }
  }, [eligibleBookings, reviewBookingId]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError(null); setReviewSuccess(false); setIsSubmittingReview(true);
    try {
      const bookingId = Number(reviewBookingId);
      await reviewApi.create({
        bookingId,
        rating: reviewRating,
        title: reviewTitle || undefined,
        comment: reviewComment || undefined,
      });
      setReviewSuccess(true);
      setEligibleBookings((prev) => (prev ? prev.filter((b) => b.id !== bookingId) : prev));
      setReviewBookingId(''); setReviewTitle(''); setReviewComment(''); setReviewRating(5);
    } catch (err) {
      setReviewError(err instanceof ApiError ? err.message : (isID ? 'Gagal mengirim ulasan.' : 'Failed to submit review.'));
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Rating Summary */}
      <div className="p-6 rounded-2xl bg-navy-soft/60 border border-navy-soft">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-navy text-white flex flex-col items-center justify-center">
              <span className="text-2xl font-bold">{hotel.rating.toFixed(1)}</span>
              <span className="text-[10px] font-light opacity-70">/ 5</span>
            </div>
            <div>
              <StarRating rating={hotel.rating} size="md" />
              <p className="text-[13px] font-semibold text-navy mt-1">
                {hotel.rating >= 4.8 ? (isID ? 'Sangat Luar Biasa' : 'Exceptional') : (isID ? 'Sangat Bagus' : 'Very Good')}
              </p>
              <p className="text-[11px] text-slate-400 font-light">{hotel.reviewsCount} {isID ? 'ulasan terverifikasi' : 'verified reviews'}</p>
            </div>
          </div>
          {ratingBreakdown ? (
            <div className="flex-1 w-full sm:w-auto space-y-1.5">
              {([5, 4, 3, 2, 1] as const).map((star) => (
                <RatingBar key={star} label={String(star)} value={ratingBreakdown[star] ?? 0} total={hotel.reviewsCount} />
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center gap-2 text-[12px] text-slate-400 font-light">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {isID ? 'Memuat distribusi rating...' : 'Loading rating breakdown...'}
            </div>
          )}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        {hotel.reviews.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto">
              <Star className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-[13px] text-slate-400 font-light">{isID ? 'Belum ada ulasan.' : 'No reviews yet.'}</p>
          </div>
        ) : (
          hotel.reviews.map((rev, idx) => (
            <motion.div
              key={rev.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="p-5 rounded-2xl border border-navy-soft space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={rev.userAvatar} alt={rev.userName} className="w-10 h-10 rounded-full object-cover bg-slate-100" />
                  <div>
                    <span className="font-semibold text-[13px] text-slate-900 flex items-center gap-1.5">
                      {rev.userName}
                      {rev.isVerifiedStay && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600" title={isID ? 'Menginap terverifikasi' : 'Verified stay'}>
                          <BadgeCheck className="w-3.5 h-3.5" />
                          {isID ? 'Terverifikasi' : 'Verified'}
                        </span>
                      )}
                    </span>
                    <span className="text-[11px] text-slate-400 font-light">{rev.date}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg">
                  <Star className="w-3.5 h-3.5 fill-gold text-gold" />
                  <span className="text-[13px] font-semibold text-slate-700">{rev.rating}</span>
                </div>
              </div>

              {rev.title && (
                <p className="text-[13.5px] font-semibold text-slate-800">{rev.title}</p>
              )}
              {rev.comment && (
                <p className="text-[14px] text-slate-600 font-light leading-relaxed">"{rev.comment}"</p>
              )}
              {!!rev.helpfulCount && rev.helpfulCount > 0 && (
                <p className="text-[11px] text-slate-400 font-light flex items-center gap-1.5">
                  <ThumbsUp className="w-3 h-3" />
                  {rev.helpfulCount} {isID ? 'orang terbantu' : 'found this helpful'}
                </p>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* Write Review */}
      <div className="pt-6 border-t border-slate-100 space-y-4">
        <h4 className="font-semibold text-[15px] text-navy font-serif">{isID ? 'Tulis ulasan' : 'Write a review'}</h4>
        {!user ? (
          <div className="p-6 rounded-2xl bg-slate-50 text-center">
            <p className="text-[13px] text-slate-500 font-light">{isID ? 'Masuk untuk menulis ulasan.' : 'Sign in to write a review.'}</p>
          </div>
        ) : loadingEligible ? (
          <div className="p-6 rounded-2xl bg-slate-50 flex items-center justify-center gap-2 text-[13px] text-slate-400 font-light">
            <Loader2 className="w-4 h-4 animate-spin" />
            {isID ? 'Memeriksa riwayat menginap Anda...' : 'Checking your stay history...'}
          </div>
        ) : eligibleBookings && eligibleBookings.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-50 text-center">
            <p className="text-[13px] text-slate-500 font-light">
              {isID
                ? 'Ulasan hanya bisa ditulis setelah menginap (check-out) di hotel ini, dan setiap reservasi hanya bisa diulas sekali.'
                : 'A review can only be written after you check out from this hotel, and each booking can only be reviewed once.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div>
              <label className="text-[12px] font-medium text-slate-500 block mb-2">{isID ? 'Reservasi' : 'Booking'}</label>
              <select required value={reviewBookingId} onChange={(e) => setReviewBookingId(e.target.value)}
                className="w-full min-h-12 p-3.5 rounded-xl border border-navy-soft bg-white text-[13px] text-navy focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/15 transition-colors">
                {eligibleBookings?.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.bookingCode} — {b.roomName || `Room #${b.roomId}`} ({formatDate(b.checkOutDate, isID ? 'ID' : 'EN')})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[12px] font-medium text-slate-500 block mb-2">{isID ? 'Judul (opsional)' : 'Title (optional)'}</label>
                <input type="text" value={reviewTitle} onChange={(e) => setReviewTitle(e.target.value)} maxLength={200}
                  className="w-full p-3.5 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-900 placeholder-slate-300 focus:outline-none focus:border-slate-900 transition-colors"
                  placeholder={isID ? 'Ringkasan singkat pengalaman Anda' : 'A short summary of your stay'} />
              </div>
              <div>
                <label className="text-[12px] font-medium text-slate-500 block mb-2">{isID ? 'Rating' : 'Rating'}</label>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map((n) => (
                    <button key={n} type="button" onClick={() => setReviewRating(n)}
                      className="p-1 transition-transform hover:scale-110">
                      <Star className={`w-6 h-6 ${n <= reviewRating ? 'fill-gold text-gold' : 'fill-slate-200 text-slate-200'}`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} rows={4} maxLength={4000}
              placeholder={isID ? 'Bagikan pengalaman menginap Anda...' : 'Share your stay experience...'}
              className="w-full p-3.5 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-900 placeholder-slate-300 focus:outline-none focus:border-slate-900 transition-colors resize-none" />
            {reviewError && (
              <p className="text-[12px] text-rose-600 font-medium flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{reviewError}</p>
            )}
            {reviewSuccess && (
              <p className="text-[12px] text-emerald-600 font-medium flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" />{isID ? 'Ulasan terkirim!' : 'Review submitted!'}</p>
            )}
            <button type="submit" disabled={isSubmittingReview || !reviewBookingId}
              className="min-h-12 px-6 py-3 rounded-xl bg-gold hover:bg-gold-dark text-white text-[13px] font-semibold transition-colors duration-200 flex items-center gap-2 disabled:opacity-50 cursor-pointer">
              {isSubmittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {isID ? 'Kirim Ulasan' : 'Submit Review'}
            </button>
          </form>
        )}
      </div>
    </motion.div>
  );
};
