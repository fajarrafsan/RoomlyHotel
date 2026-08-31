import { Booking } from '../../types';
import { BookingPaymentStatus, BookingResponse, BookingStatus } from '../../types/api';
import { FALLBACK_IMAGES, hashToIndex } from './assets';

function mapBookingStatus(status: BookingStatus): Booking['status'] {
  switch (status) {
    case 'CONFIRMED':
      return 'confirmed';
    case 'CHECKED_IN':
      return 'checked-in';
    case 'CHECKED_OUT':
      return 'completed';
    case 'CANCELLED':
    case 'EXPIRED':
    case 'NO_SHOW':
      return 'cancelled';
    case 'PENDING':
    case 'WAITING_PAYMENT':
    default:
      return 'pending';
  }
}

function mapPaymentStatus(status: BookingPaymentStatus): Booking['paymentStatus'] {
  return status.toLowerCase() as Booking['paymentStatus'];
}

export interface BookingEnrichment {
  hotelImage?: string;
  hotelLocation?: string;
  hotelAddress?: string;
  roomSize?: string;
  bedType?: string;
  paymentMethod?: string;
}

export function mapBookingToUI(b: BookingResponse, enrichment: BookingEnrichment = {}): Booking {
  const primaryGuest = b.guests.find((g) => g.isPrimaryGuest) ?? b.guests[0];

  return {
    id: String(b.id),
    bookingCode: b.bookingCode,
    hotelId: String(b.hotelId),
    roomId: String(b.roomId),
    hotelName: b.hotelName || `Hotel #${b.hotelId}`,
    hotelImage: enrichment.hotelImage || FALLBACK_IMAGES[hashToIndex(b.hotelId, FALLBACK_IMAGES.length)],
    hotelLocation: enrichment.hotelLocation || '',
    hotelAddress: enrichment.hotelAddress || '',
    checkIn: b.checkInDate,
    checkOut: b.checkOutDate,
    nights: b.nightsCount,
    guests: { adults: b.adultCount, children: b.childCount },
    roomType: b.roomName || `Room #${b.roomId}`,
    roomSize: enrichment.roomSize || '—',
    bedType: enrichment.bedType || '—',
    totalPrice: b.totalAmount,
    status: mapBookingStatus(b.status),
    paymentStatus: mapPaymentStatus(b.paymentStatus),
    paymentMethod: enrichment.paymentMethod || 'Midtrans',
    bookedAt: b.createdAt ? b.createdAt.replace('T', ' ').substring(0, 16) : '',
    guestName: primaryGuest?.fullName || '',
    guestEmail: primaryGuest?.email || '',
    guestPhone: primaryGuest?.phone || '',
    specialRequests: b.specialRequest || undefined,
    // Backend has no breakfast/shuttle add-on concept at all (CreateBookingRequest
    // carries neither field), so these are always false for real bookings.
    hasBreakfast: false,
    hasAirportShuttle: false,
  };
}
