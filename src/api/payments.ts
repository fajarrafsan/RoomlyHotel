import { http, SERVICE } from '../lib/http';
import {
  CreatePaymentRequest,
  CreatePaymentResponse,
  PaymentResponse,
  RefundPaymentRequest,
} from '../types/api';

const BASE = `${SERVICE.payment}/api/payments`;

export const paymentApi = {
  create: (payload: CreatePaymentRequest) => http.post<CreatePaymentResponse>(BASE, payload),
  getByBookingId: (bookingId: number) => http.get<PaymentResponse>(`${BASE}/booking/${bookingId}`),
  // Actively pulls status from Midtrans instead of waiting for its webhook —
  // works without a public tunnel exposing the backend to Midtrans's servers.
  syncStatus: (paymentId: number) => http.post<PaymentResponse>(`${BASE}/${paymentId}/sync-status`),
  // Only non-terminal payments can be cancelled; a settled one has to be
  // refunded instead. Open to the booking's owner as well as ADMIN/RECEPTIONIST.
  cancel: (paymentId: number) => http.post<PaymentResponse>(`${BASE}/${paymentId}/cancel`),
  // Staff-only. The backend rejects a refund while the booking is still active
  // unless an ADMIN sends force with a reason.
  refund: (paymentId: number, payload: RefundPaymentRequest = {}) =>
    http.post<PaymentResponse>(`${BASE}/${paymentId}/refund`, payload),
};
