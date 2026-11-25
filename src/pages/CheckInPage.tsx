import { useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, KeyRound, LoaderCircle, LogOut, RotateCcw, Search, ShieldAlert, Ticket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookingApi } from '../api/bookings';
import { paymentApi } from '../api/payments';
import { roomApi } from '../api/rooms';
import {
  FrontDeskNotice, PaymentPanel, ReservationCard, StayPanel,
  frontDeskCard, frontDeskPrimary, type PaymentAction,
} from '../components/staff/CheckInPanels';
import { ApiError } from '../lib/http';
import type { Language } from '../types';
import type { BookingResponse, PaymentResponse, RoomUnitResponse } from '../types/api';

const FRONT_DESK_ROLES = new Set(['ADMIN', 'RECEPTIONIST']);
const pageClass = 'front-desk mx-auto max-w-[1140px] pb-12 text-slate-900 sm:pb-16';

export function CheckInPage({ language }: { language: Language }) {
  const isID = language === 'ID';
  const { user, isLoading, sessionCheckError, retrySession } = useAuth();
  const navigate = useNavigate();

  const lookupVersion = useRef(0);
  const [bookingCode, setBookingCode] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [units, setUnits] = useState<RoomUnitResponse[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);

  const [stayLoading, setStayLoading] = useState(false);
  const [stayError, setStayError] = useState<string | null>(null);
  const [result, setResult] = useState<{ booking: BookingResponse; action: 'arrival' | 'departure'; roomNumber: string | null } | null>(null);

  const [payment, setPayment] = useState<PaymentResponse | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentAction, setPaymentAction] = useState<PaymentAction | null>(null);
  const [paymentActionLoading, setPaymentActionLoading] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const mutating = stayLoading || paymentActionLoading;

  if (!user || !FRONT_DESK_ROLES.has(user.role)) {
    return (
      <div className={pageClass + ' pt-4'}>
        <section className={frontDeskCard + ' mx-auto max-w-lg py-9 text-center'} aria-busy={isLoading}>
          <span className="mx-auto grid size-12 place-items-center rounded-xl bg-navy-soft text-navy">
            {isLoading ? <LoaderCircle className="size-5 motion-safe:animate-spin" aria-hidden /> : <ShieldAlert className="size-5" aria-hidden />}
          </span>
          <h1 className="mt-4 font-serif text-2xl leading-tight text-navy-dark">
            {isLoading
              ? (isID ? 'Memeriksa sesi staf…' : 'Checking staff session…')
              : sessionCheckError
                ? (isID ? 'Sesi belum dapat dimuat' : 'Could not load your session')
                : (isID ? 'Ruang kerja staf' : 'Staff workspace')}
          </h1>
          {!isLoading && (
            <>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600">
                {sessionCheckError
                  ? (isID ? 'Coba periksa kembali sesi Anda untuk melanjutkan.' : 'Try checking your session again to continue.')
                  : (isID ? 'Halaman check-in tersedia untuk admin dan resepsionis.' : 'The check-in page is available to administrators and receptionists.')}
              </p>
              {sessionCheckError ? (
                <button type="button" onClick={() => void retrySession()} className={frontDeskPrimary + ' mt-5'}>{isID ? 'Coba lagi' : 'Try again'}</button>
              ) : (
                <button type="button" onClick={() => navigate('/')} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-navy hover:underline">
                  <ArrowLeft className="size-4" aria-hidden />{isID ? 'Kembali ke beranda' : 'Back to home'}
                </button>
              )}
            </>
          )}
        </section>
      </div>
    );
  }

  const clearPaymentAction = (action: PaymentAction | null) => {
    setPaymentAction(action);
    setRefundReason('');
  };

  const resetSearch = () => {
    lookupVersion.current += 1;
    setBookingCode('');
    setBooking(null);
    setLookupLoading(false);
    setLookupError(null);
    setUnits([]);
    setUnitsLoading(false);
    setSelectedUnitId(null);
    setStayError(null);
    setResult(null);
    setPayment(null);
    setPaymentLoading(false);
    setPaymentError(null);
    clearPaymentAction(null);
  };

  const loadPayment = async (bookingId: number, version: number) => {
    setPaymentLoading(true);
    try {
      const found = await paymentApi.getByBookingId(bookingId);
      if (version === lookupVersion.current) setPayment(found);
    } catch (error) {
      if (version === lookupVersion.current && !(error instanceof ApiError && error.status === 404)) {
        setPaymentError(error instanceof ApiError
          ? error.message
          : (isID ? 'Data pembayaran tidak dapat dimuat.' : 'Payment details could not be loaded.'));
      }
    } finally {
      if (version === lookupVersion.current) setPaymentLoading(false);
    }
  };

  const loadRooms = async (roomId: number, version: number) => {
    setUnitsLoading(true);
    try {
      const found = await roomApi.unitsByRoom(roomId);
      if (version === lookupVersion.current) setUnits(found.filter((unit) => unit.status === 'AVAILABLE'));
    } catch {
      if (version === lookupVersion.current) setStayError(isID ? 'Daftar kamar gagal dimuat.' : 'Could not load available rooms.');
    } finally {
      if (version === lookupVersion.current) setUnitsLoading(false);
    }
  };

  const handleLookup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = bookingCode.trim();
    if (!code || lookupLoading) return;

    const version = ++lookupVersion.current;
    setLookupLoading(true);
    setLookupError(null);
    try {
      const found = await bookingApi.getByCode(code);
      if (version !== lookupVersion.current) return;
      setBooking(found);
      void loadPayment(found.id, version);
      if (found.status === 'CONFIRMED') void loadRooms(found.roomId, version);
    } catch (error) {
      if (version !== lookupVersion.current) return;
      if (error instanceof ApiError && error.status === 404) {
        setLookupError(isID ? 'Reservasi tidak ditemukan. Periksa kembali kode reservasi.' : 'Reservation not found. Check the reservation code and try again.');
      } else {
        setLookupError(error instanceof ApiError ? error.message : (isID ? 'Reservasi belum dapat dimuat. Coba lagi.' : 'Could not load the reservation. Try again.'));
      }
    } finally {
      if (version === lookupVersion.current) setLookupLoading(false);
    }
  };

  const confirmStay = async () => {
    if (!booking || mutating) return;
    const unit = units.find((candidate) => candidate.id === selectedUnitId);
    const action = booking.status === 'CHECKED_IN' ? 'departure' : 'arrival';
    const operation = action === 'departure'
      ? () => bookingApi.checkOut(booking.id)
      : booking.status === 'CONFIRMED' && unit
        ? () => bookingApi.checkIn(booking.id, unit.id)
        : null;
    if (!operation) return;
    setStayLoading(true);
    setStayError(null);
    try {
      const updated = await operation();
      setResult({
        booking: updated,
        action,
        roomNumber: action === 'arrival' ? unit?.roomNumber ?? null : null,
      });
    } catch (error) {
      setStayError(error instanceof ApiError
        ? error.message
        : (isID ? 'Tindakan gagal diproses. Silakan coba lagi.' : 'The action failed. Please try again.'));
    } finally {
      setStayLoading(false);
    }
  };

  const confirmPayment = async () => {
    if (!payment || !paymentAction || !booking || mutating) return;
    setPaymentActionLoading(true);
    setPaymentError(null);
    try {
      const updated = paymentAction === 'CANCEL'
        ? await paymentApi.cancel(payment.id)
        : await paymentApi.refund(payment.id, { reason: refundReason.trim() || undefined });
      setPayment(updated);
      clearPaymentAction(null);
      try {
        setBooking(await bookingApi.getByCode(booking.bookingCode));
      } catch {
        // The transaction result is available even when the booking status has not refreshed.
      }
    } catch (error) {
      setPaymentError(error instanceof ApiError
        ? error.message
        : (isID ? 'Transaksi gagal diproses. Silakan coba lagi.' : 'The transaction failed. Please try again.'));
    } finally {
      setPaymentActionLoading(false);
    }
  };

  return (
    <div className={pageClass}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4">
        <button type="button" onClick={() => navigate(-1)} disabled={mutating} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-slate-700 hover:bg-navy-soft hover:text-navy disabled:opacity-60">
          <ArrowLeft className="size-4" aria-hidden />{isID ? 'Kembali' : 'Back'}
        </button>
        {booking && !result && (
          <button type="button" onClick={resetSearch} disabled={mutating} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-navy hover:bg-navy-soft disabled:opacity-60">
            <RotateCcw className="size-4" aria-hidden />{isID ? 'Cari reservasi lain' : 'Find another reservation'}
          </button>
        )}
      </div>

      <header className="relative isolate overflow-hidden rounded-[24px] bg-[#101f3d] px-5 py-7 text-white sm:px-8 sm:py-9 lg:px-10 lg:py-11">
        <img src="/images/seed/hotels/tentrem.jpg" alt="" decoding="async" className="absolute inset-y-0 right-0 -z-20 hidden h-full w-[54%] object-cover object-[center_64%] opacity-70 sm:block" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#101f3d] via-[#101f3d]/90 to-[#101f3d]/15" aria-hidden />
        <div className="max-w-lg">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-gold-light">
            <span className="h-px w-5 bg-gold-light" aria-hidden />
            {isID ? 'Resepsionis' : 'Front desk'}
          </p>
          <h1 className="mt-2.5 font-serif text-[clamp(1.85rem,5vw,3.2rem)] leading-[1.1] tracking-tight">Check-in & check-out</h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-slate-100 sm:text-base">
            {isID ? 'Temukan reservasi dan catat kedatangan atau kepulangan tamu.' : 'Find a reservation and record a guest arrival or departure.'}
          </p>
        </div>
      </header>

      {result ? (
        <section className={frontDeskCard + ' mt-5 sm:mt-6'} aria-labelledby="reception-result">
          <div role="status" className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><CheckCircle2 className="size-6" aria-hidden /></span>
            <div className="min-w-0 flex-1">
              <h2 id="reception-result" className="font-serif text-2xl text-navy-dark">
                {result.action === 'arrival' ? (isID ? 'Check-in berhasil' : 'Check-in complete') : (isID ? 'Check-out berhasil' : 'Check-out complete')}
              </h2>
              <p className="mt-1 break-words text-sm text-slate-600">
                {result.booking.bookingCode}{result.roomNumber && ` · ${isID ? 'Kamar' : 'Room'} ${result.roomNumber}`}
              </p>
            </div>
            <button type="button" onClick={resetSearch} className={frontDeskPrimary + ' w-full sm:w-auto'}>
              {isID ? 'Proses tamu berikutnya' : 'Process next guest'}<ArrowRight className="size-4" aria-hidden />
            </button>
          </div>
        </section>
      ) : booking ? (
        <div className="mt-5 grid items-start gap-4 sm:mt-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          <ReservationCard booking={booking} language={language} />
          <div className="lg:col-start-2 lg:row-span-2">
            <StayPanel
              booking={booking} isID={isID} units={units} unitsLoading={unitsLoading} selectedRoom={selectedUnitId}
              onSelectRoom={setSelectedUnitId} error={stayError} submitting={stayLoading} blocked={paymentActionLoading}
              onConfirm={() => void confirmStay()}
            />
          </div>
          <PaymentPanel
            booking={booking} payment={payment} isID={isID} loading={paymentLoading} error={paymentError}
            action={paymentAction} submitting={paymentActionLoading} blocked={stayLoading}
            reason={refundReason} onReason={setRefundReason} onRequest={clearPaymentAction} onConfirm={() => void confirmPayment()}
          />
        </div>
      ) : (
        <div className="mt-5 grid items-start gap-4 sm:mt-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <section className={frontDeskCard} aria-labelledby="reception-search">
            <h2 id="reception-search" className="text-xl font-semibold text-navy-dark">{isID ? 'Cari reservasi' : 'Find a reservation'}</h2>
            <form onSubmit={handleLookup} className="mt-4" aria-busy={lookupLoading}>
              <label htmlFor="desk-booking-code" className="mb-1.5 block text-sm font-semibold text-slate-800">{isID ? 'Kode reservasi' : 'Reservation code'}</label>
              <div className="flex flex-col gap-2.5 sm:flex-row">
                <div className="relative min-w-0 flex-1">
                  <Ticket className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-600" aria-hidden />
                  <input
                    id="desk-booking-code" type="text" value={bookingCode} autoFocus autoComplete="off" autoCapitalize="characters" spellCheck={false}
                    onChange={(event) => { setBookingCode(event.target.value); setLookupError(null); }}
                    placeholder="BK-20261125-A2F73B61" disabled={lookupLoading} aria-invalid={!!lookupError} aria-describedby={lookupError ? 'desk-code-hint desk-code-error' : 'desk-code-hint'}
                    className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 py-2 pr-3 pl-10 font-mono text-base text-navy-dark placeholder:text-slate-500"
                  />
                </div>
                <button type="submit" disabled={lookupLoading || !bookingCode.trim()} className={frontDeskPrimary + ' shrink-0'}>
                  {lookupLoading ? <LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden /> : <Search className="size-4" aria-hidden />}
                  {lookupLoading ? (isID ? 'Mencari…' : 'Searching…') : (isID ? 'Cari' : 'Search')}
                </button>
              </div>
              <p id="desk-code-hint" className="mt-2 text-sm text-slate-600">{isID ? 'Gunakan kode yang tertera di konfirmasi reservasi tamu.' : 'Use the code shown on the guest’s reservation confirmation.'}</p>
              {lookupError && <div id="desk-code-error" className="mt-4"><FrontDeskNotice>{lookupError}</FrontDeskNotice></div>}
            </form>
          </section>

          <aside className="min-w-0 rounded-[22px] border border-slate-200 bg-navy-soft/45 p-5 sm:p-6" aria-labelledby="reception-guide">
            <h2 id="reception-guide" className="text-base font-semibold text-navy-dark">{isID ? 'Panduan resepsionis' : 'Front desk guide'}</h2>
            <dl className="mt-3 divide-y divide-slate-200">
              <div className="flex gap-3 pb-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-navy"><KeyRound className="size-4" aria-hidden /></span>
                <div><dt className="text-sm font-semibold text-navy-dark">Check-in</dt><dd className="mt-0.5 text-sm leading-5 text-slate-600">{isID ? 'Pilih kamar fisik yang tersedia untuk reservasi terkonfirmasi.' : 'Assign an available room to a confirmed reservation.'}</dd></div>
              </div>
              <div className="flex gap-3 pt-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-navy"><LogOut className="size-4" aria-hidden /></span>
                <div><dt className="text-sm font-semibold text-navy-dark">Check-out</dt><dd className="mt-0.5 text-sm leading-5 text-slate-600">{isID ? 'Tutup masa inap dan tandai kamar untuk dibersihkan.' : 'Close the stay and mark the room for cleaning.'}</dd></div>
              </div>
            </dl>
          </aside>
        </div>
      )}
    </div>
  );
}
