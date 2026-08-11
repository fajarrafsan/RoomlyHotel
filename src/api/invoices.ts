import { buildQuery, fetchFile, http, SERVICE } from '../lib/http';
import { InvoiceResponse, InvoiceSummaryResponse, SpringPage } from '../types/api';

const BASE = `${SERVICE.invoice}/api/invoices`;

export const invoiceApi = {
  // GET /api/invoices — implicitly scoped server-side to the logged-in user; this is "my invoices".
  myInvoices: (page = 0, size = 20) =>
    http.get<SpringPage<InvoiceSummaryResponse>>(`${BASE}${buildQuery({ page, size })}`),
  getById: (id: number) => http.get<InvoiceResponse>(`${BASE}/${id}`),
  getByNumber: (invoiceNumber: string) => http.get<InvoiceResponse>(`${BASE}/code/${invoiceNumber}`),
  // 404 until invoice-service's PAYMENT_SUCCESS listener generates one — this is
  // normal for a booking that hasn't been paid yet, or in the brief async window
  // right after payment settles, not necessarily an error state.
  getByBookingId: (bookingId: number) => http.get<InvoiceResponse>(`${BASE}/booking/${bookingId}`),
  downloadPdf: (id: number) => fetchFile(`${BASE}/${id}/pdf`),
};
