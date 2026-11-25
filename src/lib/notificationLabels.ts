import { NotificationEventType } from '../types/api';
import { Role } from '../types/api/auth';

export const ROLE_LABELS: Record<string, { id: string; en: string }> = {
  ADMIN: { id: 'Admin', en: 'Admin' },
  RECEPTIONIST: { id: 'Resepsionis', en: 'Receptionist' },
  HOUSEKEEPING: { id: 'Housekeeping', en: 'Housekeeping' },
  MAINTENANCE: { id: 'Maintenance', en: 'Maintenance' },
  CUSTOMER: { id: 'Pelanggan', en: 'Customer' },
};

export const EVENT_TYPE_LABELS: Record<NotificationEventType, { id: string; en: string }> = {
  BOOKING_CREATED: { id: 'Pesanan Dibuat', en: 'Booking Created' },
  BOOKING_CONFIRMED: { id: 'Pesanan Dikonfirmasi', en: 'Booking Confirmed' },
  BOOKING_CANCELLED: { id: 'Pesanan Dibatalkan', en: 'Booking Cancelled' },
  BOOKING_EXPIRED: { id: 'Pesanan Kedaluwarsa', en: 'Booking Expired' },
  BOOKING_NO_SHOW: { id: 'Tamu Tidak Hadir', en: 'Guest No-show' },
  PAYMENT_CREATED: { id: 'Pembayaran Dibuat', en: 'Payment Created' },
  PAYMENT_SUCCESS: { id: 'Pembayaran Berhasil', en: 'Payment Successful' },
  PAYMENT_FAILED: { id: 'Pembayaran Gagal', en: 'Payment Failed' },
  PAYMENT_EXPIRED: { id: 'Pembayaran Kedaluwarsa', en: 'Payment Expired' },
  PAYMENT_CANCELLED: { id: 'Pembayaran Dibatalkan', en: 'Payment Cancelled' },
  REFUND_REQUESTED: { id: 'Pengembalian Dana Diminta', en: 'Refund Requested' },
  REFUND_SUCCESS: { id: 'Pengembalian Dana Berhasil', en: 'Refund Successful' },
  REFUND_FAILED: { id: 'Pengembalian Dana Gagal', en: 'Refund Failed' },
  INVOICE_ISSUED: { id: 'Invoice Terbit', en: 'Invoice Issued' },
  INVOICE_VOIDED: { id: 'Invoice Dibatalkan', en: 'Invoice Voided' },
  INVOICE_REFUNDED: { id: 'Invoice Dikembalikan', en: 'Invoice Refunded' },
  CHECKIN_REMINDER: { id: 'Pengingat Check-in', en: 'Check-in Reminder' },
  CHECKIN_SUCCESS: { id: 'Check-in Berhasil', en: 'Check-in Successful' },
  CHECKOUT_REMINDER: { id: 'Pengingat Check-out', en: 'Check-out Reminder' },
  CHECKOUT_SUCCESS: { id: 'Check-out Berhasil', en: 'Check-out Successful' },
  HOUSEKEEPING_TASK_CREATED: { id: 'Tugas Housekeeping Dibuat', en: 'Housekeeping Task Created' },
  HOUSEKEEPING_TASK_STARTED: { id: 'Tugas Housekeeping Dimulai', en: 'Housekeeping Task Started' },
  HOUSEKEEPING_TASK_COMPLETED: { id: 'Tugas Housekeeping Selesai', en: 'Housekeeping Task Completed' },
  ROOM_READY: { id: 'Kamar Siap', en: 'Room Ready' },
  REVIEW_CREATED: { id: 'Ulasan Dibuat', en: 'Review Created' },
  REVIEW_HIDDEN: { id: 'Ulasan Disembunyikan', en: 'Review Hidden' },
  REVIEW_DELETED: { id: 'Ulasan Dihapus', en: 'Review Deleted' },
};

export const notificationEventTypes = Object.keys(EVENT_TYPE_LABELS) as NotificationEventType[];

export function notificationEventLabel(type: string, isID: boolean) {
  return EVENT_TYPE_LABELS[type as NotificationEventType]?.[isID ? 'id' : 'en'] ?? type.replace(/_/g, ' ');
}

export function notificationChannelLabel(channel: string, isID: boolean) {
  if (channel === 'IN_APP') return isID ? 'Dalam aplikasi' : 'In-app';
  if (channel === 'EMAIL') return 'Email';
  return channel;
}

export interface NotificationEventGroup {
  title: { id: string; en: string };
  events: NotificationEventType[];
}

// Events a regular customer cares about, grouped by domain.
export const GUEST_EVENT_GROUPS: NotificationEventGroup[] = [
  {
    title: { id: 'Pemesanan', en: 'Booking' },
    events: ['BOOKING_CREATED', 'BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'BOOKING_EXPIRED'],
  },
  {
    title: { id: 'Pembayaran', en: 'Payment' },
    events: ['PAYMENT_CREATED', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'PAYMENT_EXPIRED', 'PAYMENT_CANCELLED'],
  },
  {
    title: { id: 'Pengembalian Dana', en: 'Refunds' },
    events: ['REFUND_REQUESTED', 'REFUND_SUCCESS', 'REFUND_FAILED'],
  },
  {
    title: { id: 'Invoice', en: 'Invoices' },
    events: ['INVOICE_ISSUED', 'INVOICE_VOIDED', 'INVOICE_REFUNDED'],
  },
  {
    title: { id: 'Check-in & Check-out', en: 'Check-in & Check-out' },
    events: ['CHECKIN_REMINDER', 'CHECKIN_SUCCESS', 'CHECKOUT_REMINDER', 'CHECKOUT_SUCCESS'],
  },
  {
    title: { id: 'Ulasan', en: 'Reviews' },
    events: ['REVIEW_CREATED', 'REVIEW_HIDDEN', 'REVIEW_DELETED'],
  },
];
