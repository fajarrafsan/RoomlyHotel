import { http, SERVICE } from '../lib/http';
import { BookingCancellationResponse, BookingResponse, CreateBookingRequest } from '../types/api';

const BASE = `${SERVICE.booking}/api/bookings`;
const ADMIN_BASE = `${SERVICE.booking}/api/admin/bookings`;

export const bookingApi = {
  create: (payload: CreateBookingRequest) => http.post<BookingResponse>(BASE, payload),
  getById: (bookingId: number) => http.get<BookingResponse>(`${BASE}/${bookingId}`),
  // Staff-only in practice: booking ownership is only enforced for CUSTOMER-role
  // tokens server-side, so an ADMIN/RECEPTIONIST session can look up any guest's
  // booking by code — exactly what the front-desk QR check-in scan needs.
  getByCode: (bookingCode: string) => http.get<BookingResponse>(`${BASE}/code/${bookingCode}`),
  // GET /api/bookings/me — added to Roomly's BookingController alongside this
  // integration; the service method already existed but was never wired to a route.
  myBookings: () => http.get<BookingResponse[]>(`${BASE}/me`),
  cancel: (bookingId: number, reason?: string) =>
    http.post<BookingCancellationResponse>(`${BASE}/${bookingId}/cancel`, reason ? { reason } : {}),
  // Admin-only.
  checkIn: (bookingId: number, assignedRoomUnitId: number) =>
    http.post<BookingResponse>(`${ADMIN_BASE}/${bookingId}/check-in`, { assignedRoomUnitId }),
};
