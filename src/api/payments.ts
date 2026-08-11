import { http, SERVICE } from '../lib/http';
import { CreatePaymentRequest, CreatePaymentResponse, PaymentResponse } from '../types/api';

const BASE = `${SERVICE.payment}/api/payments`;

export const paymentApi = {
  create: (payload: CreatePaymentRequest) => http.post<CreatePaymentResponse>(BASE, payload),
  getByBookingId: (bookingId: number) => http.get<PaymentResponse>(`${BASE}/booking/${bookingId}`),
  // Actively pulls status from Midtrans instead of waiting for its webhook —
  // works without a public tunnel exposing the backend to Midtrans's servers.
  syncStatus: (paymentId: number) => http.post<PaymentResponse>(`${BASE}/${paymentId}/sync-status`),
};
