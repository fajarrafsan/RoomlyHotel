import { useCallback, useEffect, useRef, useState } from 'react';
import { AuthUser, Booking } from '../../types';
import { InvoiceResponse } from '../../types/api';
import { invoiceApi } from '../../api/invoices';
import { ApiError } from '../../lib/http';
import { useAuth } from '../../context/AuthContext';

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

interface InvoiceState {
  owner: AuthUser | null;
  booking: Booking | null;
  invoice: InvoiceResponse | null;
  loading: boolean;
  notFound: boolean;
  error: string | null;
  downloading: boolean;
  downloadError: string | null;
}

function emptyInvoice(owner: AuthUser | null, booking: Booking | null): InvoiceState {
  return { owner, booking, invoice: null, loading: Boolean(owner && booking), notFound: false, error: null, downloading: false, downloadError: null };
}

export function useInvoice(booking: Booking | null, isID: boolean): UseInvoiceResult {
  const { user } = useAuth();
  const mounted = useRef(false);
  const currentUser = useRef(user);
  const currentBooking = useRef(booking);
  currentUser.current = user;
  currentBooking.current = booking;
  const loadSequence = useRef(0);
  const downloadSequence = useRef(0);
  const pendingDownload = useRef<object | null>(null);
  const [state, setState] = useState<InvoiceState>(() => emptyInvoice(user, booking));
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      loadSequence.current++;
      downloadSequence.current++;
      pendingDownload.current = null;
    };
  }, []);

  const loadInvoice = useCallback(async () => {
    const owner = user;
    const target = booking;
    if (!owner || !target || !mounted.current || currentUser.current !== owner || currentBooking.current !== target) return;
    const sequence = ++loadSequence.current;
    downloadSequence.current++;
    pendingDownload.current = null;
    const isCurrent = () => mounted.current && currentUser.current === owner && currentBooking.current === target && loadSequence.current === sequence;
    setState(previous => isCurrent() ? emptyInvoice(owner, target) : previous);
    const numericId = Number(target.id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      setState(previous => isCurrent() ? { ...previous, error: isID ? 'ID reservasi tidak valid.' : 'The booking identifier is invalid.', loading: false } : previous);
      return;
    }

    try {
      const found = await invoiceApi.getByBookingId(numericId);
      if (!isCurrent()) return;
      if (!found?.invoiceNumber) {
        throw new Error('Invoice response is missing its invoice number');
      }
      setState(previous => isCurrent() ? { ...previous, invoice: found } : previous);
    } catch (err) {
      if (!isCurrent()) return;
      if (err instanceof ApiError && err.status === 404) {
        // Invoice generation is asynchronous and only starts after payment success.
        // A 404 therefore means "not issued yet", not a fabricated local receipt.
        setState(previous => isCurrent() ? { ...previous, invoice: null, notFound: true } : previous);
      } else {
        setState(previous => isCurrent() ? { ...previous, invoice: null, error: err instanceof ApiError
            ? err.message
            : (isID ? 'Invoice tidak dapat dimuat dari server.' : 'The invoice could not be loaded from the server.') } : previous);
      }
    } finally {
      if (isCurrent()) setState(previous => isCurrent() ? { ...previous, loading: false } : previous);
    }
  }, [user, booking, isID]);

  useEffect(() => {
    setState(emptyInvoice(user, booking));
    void loadInvoice();
    return () => {
      loadSequence.current++;
      downloadSequence.current++;
      pendingDownload.current = null;
    };
  }, [user, booking, loadInvoice]);

  // Hide the previous document on the very first account/booking change render.
  const visible = state.owner === user && state.booking === booking ? state : emptyInvoice(user, booking);

  const downloadPdf = useCallback(async () => {
    const owner = user;
    const target = booking;
    const invoice = state.owner === owner && state.booking === target ? state.invoice : null;
    if (!owner || !target || !invoice || !mounted.current || currentUser.current !== owner || currentBooking.current !== target || pendingDownload.current) return;
    const sequence = ++downloadSequence.current;
    const documentSequence = loadSequence.current;
    const pending = {};
    pendingDownload.current = pending;
    const isCurrent = () => mounted.current && currentUser.current === owner && currentBooking.current === target
      && downloadSequence.current === sequence && loadSequence.current === documentSequence
      && stateRef.current.owner === owner && stateRef.current.booking === target && stateRef.current.invoice === invoice;
    setState(previous => isCurrent() ? { ...previous, downloading: true, downloadError: null } : previous);
    try {
      const { blob, filename } = await invoiceApi.downloadPdf(invoice.id);
      // A previous account's or closed document's PDF must never start downloading.
      if (!isCurrent()) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (err) {
      if (isCurrent()) setState(previous => isCurrent() ? { ...previous, downloadError: err instanceof ApiError
          ? err.message
          : (isID ? 'PDF invoice gagal diunduh.' : 'The invoice PDF could not be downloaded.') } : previous);
    } finally {
      if (pendingDownload.current === pending) pendingDownload.current = null;
      if (isCurrent()) setState(previous => isCurrent() ? { ...previous, downloading: false } : previous);
    }
  }, [user, booking, state.owner, state.booking, state.invoice, isID]);

  return {
    invoice: visible.invoice,
    loading: visible.loading,
    notFound: visible.notFound,
    error: visible.error,
    downloading: visible.downloading,
    downloadError: visible.downloadError,
    reload: () => { void loadInvoice(); },
    downloadPdf,
  };
}
