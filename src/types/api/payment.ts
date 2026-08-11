// ---------- payment-service ----------

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
  status: string;
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
  status: string;
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
