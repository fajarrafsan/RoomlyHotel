import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, SearchX
} from 'lucide-react';
import { Hotel, RoomType, Booking, Language } from '../types';
import { calculateNights } from '../lib/utils';
import { bookingApi } from '../api/bookings';
import { paymentApi } from '../api/payments';
import { mapBookingToUI } from '../lib/adapters';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/http';
import { BookingWizardHeader } from '../components/booking/BookingWizardHeader';
import { BookingFooter } from '../components/booking/BookingFooter';
import { PaymentStatusScreen } from '../components/booking/PaymentStatusScreen';
import { DatesGuestsStep } from '../components/booking/steps/DatesGuestsStep';
import { GuestDetailsStep } from '../components/booking/steps/GuestDetailsStep';
import { ReviewPayStep } from '../components/booking/steps/ReviewPayStep';

interface BookingCheckoutPageProps {
  hotels: Hotel[];
  onCompleteBooking: (newBooking: Booking) => void;
  language: Language;
}

const TERMINAL_STATUSES = new Set(['PAID', 'FAILED', 'EXPIRED', 'CANCELLED', 'REFUNDED']);
const POLL_INTERVAL_MS = 4000;
const MAX_AUTO_POLLS = 45; // ~3 minutes of auto-polling before falling back to manual-only

interface PendingPayment {
  paymentId: number;
  redirectUrl: string;
  uiBooking: Booking;
}

export const BookingCheckoutPage: React.FC<BookingCheckoutPageProps> = ({ hotels, onCompleteBooking, language }) => {
  const isID = language === 'ID';
  const { user } = useAuth();
  const navigate = useNavigate();
  const { hotelId, roomId } = useParams<{ hotelId: string; roomId: string }>();

  const hotel = hotels.find((h) => h.id === hotelId);
  const selectedRoom = hotel?.rooms.find((r) => r.id === roomId);

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

  // Set once booking + payment session are created — swaps the wizard for a
  // "waiting for confirmation" screen that polls Midtrans directly instead of
  // relying on its webhook (which needs a public URL to reach this backend).
  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>('PENDING');
  const [isChecking, setIsChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const pollCountRef = useRef(0);

  const checkPaymentStatus = async (paymentId: number) => {
    setIsChecking(true);
    setCheckError(null);
    try {
      const result = await paymentApi.syncStatus(paymentId);
      setPaymentStatus(result.status);
      return result.status;
    } catch (err) {
      console.error('Failed to sync payment status', err);
      setCheckError(isID ? 'Gagal memeriksa status. Coba lagi.' : 'Failed to check status. Please try again.');
      return null;
    } finally {
      setIsChecking(false);
    }
  };

  // Auto-poll while pending, stop once terminal or after the attempt cap —
  // the manual "Cek Sekarang" button keeps working regardless.
  useEffect(() => {
    if (!pendingPayment || TERMINAL_STATUSES.has(paymentStatus)) return;
    if (pollCountRef.current >= MAX_AUTO_POLLS) return;

    const timer = setTimeout(() => {
      pollCountRef.current += 1;
      checkPaymentStatus(pendingPayment.paymentId);
    }, POLL_INTERVAL_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPayment, paymentStatus]);

  if (!hotel || !selectedRoom) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center gap-4 py-20">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
          <SearchX className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            {isID ? 'Kamar tidak ditemukan' : 'Room not found'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {isID ? 'Tautan reservasi ini tidak valid atau kamar sudah tidak tersedia.' : 'This booking link is invalid or the room is no longer available.'}
          </p>
        </div>
        <Link to="/explore" className="text-sm font-semibold text-slate-900 hover:underline underline-offset-2">
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
          { fullName: guestName, email: guestEmail, phone: guestPhone, isPrimaryGuest: true }
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
      // The booking itself already exists on the server at this point — surface
      // it locally right away so it's not lost even if the payment step below fails.
      onCompleteBooking(uiBooking);

      try {
        const payment = await paymentApi.create({
          bookingId: created.id,
          bookingCode: created.bookingCode,
          userId: user.userId,
          hotelId: created.hotelId,
          roomId: created.roomId,
          amount: created.totalAmount,
          currency: created.currency,
          customerName: guestName,
          customerEmail: guestEmail,
          customerPhone: guestPhone,
        });

        pollCountRef.current = 0;
        setPaymentStatus('PENDING');
        setPendingPayment({ paymentId: payment.paymentId, redirectUrl: payment.redirectUrl, uiBooking });
        window.open(payment.redirectUrl, '_blank', 'noopener,noreferrer');
      } catch (paymentErr) {
        console.error('Payment session could not be created', paymentErr);
        navigate('/bookings');
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

  if (pendingPayment) {
    return (
      <PaymentStatusScreen
        isID={isID}
        paymentStatus={paymentStatus}
        redirectUrl={pendingPayment.redirectUrl}
        isChecking={isChecking}
        checkError={checkError}
        onCheck={() => checkPaymentStatus(pendingPayment.paymentId)}
        onReopen={() => window.open(pendingPayment.redirectUrl, '_blank', 'noopener,noreferrer')}
        onDone={() => navigate('/bookings')}
      />
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-900 transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        {isID ? 'Kembali' : 'Back'}
      </button>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
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
