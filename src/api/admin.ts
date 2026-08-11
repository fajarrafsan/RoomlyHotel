import { buildQuery, fetchFile, http, postForm, SERVICE } from '../lib/http';
import { Role } from '../types/api/auth';
import { BookingCancellationResponse, BookingResponse } from '../types/api/booking';
import {
  CreateFacilityRequest, CreateHotelRequest, FacilityResponse, HotelImageResponse,
  HotelResponse, UpdateFacilityRequest, UpdateHotelRequest
} from '../types/api/hotel';
import {
  AmenityResponse, CreateAmenityRequest, CreateRoomCompositionRequest, CreateRoomPolicyRequest,
  CreateRoomPriceRequest, CreateRoomRequest, CreateRoomUnitRequest, RoomAmenityResponse,
  RoomAvailabilityResponse, RoomAvailabilityUpsertRequest, RoomCompositionResponse,
  RoomInventorySummaryResponse,
  RoomImageResponse, RoomPolicyResponse, RoomPriceResponse, RoomResponse, RoomUnitResponse,
  UpdateAmenityRequest, UpdateImageRequest, UpdateRoomCompositionRequest, UpdateRoomPolicyRequest,
  UpdateRoomPriceRequest, UpdateRoomRequest, UpdateRoomUnitRequest
} from '../types/api/room';
import { NotificationResponse, SendNotificationRequest } from '../types/api/notification';
import { InvoiceEventResponse, InvoiceResponse, InvoiceStatus, InvoiceSummaryResponse, SpringPage } from '../types/api/invoice';
import { PagedResponse } from '../types/api/common';
import { PaymentResponse } from '../types/api/payment';
import { ReviewResponse } from '../types/api/review';

export interface StaffUserDto {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  hotelId?: number;
  active: boolean;
  createdAt?: string;
}

export interface CreateStaffRequestDto {
  fullName: string;
  email: string;
  password: string;
  role: Role;
  hotelId?: number;
}

export interface AdminInvoiceFilters {
  status?: InvoiceStatus;
  hotelId?: number;
  userId?: number;
  bookingCode?: string;
  invoiceNumber?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
}

const AUTH_ADMIN_BASE = `${SERVICE.auth}/api/admin/staff`;
const BOOKING_ADMIN_BASE = `${SERVICE.booking}/api/admin/bookings`;
const CANCELLATION_ADMIN_BASE = `${SERVICE.booking}/api/admin/cancellations`;
const PAYMENT_ADMIN_BASE = `${SERVICE.payment}/api/admin/payments`;
const INVOICE_ADMIN_BASE = `${SERVICE.invoice}/api/admin/invoices`;
const REVIEW_ADMIN_BASE = `${SERVICE.review}/api/admin/reviews`;
const HOTEL_ADMIN_BASE = `${SERVICE.hotel}/api/admin/hotels`;
// room-service mounts its room CRUD under /api/admin/hotels (not /api/admin/rooms),
// while room units, prices, policies and images live under /api/admin/rooms.
const ROOM_ADMIN_HOTEL_BASE = `${SERVICE.room}/api/admin/hotels`;
const ROOM_ADMIN_BASE = `${SERVICE.room}/api/admin/rooms`;

