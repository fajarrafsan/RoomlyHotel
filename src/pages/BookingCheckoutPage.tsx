import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, SearchX } from 'lucide-react';
import { Booking, Hotel, Language, RoomType } from '../types';
import { calculateNights } from '../lib/utils';
import { bookingApi } from '../api/bookings';
import { hotelApi } from '../api/hotels';
import { paymentApi } from '../api/payments';
import { roomApi } from '../api/rooms';
import { mapBookingToUI, mapHotelToUI, mapRoomToUI } from '../lib/adapters';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/http';
import { BookingQuoteResponse, BookingResponse } from '../types/api/booking';
import { bookingHoldTime } from '../lib/bookingPresentation';
import { CreatePaymentResponse, PaymentResponse } from '../types/api/payment';
import { BookingWizardHeader } from '../components/booking/BookingWizardHeader';
import { BookingFooter } from '../components/booking/BookingFooter';
import { BookingSummary } from '../components/booking/BookingSummary';
import { BookingCheckoutSkeleton } from '../components/booking/BookingCheckoutSkeleton';
import { CheckoutLeaveDialog } from '../components/booking/CheckoutLeaveDialog';
import { useCheckoutLeaveGuard } from '../components/booking/useCheckoutLeaveGuard';
import {
  PaymentDisplayStatus, PaymentStatusScreen,
} from '../components/booking/PaymentStatusScreen';
import { CheckoutPaymentResult } from '../components/booking/PaymentResultDialog';
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

const normalizeGuestPhone = (value: string): string | null => {
  const trimmed = value.trim();
  const phone = trimmed.replace(/\s/g, '');
  return trimmed.startsWith('+62') && /^\+62[1-9]\d{7,12}$/.test(phone) ? phone : null;
};

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
  && PAYABLE_BOOKING_PAYMENT_STATUSES.has(booking.paymentStatus)
  && (!booking.holdExpiresAt || bookingHoldTime(booking.holdExpiresAt) > Date.now());

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

// A blank same-origin tab we can still navigate after the slow part finishes.
// `noopener` would make window.open return null, so the opener link is cut by
// hand before the tab ever leaves for Midtrans.
const openPaymentPlaceholder = (isID: boolean): Window | null => {
  const tab = window.open('', '_blank');
  if (!tab) return null;
  tab.opener = null;
  tab.document.title = 'Roomly';
  tab.document.body.style.fontFamily = 'system-ui, sans-serif';
  tab.document.body.textContent = isID ? 'Menyiapkan halaman pembayaran…' : 'Preparing the payment page…';
  return tab;
};

