// ---------- payment-service ----------

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'REFUNDED' | 'CANCELLED';

export interface CreatePaymentRequest {
  bookingId: number;
  bookingCode: string;
  userId: number;
  hotelId: number;
  roomId: number;
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

export interface CreatePaymentResponse {
  paymentId: number;
  paymentCode: string;
  orderId: string;
  gateway: 'MIDTRANS';
  snapToken: string;
  redirectUrl: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  createdAt: string;
}

export interface PaymentResponse {
  id: number;
  paymentCode: string;
  bookingId: number;
  bookingCode: string;
  userId: number;
  hotelId: number;
  roomId: number;
  gateway: string | null;
  status: PaymentStatus;
  paymentMethod: string | null;
  amount: number;
  currency: string;
  redirectUrl: string | null;
  paidAt: string | null;
  expiredAt: string | null;
  cancelledAt: string | null;
  refundedAt: string | null;
  failureReason: string | null;
  createdAt: string;
}

/**
 * Staff refund. The backend only refunds PAID payments whose booking is
 * CANCELLED / EXPIRED / NO_SHOW; an ADMIN may override an active booking with
 * `force` plus a non-empty `reason`.
 */
export interface RefundPaymentRequest {
  amount?: number;
  reason?: string;
  force?: boolean;
}
