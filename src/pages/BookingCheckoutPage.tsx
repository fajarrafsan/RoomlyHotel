import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2, SearchX } from 'lucide-react';
import { Booking, Hotel, Language, RoomType } from '../types';
import { calculateNights } from '../lib/utils';
import { bookingApi } from '../api/bookings';
import { hotelApi } from '../api/hotels';
import { paymentApi } from '../api/payments';
import { roomApi } from '../api/rooms';
import { mapBookingToUI, mapHotelToUI, mapRoomToUI } from '../lib/adapters';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/http';
import { BookingResponse } from '../types/api/booking';
import { CreatePaymentResponse, PaymentResponse } from '../types/api/payment';
import { BookingWizardHeader } from '../components/booking/BookingWizardHeader';
import { BookingFooter } from '../components/booking/BookingFooter';
import {
  PaymentDisplayStatus, PaymentStatusScreen,
} from '../components/booking/PaymentStatusScreen';
import { DatesGuestsStep } from '../components/booking/steps/DatesGuestsStep';
import { GuestDetailsStep } from '../components/booking/steps/GuestDetailsStep';
import { ReviewPayStep } from '../components/booking/steps/ReviewPayStep';

interface BookingCheckoutPageProps {
  hotels: Hotel[];
  onCompleteBooking: (newBooking: Booking) => void;
  onBookingStatusChanged: () => void | Promise<void>;
  language: Language;
}

const TERMINAL_STATUSES = new Set<PaymentDisplayStatus>([
  'PAID', 'FAILED', 'EXPIRED', 'CANCELLED', 'REFUNDED',
]);
const CLEAR_PERSISTED_STATUSES = new Set<PaymentDisplayStatus>([
  'PAID', 'EXPIRED', 'CANCELLED', 'REFUNDED',
]);
const POLL_INTERVAL_MS = 4000;
const MAX_AUTO_POLLS = 45; // ~3 minutes before manual-only checks
const PENDING_PAYMENT_STORAGE_VERSION = 1;
const PAYABLE_BOOKING_STATUSES = new Set(['PENDING', 'WAITING_PAYMENT', 'CONFIRMED']);
const PAYABLE_BOOKING_PAYMENT_STATUSES = new Set(['UNPAID', 'PENDING', 'FAILED']);

interface PendingPayment {
  booking: BookingResponse;
  paymentId: number | null;
  redirectUrl: string | null;
}

interface PersistedPendingPayment {
  version: number;
  bookingId: number;
  hotelId: number;
  roomId: number;
}

const pendingPaymentStorageKey = (userId: number, hotelId: string, roomId: string) =>
  `roomly_pending_payment:${userId}:${hotelId}:${roomId}`;

const bookingCanAcceptPayment = (booking: BookingResponse) =>
  PAYABLE_BOOKING_STATUSES.has(booking.status)
  && PAYABLE_BOOKING_PAYMENT_STATUSES.has(booking.paymentStatus);

const isPersistedPendingPayment = (value: unknown): value is PersistedPendingPayment => {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<PersistedPendingPayment>;
  return item.version === PENDING_PAYMENT_STORAGE_VERSION
    && typeof item.bookingId === 'number'
    && Number.isInteger(item.bookingId)
    && item.bookingId > 0
    && typeof item.hotelId === 'number'
    && typeof item.roomId === 'number';
};

const fromCreatedPayment = (
  booking: BookingResponse,
  payment: CreatePaymentResponse,
): PendingPayment => ({
  booking,
  paymentId: payment.paymentId,
  redirectUrl: payment.redirectUrl,
});

const fromExistingPayment = (
  booking: BookingResponse,
  payment: PaymentResponse,
): PendingPayment => ({
  booking,
  paymentId: payment.id,
  redirectUrl: payment.redirectUrl,
});

