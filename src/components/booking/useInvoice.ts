import { useCallback, useEffect, useState } from 'react';
import { Booking } from '../../types';
import { InvoiceResponse } from '../../types/api';
import { invoiceApi } from '../../api/invoices';
import { ApiError } from '../../lib/http';

export interface UseInvoiceResult {
  invoice: InvoiceResponse | null;
  loading: boolean;
  notFound: boolean;
  error: string | null;
  downloading: boolean;
  downloadError: string | null;
  reload: () => void;
  downloadPdf: () => Promise<void>;
}

export function useInvoice(booking: Booking | null, isID: boolean): UseInvoiceResult {
  const [invoice, setInvoice] = useState<InvoiceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const loadInvoice = useCallback(async (currentBooking: Booking) => {
    setLoading(true);
    setNotFound(false);
    setError(null);

    const numericId = Number(currentBooking.id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      setError(isID ? 'ID reservasi tidak valid.' : 'The booking identifier is invalid.');
      setLoading(false);
      return;
    }

    try {
      const found = await invoiceApi.getByBookingId(numericId);
      if (!found?.invoiceNumber) {
        throw new Error('Invoice response is missing its invoice number');
      }
      setInvoice(found);
    } catch (err) {
      setInvoice(null);
      if (err instanceof ApiError && err.status === 404) {
        // Invoice generation is asynchronous and only starts after payment success.
        // A 404 therefore means "not issued yet", not a fabricated local receipt.
        setNotFound(true);
      } else {
        setError(
          err instanceof ApiError
            ? err.message
            : (isID ? 'Invoice tidak dapat dimuat dari server.' : 'The invoice could not be loaded from the server.')
        );
      }
    } finally {
      setLoading(false);
    }
  }, [isID]);

  useEffect(() => {
    if (!booking) return;
    setInvoice(null);
    loadInvoice(booking);
  }, [booking, loadInvoice]);

  const downloadPdf = useCallback(async () => {
    if (!invoice) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      const { blob, filename } = await invoiceApi.downloadPdf(invoice.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setDownloadError(
        err instanceof ApiError
          ? err.message
          : (isID ? 'PDF invoice gagal diunduh.' : 'The invoice PDF could not be downloaded.')
      );
    } finally {
      setDownloading(false);
    }
  }, [invoice, isID]);

  return {
    invoice,
    loading,
    notFound,
    error,
    downloading,
    downloadError,
    reload: () => booking && loadInvoice(booking),
    downloadPdf,
  };
}
