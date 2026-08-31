import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Search, ShieldAlert, Loader2, AlertCircle, CheckCircle2,
  User, Building2, BedDouble, Calendar, RotateCcw, ArrowLeft, LogOut,
  CreditCard, Ban, Undo2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookingApi } from '../api/bookings';
import { paymentApi } from '../api/payments';
import { roomApi } from '../api/rooms';
import { ApiError } from '../lib/http';
import { formatCurrency, formatDate } from '../lib/utils';
import { BookingResponse, PaymentResponse, RoomUnitResponse } from '../types/api';
import { Language } from '../types';

interface CheckInPageProps {
  language: Language;
}

const FRONT_DESK_ROLES = new Set(['ADMIN', 'RECEPTIONIST']);

export const CheckInPage: React.FC<CheckInPageProps> = ({ language }) => {
  const isID = language === 'ID';
  const { user } = useAuth();
  const navigate = useNavigate();

  const [bookingCode, setBookingCode] = useState('');

  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [units, setUnits] = useState<RoomUnitResponse[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);

  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkInError, setCheckInError] = useState<string | null>(null);
  const [operationResult, setOperationResult] = useState<{ booking: BookingResponse; action: 'CHECK_IN' | 'CHECK_OUT' } | null>(null);
  const [payment, setPayment] = useState<PaymentResponse | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentAction, setPaymentAction] = useState<'CANCEL' | 'REFUND' | null>(null);
  const [paymentActionLoading, setPaymentActionLoading] = useState(false);
  const [refundReason, setRefundReason] = useState('');

  if (!user || !FRONT_DESK_ROLES.has(user.role)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center gap-4 py-20">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{isID ? 'Akses Ditolak' : 'Access Denied'}</h2>
          <p className="text-sm text-slate-500 mt-1 max-w-sm">
            {isID
              ? 'Halaman check-in hanya tersedia untuk admin dan resepsionis.'
              : 'The check-in page is only available to administrators and receptionists.'}
          </p>
        </div>
        <button onClick={() => navigate('/')} className="text-sm font-semibold text-slate-900 hover:underline underline-offset-2">
          {isID ? 'Kembali ke Beranda' : 'Back to Home'}
        </button>
      </div>
    );
  }

  const resetSearch = () => {
    setBooking(null);
    setUnits([]);
    setSelectedUnitId(null);
    setLookupError(null);
    setCheckInError(null);
    setOperationResult(null);
    setPayment(null);
    setPaymentError(null);
    setPaymentAction(null);
    setRefundReason('');
    setBookingCode('');
  };

  const loadPayment = async (bookingId: number) => {
    setPaymentLoading(true);
    setPaymentError(null);
    setPayment(null);
    try {
      setPayment(await paymentApi.getByBookingId(bookingId));
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 404)) {
        setPaymentError(err instanceof ApiError
          ? err.message
          : (isID ? 'Data pembayaran tidak dapat dimuat.' : 'Payment details could not be loaded.'));
      }
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleLookupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = bookingCode.trim();
    if (!code) return;

    setLookupLoading(true);
    setLookupError(null);
    setBooking(null);
    setUnits([]);
    setSelectedUnitId(null);
    setPayment(null);
    setPaymentError(null);
    setPaymentAction(null);
    try {
      const found = await bookingApi.getByCode(code);
      setBooking(found);
      void loadPayment(found.id);

      if (found.status === 'CONFIRMED') {
        setUnitsLoading(true);
        try {
          const roomUnits = await roomApi.unitsByRoom(found.roomId);
          setUnits(roomUnits.filter((u) => u.status === 'AVAILABLE'));
        } catch (unitErr) {
          console.error('Failed to load room units', unitErr);
          setCheckInError(isID ? 'Gagal memuat daftar unit kamar.' : 'Failed to load room units.');
        } finally {
          setUnitsLoading(false);
        }
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setLookupError(err.message);
      } else {
        setLookupError(isID ? 'Booking tidak ditemukan untuk kode ini.' : 'No booking found for this code.');
      }
    } finally {
      setLookupLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!booking || !selectedUnitId) return;
    setCheckInLoading(true);
    setCheckInError(null);
    try {
      const updated = await bookingApi.checkIn(booking.id, selectedUnitId);
      setOperationResult({ booking: updated, action: 'CHECK_IN' });
    } catch (err) {
      if (err instanceof ApiError) {
        setCheckInError(err.message);
      } else {
        setCheckInError(isID ? 'Gagal melakukan check-in. Coba lagi.' : 'Failed to check in. Please try again.');
      }
    } finally {
      setCheckInLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!booking) return;
    setCheckInLoading(true);
    setCheckInError(null);
    try {
      const updated = await bookingApi.checkOut(booking.id);
      setOperationResult({ booking: updated, action: 'CHECK_OUT' });
    } catch (err) {
      setCheckInError(err instanceof ApiError
        ? err.message
        : (isID ? 'Gagal melakukan check-out. Coba lagi.' : 'Failed to check out. Please try again.'));
    } finally {
      setCheckInLoading(false);
    }
  };

  const handlePaymentAction = async () => {
    if (!payment || !paymentAction || !booking) return;
    setPaymentActionLoading(true);
    setPaymentError(null);
    try {
      const updated = paymentAction === 'CANCEL'
        ? await paymentApi.cancel(payment.id)
        : await paymentApi.refund(payment.id, { reason: refundReason.trim() || undefined });
      setPayment(updated);
      setPaymentAction(null);
      setRefundReason('');
      try {
        setBooking(await bookingApi.getByCode(booking.bookingCode));
      } catch {
        // Payment action itself succeeded; a delayed booking sync will be shown
        // the next time this booking is searched.
      }
    } catch (err) {
      setPaymentError(err instanceof ApiError
        ? err.message
        : (isID ? 'Aksi pembayaran gagal diproses.' : 'The payment action could not be processed.'));
    } finally {
      setPaymentActionLoading(false);
    }
  };

  const isCheckedIn = booking?.status === 'CHECKED_IN';
  const canCheckIn = booking?.status === 'CONFIRMED';
  const isIneligible = booking && !isCheckedIn && !canCheckIn;
  const canCancelPayment = !!payment && !['PAID', 'CANCELLED', 'EXPIRED', 'REFUNDED'].includes(payment.status);
  const canRefundPayment = payment?.status === 'PAID'
    && !!booking
    && ['CANCELLED', 'EXPIRED', 'NO_SHOW'].includes(booking.status);

  return (
    <div className="max-w-3xl mx-auto pb-16 px-4 sm:px-6 lg:px-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs sm:text-[13px] font-medium text-slate-500 hover:text-slate-900 transition-colors mb-3 sm:mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        {isID ? 'Kembali' : 'Back'}
      </button>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-6 bg-slate-900 text-white">
          <h1 className="text-base sm:text-lg font-semibold flex items-center gap-2">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
            {isID ? 'Check-In & Check-Out Tamu' : 'Guest Check-In & Check-Out'}
          </h1>
          <p className="text-xs sm:text-[13px] text-slate-300 mt-1 font-light leading-relaxed">
            {isID
              ? 'Masukkan kode booking untuk memproses kedatangan atau kepulangan tamu.'
              : "Enter the guest's booking code to process arrival or departure."}
          </p>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
            {operationResult ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4 py-6">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-slate-900">
                  {operationResult.action === 'CHECK_IN'
                    ? (isID ? 'Check-In Berhasil' : 'Check-In Successful')
                    : (isID ? 'Check-Out Berhasil' : 'Check-Out Successful')}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  {operationResult.booking.bookingCode}
                  {operationResult.action === 'CHECK_IN' && ` · ${isID ? 'Kamar' : 'Room'} ${units.find((u) => u.id === selectedUnitId)?.roomNumber ?? '—'}`}
                </p>
              </div>
              <button
                onClick={resetSearch}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-[13px] font-semibold transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                {isID ? 'Proses Tamu Berikutnya' : 'Process Next Guest'}
              </button>
            </motion.div>
          ) : booking ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              {/* Booking summary */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{booking.bookingCode}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    booking.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {booking.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[13px] text-slate-800 font-semibold">
                  <User className="w-4 h-4 text-slate-400" />
                  {booking.guests.find((g) => g.isPrimaryGuest)?.fullName || booking.guests[0]?.fullName || '—'}
                </div>
                <div className="flex items-center gap-2 text-[13px] text-slate-600">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  {booking.hotelName || `Hotel #${booking.hotelId}`}
                </div>
                <div className="flex items-center gap-2 text-[13px] text-slate-600">
                  <BedDouble className="w-4 h-4 text-slate-400" />
                  {booking.roomName || `Room #${booking.roomId}`}
                </div>
                <div className="flex items-center gap-2 text-[13px] text-slate-600">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  {formatDate(booking.checkInDate, isID ? 'ID' : 'EN')} → {formatDate(booking.checkOutDate, isID ? 'ID' : 'EN')}
                </div>
                <div className="flex items-center gap-2 text-[12px]">
                  <span className={`px-2 py-0.5 rounded-full font-semibold ${
                    booking.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {isID ? 'Pembayaran' : 'Payment'}: {booking.paymentStatus}
                  </span>
                </div>
              </div>

              <section className="rounded-2xl border border-slate-100 bg-white p-4 space-y-3" aria-labelledby="front-desk-payment-title">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                      <CreditCard className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <h2 id="front-desk-payment-title" className="text-sm font-semibold text-slate-900">
                        {isID ? 'Pembayaran reservasi' : 'Booking payment'}
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {payment?.paymentCode || (isID ? 'Belum ada transaksi pembayaran' : 'No payment transaction yet')}
                      </p>
                    </div>
                  </div>
                  {payment && (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-700">
                      {payment.status}
                    </span>
                  )}
                </div>

                {paymentLoading ? (
                  <p className="min-h-11 flex items-center gap-2 text-xs text-slate-500"><Loader2 className="w-4 h-4 animate-spin" />{isID ? 'Memuat pembayaran...' : 'Loading payment...'}</p>
                ) : payment ? (
                  <>
                    <dl className="grid grid-cols-2 gap-3 text-xs">
                      <div><dt className="text-slate-400">Total</dt><dd className="font-semibold text-slate-900 mt-1">{formatCurrency(payment.amount)}</dd></div>
                      <div><dt className="text-slate-400">{isID ? 'Metode' : 'Method'}</dt><dd className="font-medium text-slate-700 mt-1">{payment.paymentMethod || '—'}</dd></div>
                    </dl>

                    {!paymentAction && (canCancelPayment || canRefundPayment) && (
                      <div className="flex flex-wrap gap-2">
                        {canCancelPayment && (
                          <button type="button" onClick={() => setPaymentAction('CANCEL')} className="min-h-11 px-4 rounded-xl border border-rose-200 text-rose-700 text-xs font-semibold inline-flex items-center gap-2 hover:bg-rose-50">
                            <Ban className="w-4 h-4" />{isID ? 'Batalkan pembayaran' : 'Cancel payment'}
                          </button>
                        )}
                        {canRefundPayment && (
                          <button type="button" onClick={() => setPaymentAction('REFUND')} className="min-h-11 px-4 rounded-xl border border-amber-200 text-amber-800 text-xs font-semibold inline-flex items-center gap-2 hover:bg-amber-50">
                            <Undo2 className="w-4 h-4" />Refund
                          </button>
                        )}
                      </div>
                    )}

                    {paymentAction && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-3">
                        <p className="text-xs font-medium text-amber-900">
                          {paymentAction === 'CANCEL'
                            ? (isID ? 'Konfirmasi pembatalan transaksi yang belum selesai.' : 'Confirm cancellation of this unsettled transaction.')
                            : (isID ? 'Konfirmasi refund penuh. Tindakan ini tidak dapat dibatalkan.' : 'Confirm the full refund. This action cannot be undone.')}
                        </p>
                        {paymentAction === 'REFUND' && (
                          <label className="block space-y-1.5 text-xs font-medium text-slate-700">
                            <span>{isID ? 'Alasan refund (opsional)' : 'Refund reason (optional)'}</span>
                            <textarea value={refundReason} onChange={(event) => setRefundReason(event.target.value)} rows={2} maxLength={500} className="w-full rounded-xl border border-amber-200 bg-white p-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-amber-300" />
                          </label>
                        )}
                        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                          <button type="button" onClick={() => { setPaymentAction(null); setRefundReason(''); }} disabled={paymentActionLoading} className="min-h-11 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold disabled:opacity-50">{isID ? 'Kembali' : 'Back'}</button>
                          <button type="button" onClick={() => { void handlePaymentAction(); }} disabled={paymentActionLoading} className="min-h-11 px-4 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50">
                            {paymentActionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {paymentAction === 'CANCEL' ? (isID ? 'Ya, batalkan' : 'Yes, cancel') : (isID ? 'Proses refund' : 'Process refund')}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-slate-500">{isID ? 'Tidak ada transaksi pembayaran untuk booking ini.' : 'There is no payment transaction for this booking.'}</p>
                )}

                {paymentError && <p role="alert" className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs text-rose-700">{paymentError}</p>}
              </section>

              {isCheckedIn ? (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-100 text-teal-800 text-[12.5px] font-medium flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    {isID
                      ? 'Tamu sedang menginap. Selesaikan check-out untuk menutup reservasi dan menandai kamar perlu dibersihkan.'
                      : 'The guest is currently checked in. Complete checkout to close the stay and mark the room for cleaning.'}
                  </div>
                  {checkInError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-[12px] font-medium flex items-start gap-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      {checkInError}
                    </div>
                  )}
                  <button
                    onClick={handleCheckOut}
                    disabled={checkInLoading}
                    className="w-full min-h-11 py-3.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-[13px] font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    {checkInLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                    {isID ? 'Konfirmasi Check-Out' : 'Confirm Check-Out'}
                  </button>
                </div>
              ) : isIneligible ? (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-[12.5px] font-medium flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {isID
                    ? `Booking ini berstatus ${booking.status} dan tidak bisa di-check-in.`
                    : `This booking is ${booking.status} and cannot be checked in.`}
                </div>
              ) : (
                <>
                  {/* Room unit picker */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                      {isID ? 'Pilih Kamar Fisik' : 'Assign Physical Room'}
                    </label>
                    {unitsLoading ? (
                      <div className="flex items-center gap-2 text-[13px] text-slate-400 py-3">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {isID ? 'Memuat kamar tersedia...' : 'Loading available rooms...'}
                      </div>
                    ) : units.length === 0 ? (
                      <p className="text-[13px] text-rose-600 font-medium py-1">
                        {isID ? 'Tidak ada kamar fisik yang tersedia untuk tipe ini.' : 'No available physical room for this room type.'}
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {units.map((unit) => (
                          <button
                            key={unit.id}
                            onClick={() => setSelectedUnitId(unit.id)}
                            className={`py-2.5 rounded-xl text-[13px] font-semibold border transition-colors ${
                              selectedUnitId === unit.id
                                ? 'bg-slate-900 border-slate-900 text-white'
                                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
                            }`}
                          >
                            {unit.roomNumber}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {checkInError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-[12px] font-medium flex items-start gap-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      {checkInError}
                    </div>
                  )}

                  <button
                    onClick={handleCheckIn}
                    disabled={!selectedUnitId || checkInLoading}
                    className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    {checkInLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    {isID ? 'Konfirmasi Check-In' : 'Confirm Check-In'}
                  </button>
                </>
              )}

              <button
                onClick={resetSearch}
                className="w-full text-[12px] text-slate-400 hover:text-slate-600 font-medium transition-colors"
              >
                {isID ? 'Batal, cari lagi' : 'Cancel, search again'}
              </button>
            </motion.div>
          ) : (
            <>
              <form onSubmit={handleLookupSubmit} className="flex gap-2 max-w-sm mx-auto">
                <input
                  autoFocus
                  type="text"
                  value={bookingCode}
                  onChange={(e) => setBookingCode(e.target.value)}
                  placeholder={isID ? 'Kode booking, mis. BK-20260810-...' : 'Booking code, e.g. BK-20260810-...'}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-[13px] font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
                <button
                  type="submit"
                  disabled={!bookingCode.trim() || lookupLoading}
                  className="px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold transition-colors disabled:opacity-40"
                >
                  {lookupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isID ? 'Cari' : 'Find')}
                </button>
              </form>

              {lookupError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-[12.5px] font-medium flex items-start gap-2 max-w-sm mx-auto">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {lookupError}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