export const BookingCheckoutPage: React.FC<BookingCheckoutPageProps> = ({
  hotels,
  onCompleteBooking,
  onBookingStatusChanged,
  language,
}) => {
  const isID = language === 'ID';
  const { user, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const wizardRef = useRef<HTMLDivElement>(null);
  const { hotelId, roomId } = useParams<{ hotelId: string; roomId: string }>();
  const [searchParams] = useSearchParams();
  const resumeBookingId = Number(searchParams.get('resumeBookingId'));

  const catalogHotel = hotels.find((h) => h.id === hotelId);
  const catalogRoom = catalogHotel?.rooms.find((r) => r.id === roomId);
  const [resolvedHotel, setResolvedHotel] = useState<Hotel | null>(null);
  const [resolvedRoom, setResolvedRoom] = useState<RoomType | null>(null);
  const [roomPhoto, setRoomPhoto] = useState<{ id: string; url: string } | null>(null);
  const [isResolvingStay, setIsResolvingStay] = useState(true);
  const hotel = resolvedHotel;
  const selectedRoom = resolvedRoom;
  const resolvedRoomId = selectedRoom?.id;
  const catalogPhoto = selectedRoom?.images?.[0];
  const storageKey = user && hotelId && roomId
    ? pendingPaymentStorageKey(user.userId, hotelId, roomId)
    : null;

  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [quoteResult, setQuoteResult] = useState<{ key: string; quote: BookingQuoteResponse | null }>();
  const [quoteAttempt, setQuoteAttempt] = useState(0);
  const quoteKey = resolvedRoomId && resolvedRoomId === roomId && checkIn && checkOut
    ? `${resolvedRoomId}:${checkIn}:${checkOut}:${quoteAttempt}`
    : null;
  const currentQuote = quoteKey && quoteResult?.key === quoteKey ? quoteResult.quote : undefined;
  const retryQuote = () => setQuoteAttempt(attempt => attempt + 1);

  const [guestName, setGuestName] = useState(user?.fullName || '');
  const [guestEmail, setGuestEmail] = useState(user?.email || '');
  const [guestPhone, setGuestPhone] = useState('');
  const [showGuestPhoneError, setShowGuestPhoneError] = useState(false);
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
        const [hotelRes, roomRes] = await Promise.all([
          hotelApi.getById(hotelNum),
          roomApi.getById(roomNum),
        ]);
        if (cancelled) return;
        if (roomRes.hotelId !== hotelNum) {
          setResolvedHotel(null);
          setResolvedRoom(null);
          return;
        }
        const mappedHotel = mapHotelToUI(hotelRes, { pricePerNight: roomRes.basePrice });
        const mappedRoom = mapRoomToUI(roomRes);
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

  useEffect(() => {
    if (!resolvedRoomId || resolvedRoomId !== roomId || catalogPhoto) return;
    let active = true;
    void roomApi.images(Number(resolvedRoomId)).then(images => {
      const photo = images.filter(image => image.imageUrl).sort((a, b) =>
        Number(b.isPrimary) - Number(a.isPrimary) || (a.displayOrder ?? 0) - (b.displayOrder ?? 0))[0];
      if (active && photo) setRoomPhoto({ id: resolvedRoomId, url: photo.imageUrl });
    }).catch(() => undefined);
    return () => { active = false; };
  }, [catalogPhoto, resolvedRoomId, roomId]);

  useEffect(() => {
    if (!quoteKey) return;
    const controller = new AbortController();
    void bookingApi.quote({ roomId: Number(resolvedRoomId), checkInDate: checkIn, checkOutDate: checkOut }, controller.signal)
      .then(quote => {
        if (!controller.signal.aborted) setQuoteResult({ key: quoteKey, quote });
      })
      .catch(() => {
        if (!controller.signal.aborted) setQuoteResult({ key: quoteKey, quote: null });
      });
    return () => controller.abort();
  }, [quoteKey, resolvedRoomId, checkIn, checkOut]);

  const adoptExistingPayment = useCallback((booking: BookingResponse, payment: PaymentResponse) => {
    setPendingPayment(fromExistingPayment(booking, payment));
    setPaymentStatus(payment.status);
    setCheckError(null);
    setAutoPollingStopped(false);
    pollCountRef.current = 0;
  }, []);

  const createPaymentSession = useCallback(async (booking: BookingResponse, paymentTab: Window | null = null) => {
    if (!user) {
      paymentTab?.close();
      throw new Error(isID ? 'Sesi pengguna tidak tersedia.' : 'User session is unavailable.');
    }

    const primaryGuest = booking.guests.find((guest) => guest.isPrimaryGuest) || booking.guests[0];
    let payment: CreatePaymentResponse;
    try {
      payment = await paymentApi.create({
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
    } catch (err) {
      paymentTab?.close();
      throw err;
    }

    setPendingPayment(fromCreatedPayment(booking, payment));
    setPaymentStatus(payment.status);
    setCheckError(null);
    setAutoPollingStopped(false);
    pollCountRef.current = 0;
    if (!payment.redirectUrl) {
      paymentTab?.close();
    } else if (paymentTab && !paymentTab.closed) {
      paymentTab.location.href = payment.redirectUrl;
    } else {
      window.open(payment.redirectUrl, '_blank', 'noopener,noreferrer');
    }
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
          if (existing.redirectUrl && existing.status === 'PENDING' && bookingCanAcceptPayment(booking)) {
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

  // Nothing is saved until the booking exists, so leaving mid-way has to be a
  // deliberate choice. Only the form renders the confirmation, so the status and
  // error screens below must never hold a navigation back.
  const isFormOnScreen = !pendingPayment && !isRestoringPayment && !recoveryFailed && !isResolvingStay && Boolean(hotel && selectedRoom);
  const leaveGuard = useCheckoutLeaveGuard(
    isFormOnScreen && (isSubmitting || step > 1 || Boolean(checkIn)),
    '/',
    isSubmitting,
  );

  if (pendingPayment) {
    const showResult = paymentStatus !== 'PENDING' && paymentStatus !== 'NOT_CREATED' && paymentStatus !== 'RECOVERY_FAILED';
    return (
      <>
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
          onRetry={paymentStatus === 'NOT_CREATED' || (paymentStatus === 'FAILED' && bookingCanAcceptPayment(pendingPayment.booking))
            ? () => { void retryPayment(); }
            : undefined}
          onReopen={pendingPayment.redirectUrl
            ? () => {
              if (bookingCanAcceptPayment(pendingPayment.booking)) {
                window.open(pendingPayment.redirectUrl as string, '_blank', 'noopener,noreferrer');
              }
            }
            : undefined}
          onDone={() => navigate('/bookings')}
          onChooseDates={() => {
            if (storageKey) localStorage.removeItem(storageKey);
            setPendingPayment(null);
            setPaymentStatus('PENDING');
            setCheckError(null);
            setError(null);
            setCheckIn('');
            setCheckOut('');
            setQuoteResult(undefined);
            setStep(1);
            if (resumeBookingId) navigate(`/booking/${hotelId}/${roomId}`, { replace: true });
            window.scrollTo({ top: 0 });
          }}
        />
        {showResult && (
          <CheckoutPaymentResult
            key={`${pendingPayment.booking.id}:${paymentStatus}`}
            isID={isID}
            result={paymentStatus}
            summary={{
              bookingCode: pendingPayment.booking.bookingCode,
              amount: pendingPayment.booking.totalAmount,
              currency: pendingPayment.booking.currency,
            }}
            onViewBookings={() => navigate('/bookings', { replace: true })}
          />
        )}
      </>
    );
  }

  if (isRestoringPayment) {
    return <BookingCheckoutSkeleton isID={isID} message={isID ? 'Memulihkan progres pembayaran...' : 'Restoring payment progress...'} />;
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
    return <BookingCheckoutSkeleton isID={isID} message={isID ? 'Menyiapkan reservasi...' : 'Preparing your reservation...'} />;
  }

  if (!hotel || !selectedRoom) {
    return (
      <div className="booking-checkout flex min-h-[60vh] flex-col items-center justify-center gap-5 py-20 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-gold-soft/70 text-gold-dark">
          <SearchX className="size-7" aria-hidden />
        </div>
        <div>
          <h1 className="font-serif text-[26px] tracking-[-0.02em] text-navy-dark">
            {isID ? 'Kamar tidak ditemukan' : 'Room not found'}
          </h1>
          <p className="mx-auto mt-2 max-w-xs text-[15px] leading-6 text-slate-600">
            {isID
              ? 'Tautan reservasi ini tidak valid atau kamar sudah tidak tersedia.'
              : 'This booking link is invalid or the room is no longer available.'}
          </p>
        </div>
        <Link
          to="/explore"
          className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-gold px-6 text-sm font-semibold text-white transition-colors duration-200 hover:bg-gold-dark"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {isID ? 'Kembali ke Jelajahi' : 'Back to Explore'}
        </Link>
      </div>
    );
  }

  const nights = checkIn && checkOut ? calculateNights(checkIn, checkOut) : 0;
  const canProceed = step === 1 ? nights > 0 : step === 2 || Boolean(currentQuote);
  const normalizedGuestPhone = normalizeGuestPhone(guestPhone);

  const showInvalidGuestPhone = () => {
    setShowGuestPhoneError(true);
    setStep(2);
    requestAnimationFrame(() => wizardRef.current?.querySelector<HTMLInputElement>('#guest-phone')?.focus());
  };

  const handleFinalSubmit = async () => {
    if (!currentQuote || isSubmitting) return;
    if (!normalizedGuestPhone) {
      showInvalidGuestPhone();
      return;
    }
    if (!user) {
      setError(isID ? 'Kamu sudah keluar dari akun. Masuk lagi untuk menyelesaikan reservasi.' : 'You are signed out. Sign in again to complete this reservation.');
      return;
    }
    // Browsers allow a new tab only within the click that asked for it, and
    // creating the booking plus the Midtrans session can outlast that on a busy
    // machine, so the payment tab used to be silently blocked. Open it now and
    // point it at Midtrans once the session exists.
    const paymentTab = openPaymentPlaceholder(isID);
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
          { fullName: guestName, email: guestEmail, phone: normalizedGuestPhone, isPrimaryGuest: true },
        ],
        specialRequest: specialRequests || undefined,
        expectedTotalAmount: currentQuote.totalAmount,
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
        await createPaymentSession(created, paymentTab);
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
      paymentTab?.close();
      if (err instanceof ApiError) {
        if (err.status === 409 && err.body?.errors?.expectedTotalAmount === 'PRICE_CHANGED') {
          retryQuote();
          setError(isID ? 'Tarif berubah. Periksa total terbaru sebelum mengonfirmasi kembali.'
            : 'The rate has changed. Review the updated total before confirming again.');
        } else {
          const fieldErrors = err.body?.errors ? Object.values(err.body.errors).join(', ') : null;
          setError(fieldErrors || err.message);
        }
      } else {
        setError(isID ? 'Gagal membuat reservasi. Coba lagi.' : 'Failed to create the booking. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToStep = (next: 1 | 2 | 3) => {
    if (isSubmitting || next === step) return;
    if (next === 3 && !normalizedGuestPhone) {
      showInvalidGuestPhone();
      return;
    }
    setError(null);
    setStep(next);
    // On phones the next step would otherwise open scrolled to its bottom.
    requestAnimationFrame(() => {
      const wizard = wizardRef.current;
      wizard?.querySelector<HTMLHeadingElement>('[data-checkout-step-heading]')?.focus({ preventScroll: true });
      if (wizard && wizard.getBoundingClientRect().top < 84) wizard.scrollIntoView({ block: 'start' });
    });
  };

  return (
    <div className="booking-checkout mx-auto max-w-[1280px] pb-5 lg:pb-12" data-checkout-page>
      <header className="mb-4 sm:mb-6">
        <Link to={`/hotel/${hotel.id}/room/${selectedRoom.id}`}
          className="-ml-2 mb-1 inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-slate-700 hover:bg-navy-soft hover:text-navy-dark sm:mb-2">
          <ArrowLeft className="size-4" aria-hidden />{isID ? 'Detail kamar' : 'Room details'}
        </Link>
        <h1 id="checkout-heading" className="font-serif text-[clamp(2rem,4vw,3.25rem)] leading-[1.1] tracking-[-0.04em] text-navy-dark">
          {isID ? 'Reservasi kamar' : 'Room reservation'}
        </h1>
      </header>

      <div className="grid items-start gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_338px] lg:gap-7 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 lg:sticky lg:top-[89px] lg:col-start-2 lg:row-start-1">
          <BookingSummary
            isID={isID}
            hotel={hotel}
            room={selectedRoom}
            roomPhoto={catalogPhoto ?? (roomPhoto?.id === selectedRoom.id ? roomPhoto.url : undefined)}
            checkIn={checkIn}
            checkOut={checkOut}
            nights={nights}
            adults={adults}
            children={children}
            quote={currentQuote}
          />
        </div>

        <div ref={wizardRef} className="min-w-0 scroll-mt-[84px] rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,35,68,0.05)] lg:col-start-1 lg:row-start-1" data-checkout-wizard>
          <BookingWizardHeader isID={isID} step={step} disabled={isSubmitting} onStep={goToStep} />
          {recoveryNotice && (
            <div className="mx-4 mt-4 rounded-2xl border border-gold-light/50 bg-gold-soft p-3.5 text-[13px] leading-5 text-gold-dark sm:mx-6 sm:mt-6 lg:mx-7">
              {recoveryNotice}
            </div>
          )}

          <div className="p-3.5 sm:p-6 lg:p-7">
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
                guestPhoneInvalid={showGuestPhoneError && !normalizedGuestPhone}
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
                checkIn={checkIn}
                checkOut={checkOut}
                adults={adults}
                children={children}
                guestName={guestName}
                guestEmail={guestEmail}
                guestPhone={guestPhone}
                specialRequests={specialRequests}
                error={error}
                quote={currentQuote}
                onRetryQuote={retryQuote}
                isSubmitting={isSubmitting}
                onEditStep={goToStep}
              />
            )}
          </div>

          <BookingFooter
            isID={isID}
            step={step}
            isSubmitting={isSubmitting}
            canProceed={canProceed}
            nights={nights}
            quote={currentQuote}
            onBack={() => goToStep((step - 1) as 1 | 2 | 3)}
            onNext={() => goToStep((step + 1) as 1 | 2 | 3)}
            onSubmit={handleFinalSubmit}
          />
        </div>
      </div>

      <CheckoutLeaveDialog
        isID={isID}
        hold={leaveGuard.hold}
        processing={isSubmitting}
        loggingOut={leaveGuard.isLoggingOut}
        logoutFailed={leaveGuard.logoutFailed}
        onStay={leaveGuard.stay}
        onLeave={leaveGuard.leave}
      />
    </div>
  );
};
