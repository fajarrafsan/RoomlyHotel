// ---------- booking-service ----------

export type BookingStatus =
  | 'PENDING' | 'WAITING_PAYMENT' | 'CONFIRMED' | 'CANCELLED'
  | 'CHECKED_IN' | 'CHECKED_OUT' | 'NO_SHOW' | 'EXPIRED';
export type BookingPaymentStatus = 'UNPAID' | 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'REFUNDED' | 'CANCELLED';
export type CancellationStatus = 'REQUESTED' | 'COMPLETED' | 'REJECTED';
export type RefundStatus = 'NOT_REQUIRED' | 'PENDING' | 'PROCESSING' | 'REFUNDED' | 'FAILED' | 'REJECTED';

export interface CreateBookingGuestRequest {
  fullName: string;
  email: string;
  phone: string;
  isPrimaryGuest: boolean;
}

export interface CreateBookingRequest {
  userId: number;
  roomId: number;
  checkInDate: string;
  checkOutDate: string;
  adultCount: number;
  childCount: number;
  guests: CreateBookingGuestRequest[];
  specialRequest?: string;
  expectedTotalAmount?: number;
}

export type BookingQuoteRequest = Pick<CreateBookingRequest, 'roomId' | 'checkInDate' | 'checkOutDate'>;

export interface BookingQuoteResponse {
  currency: string;
  subtotalAmount: number;
  taxAmount: number;
  serviceFeeAmount: number;
  discountAmount: number;
  totalAmount: number;
  nights: { stayDate: string; pricePerNight: number }[];
}

export interface BookingGuestResponse {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  isPrimaryGuest: boolean;
  createdAt: string;
}

export interface BookingNightResponse {
  id: number;
  stayDate: string;
  roomPriceId: number | null;
  roomAvailabilityId: number | null;
  pricePerNight: number;
  availabilityStatusSnapshot: string | null;
  createdAt: string;
}

export interface BookingResponse {
  id: number;
  bookingCode: string;
  userId: number;
  hotelId: number;
  roomId: number;
  assignedRoomUnitId: number | null;
  roomName: string | null;
  hotelName: string | null;
  checkInDate: string;
  checkOutDate: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  adultCount: number;
  childCount: number;
  nightsCount: number;
  currency: string;
  subtotalAmount: number;
  taxAmount: number;
  serviceFeeAmount: number;
  discountAmount: number;
  totalAmount: number;
  specialRequest: string | null;
  status: BookingStatus;
  paymentStatus: BookingPaymentStatus;
  holdExpiresAt: string | null;
  confirmedAt: string | null;
  cancelledAt: string | null;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  guests: BookingGuestResponse[];
  nights: BookingNightResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface BookingCancellationResponse {
  id: number;
  bookingId: number;
  bookingCode: string;
  paymentId: number | null;
  cancelledByUserId: number | null;
  cancelledByRole: string | null;
  cancellationType: string | null;
  cancellationReason: string | null;
  refundable: boolean;
  cancellationFeeAmount: number | null;
  refundAmount: number | null;
  refundStatus: RefundStatus;
  status: CancellationStatus;
  cancelledAt: string;
}
