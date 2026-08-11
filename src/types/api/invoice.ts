// ---------- invoice-service ----------
// Unlike every other Roomly service, invoice-service's controllers return
// their DTOs directly (no { message, data } envelope) and its list endpoints
// return a raw Spring Data Page — different shape from Roomly's usual
// PagedResponse<T>, hence the separate SpringPage<T> below.

export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'VOID' | 'REFUNDED';
export type InvoiceItemType = 'ROOM_NIGHT' | 'TAX' | 'SERVICE_FEE' | 'DISCOUNT';

export interface InvoiceItemResponse {
  id: number;
  itemType: InvoiceItemType;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface InvoiceResponse {
  id: number;
  invoiceNumber: string;
  bookingId: number;
  bookingCode: string;
  paymentId: number | null;
  paymentCode: string | null;
  userId: number;
  hotelId: number;
  roomId: number;
  customerName: string;
  customerEmail: string;
  hotelName: string;
  roomName: string;
  invoiceDate: string;
  checkInDate: string;
  checkOutDate: string;
  nightsCount: number;
  subtotalAmount: number;
  taxAmount: number;
  serviceFeeAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  paymentMethod: string | null;
  paidAt: string | null;
  status: InvoiceStatus;
  issuedAt: string | null;
  voidedAt: string | null;
  voidReason: string | null;
  refundedAt: string | null;
  items: InvoiceItemResponse[];
  createdAt: string;
  updatedAt: string;
}

/** One entry of an invoice's audit trail — GET /api/admin/invoices/{id}/history. */
export interface InvoiceEventResponse {
  id: number;
  fromStatus: InvoiceStatus | null;
  toStatus: InvoiceStatus | null;
  eventType: string;
  message: string | null;
  createdAt: string;
}

export interface InvoiceSummaryResponse {
  id: number;
  invoiceNumber: string;
  bookingId: number;
  bookingCode: string;
  userId: number;
  hotelId: number;
  hotelName: string;
  customerName: string;
  invoiceDate: string;
  checkInDate: string;
  checkOutDate: string;
  totalAmount: number;
  currency: string;
  status: InvoiceStatus;
  issuedAt: string | null;
  createdAt: string;
}
