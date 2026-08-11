import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Search, ShieldAlert, Loader2, AlertCircle, CheckCircle2,
  User, Building2, BedDouble, Calendar, RotateCcw, ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookingApi } from '../api/bookings';
import { roomApi } from '../api/rooms';
import { ApiError } from '../lib/http';
import { formatDate } from '../lib/utils';
import { BookingResponse, RoomUnitResponse } from '../types/api';
import { Language } from '../types';

interface CheckInPageProps {
  language: Language;
}

const INELIGIBLE_STATUSES = new Set(['CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'EXPIRED', 'NO_SHOW']);

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
  const [checkedInBooking, setCheckedInBooking] = useState<BookingResponse | null>(null);

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center gap-4 py-20">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{isID ? 'Akses Ditolak' : 'Access Denied'}</h2>
          <p className="text-sm text-slate-500 mt-1 max-w-sm">
            {isID
              ? 'Halaman check-in hanya untuk staf dengan akun ADMIN.'
              : 'The check-in page is only available to staff signed in with an ADMIN account.'}
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
    setCheckedInBooking(null);
    setBookingCode('');
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
    try {
      const found = await bookingApi.getByCode(code);
      setBooking(found);

      setUnitsLoading(true);
      try {
        const roomUnits = await roomApi.unitsByRoom(found.roomId);
        setUnits(roomUnits.filter((u) => u.status === 'AVAILABLE'));
      } catch (unitErr) {
        console.error('Failed to load room units', unitErr);
      } finally {
        setUnitsLoading(false);
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
      setCheckedInBooking(updated);
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

  const isIneligible = booking && INELIGIBLE_STATUSES.has(booking.status);

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
            {isID ? 'Check-In Tamu' : 'Guest Check-In'}
          </h1>
          <p className="text-xs sm:text-[13px] text-slate-300 mt-1 font-light leading-relaxed">
            {isID
              ? 'Masukkan kode booking tamu untuk mengambil data reservasinya.'
              : "Enter the guest's booking code to pull up their reservation."}
          </p>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {checkedInBooking ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4 py-6">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-slate-900">{isID ? 'Check-In Berhasil' : 'Check-In Successful'}</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  {checkedInBooking.bookingCode} · {isID ? 'Kamar' : 'Room'} {units.find((u) => u.id === selectedUnitId)?.roomNumber}
                </p>
              </div>
              <button
                onClick={resetSearch}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-[13px] font-semibold transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                {isID ? 'Check-In Tamu Berikutnya' : 'Check In Next Guest'}
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

              {isIneligible ? (
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