export const adminApi = {
  // ---- Staff (auth-service /api/admin/staff) ----
  listStaff: () => http.get<StaffUserDto[]>(AUTH_ADMIN_BASE),
  createStaff: (payload: CreateStaffRequestDto) => http.post<StaffUserDto>(AUTH_ADMIN_BASE, payload),
  deactivateStaff: (staffId: number) => http.patch<void>(`${AUTH_ADMIN_BASE}/${staffId}/deactivate`),

  // ---- Bookings (booking-service /api/admin/bookings) ----
  listAllBookings: (status?: string) =>
    http.get<BookingResponse[]>(`${BOOKING_ADMIN_BASE}${buildQuery({ status })}`).catch(() => []),
  confirmBooking: (bookingId: number) =>
    http.post<BookingResponse>(`${BOOKING_ADMIN_BASE}/${bookingId}/confirm`, {}),
  checkIn: (bookingId: number, assignedRoomUnitId: number) =>
    http.post<BookingResponse>(`${BOOKING_ADMIN_BASE}/${bookingId}/check-in`, { assignedRoomUnitId }),
  checkOut: (bookingId: number) =>
    http.post<BookingResponse>(`${BOOKING_ADMIN_BASE}/${bookingId}/check-out`),

  // ---- Cancellations (booking-service /api/admin/cancellations) ----
  listCancellations: (status?: string) =>
    http.get<BookingCancellationResponse[]>(`${CANCELLATION_ADMIN_BASE}${buildQuery({ status })}`).catch(() => []),

  // ---- Payments (payment-service /api/admin/payments) ----
  listPayments: (status?: string) =>
    http.get<PaymentResponse[]>(`${PAYMENT_ADMIN_BASE}${buildQuery({ status })}`).catch(() => []),
  expirePayment: (paymentId: number) =>
    http.post<PaymentResponse>(`${PAYMENT_ADMIN_BASE}/${paymentId}/expire`),

  // ---- Invoices (invoice-service /api/admin/invoices) ----
  // invoice-service returns a raw Spring Data Page, not Roomly's PagedResponse.
  searchInvoices: (filters: AdminInvoiceFilters = {}) =>
    http
      .get<SpringPage<InvoiceSummaryResponse>>(
        `${INVOICE_ADMIN_BASE}${buildQuery({ page: 0, size: 20, ...filters })}`
      )
      .catch(() => ({
        content: [],
        totalElements: 0,
        totalPages: 0,
        number: 0,
        size: filters.size || 20,
      })),
  getInvoice: (id: number) => http.get<InvoiceResponse>(`${INVOICE_ADMIN_BASE}/${id}`),
  invoiceHistory: (id: number) => http.get<InvoiceEventResponse[]>(`${INVOICE_ADMIN_BASE}/${id}/history`),
  downloadInvoicePdf: (id: number) => fetchFile(`${INVOICE_ADMIN_BASE}/${id}/pdf`),
  voidInvoice: (id: number, reason: string) =>
    http.post<InvoiceResponse>(`${INVOICE_ADMIN_BASE}/${id}/void`, { reason }),
  resendInvoice: (id: number) => http.post<InvoiceResponse>(`${INVOICE_ADMIN_BASE}/${id}/resend`),

  // ---- Reviews (review-service /api/admin/reviews) ----
  listReviews: (page = 0, size = 20) =>
    http.get<SpringPage<ReviewResponse>>(`${REVIEW_ADMIN_BASE}${buildQuery({ page, size })}`),
  hideReview: (id: number) => http.patch<ReviewResponse>(`${REVIEW_ADMIN_BASE}/${id}/hide`),
  deleteReview: (id: number) => http.delete<void>(`${REVIEW_ADMIN_BASE}/${id}`),

  // ---- Hotels (hotel-service /api/admin/hotels) ----
  listHotels: (page = 0, size = 50) =>
    http.get<PagedResponse<HotelResponse>>(`${HOTEL_ADMIN_BASE}${buildQuery({ page, size })}`),
  getHotel: (id: number) => http.get<HotelResponse>(`${HOTEL_ADMIN_BASE}/${id}`),
  createHotel: (payload: CreateHotelRequest) => http.post<HotelResponse>(HOTEL_ADMIN_BASE, payload),
  updateHotel: (id: number, payload: UpdateHotelRequest) =>
    http.put<HotelResponse>(`${HOTEL_ADMIN_BASE}/${id}`, payload),
  deleteHotel: (id: number) => http.delete<void>(`${HOTEL_ADMIN_BASE}/${id}`),

  // ---- Rooms (room-service, mounted under /api/admin/hotels) ----
  listRooms: (hotelId: number) =>
    http.get<RoomResponse[]>(`${ROOM_ADMIN_HOTEL_BASE}/${hotelId}/rooms`),
  createRoom: (hotelId: number, payload: CreateRoomRequest) =>
    http.post<RoomResponse>(`${ROOM_ADMIN_HOTEL_BASE}/${hotelId}/rooms`, payload),
  updateRoom: (roomId: number, payload: UpdateRoomRequest) =>
    http.patch<RoomResponse>(`${ROOM_ADMIN_HOTEL_BASE}/rooms/${roomId}`, payload),
  deleteRoom: (roomId: number) => http.delete<void>(`${ROOM_ADMIN_HOTEL_BASE}/rooms/${roomId}`),

  // ---- Room units (room-service /api/admin/rooms) ----
  listUnits: (roomId: number) => http.get<RoomUnitResponse[]>(`${ROOM_ADMIN_BASE}/${roomId}/units`),
  // Real system-wide capacity, counted from room_units server-side.
  inventorySummary: () =>
    http.get<RoomInventorySummaryResponse>(`${ROOM_ADMIN_BASE}/inventory-summary`),
  createUnit: (roomId: number, payload: CreateRoomUnitRequest) =>
    http.post<RoomUnitResponse>(`${ROOM_ADMIN_BASE}/${roomId}/units`, payload),
  createUnitsBulk: (roomId: number, items: CreateRoomUnitRequest[]) =>
    http.post<RoomUnitResponse[]>(`${ROOM_ADMIN_BASE}/${roomId}/units/bulk`, { items }),
  updateUnit: (unitId: number, payload: UpdateRoomUnitRequest) =>
    http.patch<RoomUnitResponse>(`${ROOM_ADMIN_BASE}/units/${unitId}`, payload),
  deleteUnit: (unitId: number) => http.delete<void>(`${ROOM_ADMIN_BASE}/units/${unitId}`),

  // ---- Availability / inventory (room-service /api/admin/rooms) ----
  // The single-date endpoint is an upsert, so it doubles as "edit this date".
  upsertAvailability: (roomId: number, payload: RoomAvailabilityUpsertRequest) =>
    http.post<RoomAvailabilityResponse>(`${ROOM_ADMIN_BASE}/${roomId}/availability`, payload),
  bulkUpsertAvailability: (roomId: number, items: RoomAvailabilityUpsertRequest[]) =>
    http.post<RoomAvailabilityResponse[]>(`${ROOM_ADMIN_BASE}/${roomId}/availability/bulk`, { items }),
  deleteAvailability: (availabilityId: number) =>
    http.delete<void>(`${ROOM_ADMIN_BASE}/availability/${availabilityId}`),

  // ---- Seasonal prices (room-service) ----
  createPrice: (roomId: number, payload: CreateRoomPriceRequest) =>
    http.post<RoomPriceResponse>(`${ROOM_ADMIN_BASE}/${roomId}/prices`, payload),
  updatePrice: (priceId: number, payload: UpdateRoomPriceRequest) =>
    http.patch<RoomPriceResponse>(`${ROOM_ADMIN_BASE}/prices/${priceId}`, payload),
  deletePrice: (priceId: number) => http.delete<void>(`${ROOM_ADMIN_BASE}/prices/${priceId}`),

  // ---- Room policies (room-service) ----
  createPolicy: (roomId: number, payload: CreateRoomPolicyRequest) =>
    http.post<RoomPolicyResponse>(`${ROOM_ADMIN_BASE}/${roomId}/policies`, payload),
  updatePolicy: (policyId: number, payload: UpdateRoomPolicyRequest) =>
    http.patch<RoomPolicyResponse>(`${ROOM_ADMIN_BASE}/policies/${policyId}`, payload),
  deletePolicy: (policyId: number) => http.delete<void>(`${ROOM_ADMIN_BASE}/policies/${policyId}`),

  // ---- Bed / area composition (room-service) ----
  createComposition: (roomId: number, payload: CreateRoomCompositionRequest) =>
    http.post<RoomCompositionResponse>(`${ROOM_ADMIN_BASE}/${roomId}/composition`, payload),
  updateComposition: (compositionId: number, payload: UpdateRoomCompositionRequest) =>
    http.patch<RoomCompositionResponse>(`${ROOM_ADMIN_BASE}/composition/${compositionId}`, payload),
  deleteComposition: (compositionId: number) =>
    http.delete<void>(`${ROOM_ADMIN_BASE}/composition/${compositionId}`),

  // ---- Room images (multipart upload) ----
  uploadRoomImages: (roomId: number, files: File[], altTexts?: string[]) => {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    altTexts?.forEach((t) => form.append('altTexts', t));
    return postForm<RoomImageResponse[]>(`${ROOM_ADMIN_BASE}/${roomId}/images`, form);
  },
  updateRoomImage: (imageId: number, payload: UpdateImageRequest) =>
    http.patch<RoomImageResponse>(`${ROOM_ADMIN_BASE}/images/${imageId}`, payload),
  setRoomImagePrimary: (imageId: number) =>
    http.patch<RoomImageResponse>(`${ROOM_ADMIN_BASE}/images/${imageId}/primary`),
  deleteRoomImage: (imageId: number) => http.delete<void>(`${ROOM_ADMIN_BASE}/images/${imageId}`),

  // ---- Hotel images (multipart upload) ----
  hotelImages: (hotelId: number) =>
    http.get<HotelImageResponse[]>(`${HOTEL_ADMIN_BASE}/${hotelId}/images`),
  uploadHotelImages: (hotelId: number, files: File[], altTexts?: string[]) => {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    altTexts?.forEach((t) => form.append('altTexts', t));
    return postForm<HotelImageResponse[]>(`${HOTEL_ADMIN_BASE}/${hotelId}/images`, form);
  },
  updateHotelImage: (imageId: number, payload: UpdateImageRequest) =>
    http.patch<HotelImageResponse>(`${HOTEL_ADMIN_BASE}/images/${imageId}`, payload),
  setHotelImagePrimary: (imageId: number) =>
    http.patch<HotelImageResponse>(`${HOTEL_ADMIN_BASE}/images/${imageId}/primary`),
  deleteHotelImage: (imageId: number) => http.delete<void>(`${HOTEL_ADMIN_BASE}/images/${imageId}`),

  // ---- Amenity master data (room-service) + per-room assignment ----
  listAmenities: () => http.get<AmenityResponse[]>(`${SERVICE.room}/api/amenities`),
  createAmenity: (payload: CreateAmenityRequest) =>
    http.post<AmenityResponse>(`${SERVICE.room}/api/admin/amenities`, payload),
  updateAmenity: (id: number, payload: UpdateAmenityRequest) =>
    http.patch<AmenityResponse>(`${SERVICE.room}/api/admin/amenities/${id}`, payload),
  deleteAmenity: (id: number) => http.delete<void>(`${SERVICE.room}/api/admin/amenities/${id}`),
  // "replace" swaps the room's whole amenity set; plain assign only adds.
  replaceRoomAmenities: (roomId: number, amenityIds: number[]) =>
    http.post<RoomAmenityResponse[]>(`${ROOM_ADMIN_BASE}/${roomId}/amenities/replace`, { amenityIds }),

  // ---- Facility master data (hotel-service) + per-hotel assignment ----
  listFacilities: () => http.get<FacilityResponse[]>(`${SERVICE.hotel}/api/admin/facilities`),
  createFacility: (payload: CreateFacilityRequest) =>
    http.post<FacilityResponse>(`${SERVICE.hotel}/api/admin/facilities`, payload),
  updateFacility: (id: number, payload: UpdateFacilityRequest) =>
    http.patch<FacilityResponse>(`${SERVICE.hotel}/api/admin/facilities/${id}`, payload),
  deleteFacility: (id: number) => http.delete<void>(`${SERVICE.hotel}/api/admin/facilities/${id}`),
  hotelFacilities: (hotelId: number) =>
    http.get<FacilityResponse[]>(`${HOTEL_ADMIN_BASE}/${hotelId}/facilities`),
  assignHotelFacilities: (hotelId: number, facilityIds: number[]) =>
    http.post<FacilityResponse[]>(`${HOTEL_ADMIN_BASE}/${hotelId}/facilities`, { facilityIds }),
  removeHotelFacility: (hotelId: number, facilityId: number) =>
    http.delete<void>(`${HOTEL_ADMIN_BASE}/${hotelId}/facilities/${facilityId}`),

  // ---- Notifications (notification-service) ----
  // Like invoice-service, this one returns a raw Spring Data Page.
  searchNotifications: (page = 0, size = 50) =>
    http.get<SpringPage<NotificationResponse>>(
      `${SERVICE.notification}/api/admin/notifications${buildQuery({ page, size })}`
    ),
  sendNotification: (payload: SendNotificationRequest) =>
    http.post<void>(`${SERVICE.notification}/api/admin/notifications/send`, payload),
};