export const BookingCheckoutPage: React.FC<BookingCheckoutPageProps> = ({
  hotels,
  onCompleteBooking,
  onBookingStatusChanged,
  language,
}) => {
  const isID = language === 'ID';
  const { user, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const { hotelId, roomId } = useParams<{ hotelId: string; roomId: string }>();
  const [searchParams] = useSearchParams();
  const resumeBookingId = Number(searchParams.get('resumeBookingId'));

  const catalogHotel = hotels.find((h) => h.id === hotelId);
  const catalogRoom = catalogHotel?.rooms.find((r) => r.id === roomId);
  const [resolvedHotel, setResolvedHotel] = useState<Hotel | null>(null);
  const [resolvedRoom, setResolvedRoom] = useState<RoomType | null>(null);
  const [isResolvingStay, setIsResolvingStay] = useState(true);
  const hotel = resolvedHotel;
  const selectedRoom = resolvedRoom;
  const storageKey = user && hotelId && roomId
    ? pendingPaymentStorageKey(user.userId, hotelId, roomId)
    : null;

  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  const [guestName, setGuestName] = useState(user?.fullName || '');
  const [guestEmail, setGuestEmail] = useState(user?.email || '');
  const [guestPhone, setGuestPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentDisplayStatus>('PENDING');
  const [isChecking, setIsChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [autoPollingStopped, setAutoPollingStopped] = useState(false);
  const [isRestoringPayment, setIsRestoringPayment] = useState(true);
  const [recoveryFailed, setRecoveryFailed] = useState(false);
  const [recoveryNotice, setRecoveryNotice] = useState<string | null>(null);
  const [restoreAttempt, setRestoreAttempt] = useState(0);
  const pollCountRef = useRef(0);
  const pollInFlightRef = useRef(false);
  const refreshedTerminalStateRef = useRef<string | null>(null);

  // Catalog search is capped, so a deep-linked hotel/room may be missing from
  // `hotels`. Resolve from the API by ID so checkout URLs stay shareable.
  useEffect(() => {
    if (!hotelId || !roomId) {
      setResolvedHotel(null);
      setResolvedRoom(null);
      setIsResolvingStay(false);
      return;
    }

    if (catalogHotel && catalogRoom) {
      setResolvedHotel(catalogHotel);
      setResolvedRoom(catalogRoom);
      setIsResolvingStay(false);
      return;
    }

    const hotelNum = Number(hotelId);
    const roomNum = Number(roomId);
    if (!Number.isInteger(hotelNum) || !Number.isInteger(roomNum) || hotelNum <= 0 || roomNum <= 0) {
      setResolvedHotel(null);
      setResolvedRoom(null);
      setIsResolvingStay(false);
      return;
    }

    let cancelled = false;
    setIsResolvingStay(true);

    const resolve = async () => {
      try {
        const [hotelRes, roomRes, images] = await Promise.all([
          hotelApi.getById(hotelNum),
          roomApi.getById(roomNum),
          roomApi.images(roomNum).catch(() => []),
        ]);
        if (cancelled) return;
        if (roomRes.hotelId !== hotelNum) {
          setResolvedHotel(null);
          setResolvedRoom(null);
          return;
        }
        const mappedHotel = mapHotelToUI(hotelRes, { pricePerNight: roomRes.basePrice });
        const mappedRoom = mapRoomToUI(roomRes, images);
        setResolvedHotel(mappedHotel);
        setResolvedRoom(mappedRoom);
      } catch (err) {
        console.error('Failed to resolve checkout hotel/room', err);
        if (!cancelled) {
          setResolvedHotel(null);
          setResolvedRoom(null);
        }
      } finally {
        if (!cancelled) setIsResolvingStay(false);
      }
    };

    void resolve();
    return () => { cancelled = true; };
  }, [catalogHotel, catalogRoom, hotelId, roomId]);

  const adoptExistingPayment = useCallback((booking: BookingResponse, payment: PaymentResponse) => {
    setPendingPayment(fromExistingPayment(booking, payment));
    setPaymentStatus(payment.status);
    setCheckError(null);
    setAutoPollingStopped(false);
    pollCountRef.current = 0;
  }, []);

  const createPaymentSession = useCallback(async (booking: BookingResponse) => {
    if (!user) throw new Error(isID ? 'Sesi pengguna tidak tersedia.' : 'User session is unavailable.');

    const primaryGuest = booking.guests.find((guest) => guest.isPrimaryGuest) || booking.guests[0];
    const payment = await paymentApi.create({
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      userId: user.userId,
      hotelId: booking.hotelId,
      roomId: booking.roomId,
      amount: booking.totalAmount,
      currency: booking.currency,
      customerName: primaryGuest?.fullName || user.fullName,
      customerEmail: primaryGuest?.email || user.email,
      customerPhone: primaryGuest?.phone || '',
    });

    setPendingPayment(fromCreatedPayment(booking, payment));
    setPaymentStatus(payment.status);
    setCheckError(null);
    setAutoPollingStopped(false);
    pollCountRef.current = 0;
    if (payment.redirectUrl) window.open(payment.redirectUrl, '_blank', 'noopener,noreferrer');
  }, [isID, user]);

  const checkPaymentStatus = useCallback(async (paymentId: number) => {
    if (pollInFlightRef.current) return null;

    pollInFlightRef.current = true;
    setIsChecking(true);
    setCheckError(null);
    try {
      const result = await paymentApi.syncStatus(paymentId);
      setPaymentStatus(result.status);
      setPendingPayment((current) => current?.paymentId === paymentId
        ? { ...current, redirectUrl: result.redirectUrl || current.redirectUrl }
        : current);
      return result.status;
    } catch (err) {
      console.error('Failed to sync payment status', err);
      setCheckError(isID ? 'Gagal memeriksa status. Coba lagi.' : 'Failed to check status. Please try again.');
      return null;
    } finally {
      pollInFlightRef.current = false;
      setIsChecking(false);
    }
  }, [isID]);

  // Restore a booking/payment after refresh or after returning to this checkout.
  // The browser only stores identifiers; totals and nightly rates are fetched
  // again from the server so the UI never treats cached estimates as final.
  useEffect(() => {
    if (isAuthLoading) return;
    if (!storageKey || !user || !hotelId || !roomId) {
      setIsRestoringPayment(false);
      return;
    }

    setIsRestoringPayment(true);
    setRecoveryFailed(false);
    setRecoveryNotice(null);
    setPendingPayment(null);
    setCheckError(null);

    let saved: PersistedPendingPayment;
    const raw = localStorage.getItem(storageKey);
    if (Number.isInteger(resumeBookingId) && resumeBookingId > 0) {
      saved = {
        version: PENDING_PAYMENT_STORAGE_VERSION,
        bookingId: resumeBookingId,
        hotelId: Number(hotelId),
        roomId: Number(roomId),
      };
    } else if (raw) {
      try {
        const parsed: unknown = JSON.parse(raw);
        if (!isPersistedPendingPayment(parsed)) throw new Error('Invalid saved payment');
        saved = parsed;
      } catch {
        localStorage.removeItem(storageKey);
        setIsRestoringPayment(false);
        return;
      }
    } else {
      setIsRestoringPayment(false);
      return;
    }

    let cancelled = false;
    const restore = async () => {
      try {
        const booking = await bookingApi.getById(saved.bookingId);
        if (
          booking.userId !== user.userId
          || String(booking.hotelId) !== hotelId
          || String(booking.roomId) !== roomId
        ) {
          localStorage.removeItem(storageKey);
          return;
        }

        try {
          const payment = await paymentApi.getByBookingId(booking.id);
          if (!cancelled) {
            if (payment.status === 'FAILED' && bookingCanAcceptPayment(booking)) {
              setPendingPayment({ booking, paymentId: null, redirectUrl: null });
              setPaymentStatus('NOT_CREATED');
              setCheckError(isID
                ? 'Upaya pembayaran sebelumnya gagal. Roomly dapat membuat sesi baru dengan aman.'
                : 'The previous payment attempt failed. Roomly can safely create a new session.');
            } else if (!bookingCanAcceptPayment(booking) && !['PAID', 'REFUNDED'].includes(payment.status)) {
              localStorage.removeItem(storageKey);
              setRecoveryNotice(isID
                ? 'Reservasi sebelumnya sudah tidak dapat dibayar. Anda dapat memulai reservasi baru; detail lama tetap tersedia di Pesanan Saya.'
                : 'The previous booking can no longer accept payment. You can start a new booking; its details remain in My Bookings.');
            } else {
              adoptExistingPayment(booking, payment);
            }
          }
        } catch (err) {
          if (cancelled) return;
          if (err instanceof ApiError && err.status === 404) {
            if (bookingCanAcceptPayment(booking)) {
              setPendingPayment({ booking, paymentId: null, redirectUrl: null });
              setPaymentStatus('NOT_CREATED');
              setCheckError(null);
            } else {
              localStorage.removeItem(storageKey);
              setRecoveryNotice(isID
                ? 'Reservasi sebelumnya sudah ditutup dan tidak dapat menerima pembayaran baru.'
                : 'The previous booking is closed and cannot accept a new payment.');
            }
          } else {
            // A forbidden/unavailable lookup is an unknown recovery state, not
            // proof that a payment is still pending. Do not start sync polling.
            throw err;
          }
        }
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          localStorage.removeItem(storageKey);
          setRecoveryNotice(isID
            ? 'Reservasi tersimpan sebelumnya sudah tidak ditemukan. Anda dapat memulai reservasi baru.'
            : 'The previously saved booking no longer exists. You can start a new booking.');
          setCheckError(null);
        } else {
          console.error('Failed to restore pending payment', err);
          setRecoveryFailed(true);
          setCheckError(err instanceof ApiError
            ? err.message
            : (isID ? 'Server belum dapat memulihkan progres pembayaran.' : 'The server could not restore payment progress.'));
        }
      } finally {
        if (!cancelled) setIsRestoringPayment(false);
      }
    };

    restore();
    return () => { cancelled = true; };
  }, [adoptExistingPayment, hotelId, isAuthLoading, isID, restoreAttempt, resumeBookingId, roomId, storageKey, user]);

  // Keep the resumable pointer while a payment is unfinished. Settled/closed
  // states are removed so a future visit starts a genuinely new checkout.
  useEffect(() => {
    if (!storageKey || !pendingPayment) return;
    if (CLEAR_PERSISTED_STATUSES.has(paymentStatus)) {
      localStorage.removeItem(storageKey);
      return;
    }

    const saved: PersistedPendingPayment = {
      version: PENDING_PAYMENT_STORAGE_VERSION,
      bookingId: pendingPayment.booking.id,
      hotelId: pendingPayment.booking.hotelId,
      roomId: pendingPayment.booking.roomId,
    };
    localStorage.setItem(storageKey, JSON.stringify(saved));
  }, [paymentStatus, pendingPayment, storageKey]);

  // payment-service synchronizes terminal states back to booking-service. Pull
  // that authoritative booking immediately so My Bookings does not stay stale
  // until a page reload (the periodic refresh remains a safety net).
  useEffect(() => {
    const bookingId = pendingPayment?.booking.id;
    if (!bookingId || !TERMINAL_STATUSES.has(paymentStatus)) return;

    const refreshKey = `${bookingId}:${paymentStatus}`;
    if (refreshedTerminalStateRef.current === refreshKey) return;
    refreshedTerminalStateRef.current = refreshKey;
    Promise.resolve(onBookingStatusChanged()).catch((err) => {
      console.error('Failed to refresh booking after payment status change', err);
    });
  }, [onBookingStatusChanged, paymentStatus, pendingPayment?.booking.id]);

  // Recursive polling schedules the next check after the previous one finishes,
  // so it keeps repeating without overlapping requests.
  useEffect(() => {
    const paymentId = pendingPayment?.paymentId;
    if (!paymentId || TERMINAL_STATUSES.has(paymentStatus)) return;

    let cancelled = false;
    let timer: number | undefined;

    const poll = async () => {
      if (cancelled) return;
      if (pollCountRef.current >= MAX_AUTO_POLLS) {
        setAutoPollingStopped(true);
        return;
      }

      pollCountRef.current += 1;
      const nextStatus = await checkPaymentStatus(paymentId);
      if (cancelled || (nextStatus && TERMINAL_STATUSES.has(nextStatus))) return;

      if (pollCountRef.current >= MAX_AUTO_POLLS) {
        setAutoPollingStopped(true);
        return;
      }
      timer = window.setTimeout(poll, POLL_INTERVAL_MS);
    };

    timer = window.setTimeout(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [checkPaymentStatus, paymentStatus, pendingPayment?.paymentId]);

  const retryPayment = async () => {
    if (!pendingPayment) return;
    setIsChecking(true);
    setCheckError(null);
    try {
      const booking = await bookingApi.getById(pendingPayment.booking.id);
      try {
        const existing = await paymentApi.getByBookingId(booking.id);
        if (existing.status === 'FAILED') {
          if (!bookingCanAcceptPayment(booking)) {
            if (storageKey) localStorage.removeItem(storageKey);
            setPendingPayment(null);
            setRecoveryNotice(isID
              ? 'Reservasi ini sudah tidak dapat menerima pembayaran baru.'
              : 'This booking can no longer accept a new payment.');
            return;
          }
          // payment-service replaces a FAILED attempt for the same booking;
          // all other existing statuses are resumed instead of duplicated.
          await createPaymentSession(booking);
        } else {
          adoptExistingPayment(booking, existing);
          if (existing.redirectUrl && existing.status === 'PENDING') {
            window.open(existing.redirectUrl, '_blank', 'noopener,noreferrer');
          }
        }
      } catch (err) {
        if (!(err instanceof ApiError) || err.status !== 404) throw err;
        if (!bookingCanAcceptPayment(booking)) {
          if (storageKey) localStorage.removeItem(storageKey);
          setPendingPayment(null);
          setRecoveryNotice(isID
            ? 'Reservasi ini sudah tidak dapat menerima pembayaran baru.'
            : 'This booking can no longer accept a new payment.');
          return;
        }
        await createPaymentSession(booking);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        if (storageKey) localStorage.removeItem(storageKey);
        setPendingPayment(null);
        setRecoveryNotice(isID
          ? 'Reservasi atau pembayaran sebelumnya sudah tidak ditemukan. Anda dapat memulai lagi.'
          : 'The previous booking or payment no longer exists. You can start again.');
      } else {
        console.error('Failed to resume payment', err);
        setCheckError(err instanceof ApiError
          ? err.message
          : (isID ? 'Gagal memulihkan pembayaran. Coba lagi.' : 'Failed to resume payment. Please try again.'));
      }
    } finally {
      setIsChecking(false);
    }
  };

  if (pendingPayment) {
    return (
      <PaymentStatusScreen
        isID={isID}
        paymentStatus={paymentStatus}
        redirectUrl={pendingPayment.redirectUrl}
        booking={pendingPayment.booking}
        isChecking={isChecking}
        autoPollingStopped={autoPollingStopped}
        checkError={checkError}
        onCheck={pendingPayment.paymentId
          ? () => { void checkPaymentStatus(pendingPayment.paymentId as number); }
          : undefined}
        onRetry={paymentStatus === 'NOT_CREATED' || paymentStatus === 'FAILED'
          ? () => { void retryPayment(); }
          : undefined}
        onReopen={pendingPayment.redirectUrl
          ? () => window.open(pendingPayment.redirectUrl as string, '_blank', 'noopener,noreferrer')
          : undefined}
        onDone={() => navigate('/bookings')}
      />
    );
  }

  if (isRestoringPayment) {
    return (
      <div className="booking-checkout min-h-[60vh] flex flex-col items-center justify-center gap-3 text-[14px] text-slate-600">
        <Loader2 className="w-6 h-6 text-navy animate-spin" aria-hidden />
        {isID ? 'Memulihkan progres pembayaran...' : 'Restoring payment progress...'}
      </div>
    );
  }

  if (recoveryFailed) {
    return (
      <PaymentStatusScreen
        isID={isID}
        paymentStatus="RECOVERY_FAILED"
        redirectUrl={null}
        isChecking={isRestoringPayment}
        checkError={checkError}
        onRetry={() => setRestoreAttempt((current) => current + 1)}
        onDone={() => navigate('/bookings')}
      />
    );
  }

  if (isResolvingStay) {
    return (
      <div className="booking-checkout min-h-[60vh] flex flex-col items-center justify-center gap-3 text-[14px] text-slate-600">
        <Loader2 className="w-6 h-6 text-navy animate-spin" aria-hidden />
        {isID ? 'Menyiapkan reservasi...' : 'Preparing your reservation...'}
      </div>
    );
  }

  if (!hotel || !selectedRoom) {
    return (
      <div className="booking-checkout min-h-[60vh] flex flex-col items-center justify-center text-center gap-5 py-20">
        <div className="w-16 h-16 rounded-full bg-navy-soft text-navy flex items-center justify-center">
          <SearchX className="w-7 h-7" aria-hidden />
        </div>
        <div>
          <h2 className="font-serif text-2xl text-navy tracking-tight">
            {isID ? 'Kamar tidak ditemukan' : 'Room not found'}
          </h2>
          <p className="text-[14px] text-slate-600 mt-2 leading-relaxed max-w-xs mx-auto">
            {isID
              ? 'Tautan reservasi ini tidak valid atau kamar sudah tidak tersedia.'
              : 'This booking link is invalid or the room is no longer available.'}
          </p>
        </div>
        <Link
          to="/explore"
          className="inline-flex items-center gap-2 min-h-11 px-5 rounded-xl bg-gold hover:bg-gold-dark text-white text-[14px] font-semibold transition-colors duration-200"
        >
          {isID ? 'Kembali ke Explore' : 'Back to Explore'}
        </Link>
      </div>
    );
  }

  const nights = calculateNights(checkIn, checkOut);
  const estimatedTotal = selectedRoom.pricePerNight * nights;
  const canProceed = step === 1 ? Boolean(checkIn && checkOut) : true;

  const handleFinalSubmit = async () => {
    if (!user) return;
    setError(null);
    setRecoveryNotice(null);
    setIsSubmitting(true);
    try {
      const created = await bookingApi.create({
        userId: user.userId,
        roomId: Number(selectedRoom.id),
        checkInDate: checkIn,
        checkOutDate: checkOut,
        adultCount: adults,
        childCount: children,
        guests: [
          { fullName: guestName, email: guestEmail, phone: guestPhone, isPrimaryGuest: true },
        ],
        specialRequest: specialRequests || undefined,
      });

      const uiBooking = mapBookingToUI(created, {
        hotelImage: hotel.image,
        hotelLocation: hotel.location,
        hotelAddress: hotel.address,
        roomSize: selectedRoom.size,
        bedType: selectedRoom.bedType,
      });
      onCompleteBooking(uiBooking);

      try {
        await createPaymentSession(created);
      } catch (paymentErr) {
        console.error('Payment session could not be created', paymentErr);
        setPendingPayment({ booking: created, paymentId: null, redirectUrl: null });
        setPaymentStatus('NOT_CREATED');
        setCheckError(paymentErr instanceof ApiError
          ? paymentErr.message
          : (isID
              ? 'Reservasi berhasil dibuat, tetapi sesi pembayaran belum tersedia.'
              : 'The booking was created, but the payment session is not available yet.'));
      }
    } catch (err) {
      if (err instanceof ApiError) {
        const fieldErrors = err.body?.errors ? Object.values(err.body.errors).join(', ') : null;
        setError(fieldErrors || err.message);
      } else {
        setError(isID ? 'Gagal membuat reservasi. Coba lagi.' : 'Failed to create the booking. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="booking-checkout max-w-3xl mx-auto pb-12">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="group inline-flex items-center gap-2 min-h-11 text-[13px] font-medium text-slate-600 hover:text-navy transition-colors duration-200 cursor-pointer mb-4"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden />
        {isID ? 'Kembali' : 'Back'}
      </button>

      {recoveryNotice && (
        <div className="mb-4 p-3.5 rounded-2xl bg-gold-soft border border-gold-light/50 text-gold-dark text-[13px] leading-relaxed">
          {recoveryNotice}
        </div>
      )}

      <div className="bg-white rounded-3xl border border-navy-soft overflow-hidden" style={{ boxShadow: 'var(--home-shadow)' }}>
        <BookingWizardHeader
          isID={isID}
          hotelName={hotel.name}
          roomName={selectedRoom.name}
          step={step}
          onClose={() => navigate(-1)}
        />

        <div className="p-6 space-y-6">
          {step === 1 && (
            <DatesGuestsStep
              isID={isID}
              checkIn={checkIn}
              checkOut={checkOut}
              adults={adults}
              children={children}
              nights={nights}
              selectedRoom={selectedRoom}
              onCheckInChange={setCheckIn}
              onCheckOutChange={setCheckOut}
              onAdultsChange={setAdults}
              onChildrenChange={setChildren}
            />
          )}

          {step === 2 && (
            <GuestDetailsStep
              isID={isID}
              guestName={guestName}
              guestEmail={guestEmail}
              guestPhone={guestPhone}
              specialRequests={specialRequests}
              onGuestNameChange={setGuestName}
              onGuestEmailChange={setGuestEmail}
              onGuestPhoneChange={setGuestPhone}
              onSpecialRequestsChange={setSpecialRequests}
            />
          )}

          {step === 3 && (
            <ReviewPayStep
              isID={isID}
              nights={nights}
              estimatedTotal={estimatedTotal}
              roomName={selectedRoom.name}
              error={error}
            />
          )}
        </div>

        <BookingFooter
          isID={isID}
          step={step}
          isSubmitting={isSubmitting}
          canProceed={canProceed}
          onBack={() => setStep((step - 1) as 1 | 2 | 3)}
          onNext={() => setStep((step + 1) as 1 | 2 | 3)}
          onSubmit={handleFinalSubmit}
        />
      </div>
    </div>
  );
};
