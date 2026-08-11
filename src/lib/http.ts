import { ApiErrorBody } from '../types/api';

export class ApiError extends Error {
  status: number;
  body: ApiErrorBody | null;

  constructor(status: number, body: ApiErrorBody | null, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

// Thrown by AuthContext.login() when Roomly requires a second-factor OTP
// (admin accounts only) instead of completing the login — lets AuthModal
// switch to an OTP-entry step rather than treating it as a failed login.
export class OtpRequiredError extends Error {
  email: string;

  constructor(email: string) {
    super('OTP verification required');
    this.name = 'OtpRequiredError';
    this.email = email;
  }
}

async function parseBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });

  const payload = await parseBody(res);

  if (!res.ok) {
    const body = (payload && typeof payload === 'object' ? payload : null) as ApiErrorBody | null;
    throw new ApiError(res.status, body, body?.message || `${res.status} ${res.statusText}`);
  }

  // Every Roomly success response is { message, data } except 204 No Content.
  if (payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

export const http = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

/**
 * Multipart POST for the image-upload endpoints. Deliberately does NOT set a
 * Content-Type header — the browser must add its own multipart boundary, and
 * setting it manually breaks the upload.
 */
export async function postForm<T>(path: string, form: FormData): Promise<T> {
  const res = await fetch(path, { method: 'POST', body: form, credentials: 'include' });
  const payload = await parseBody(res);

  if (!res.ok) {
    const body = (payload && typeof payload === 'object' ? payload : null) as ApiErrorBody | null;
    throw new ApiError(res.status, body, body?.message || `${res.status} ${res.statusText}`);
  }
  if (payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

export function buildQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') usp.set(key, String(value));
  }
  const qs = usp.toString();
  return qs ? `?${qs}` : '';
}

// Raw, non-throwing request used by the live API Explorer runner: it needs the
// real HTTP status/timing even on 4xx/5xx responses, not a thrown ApiError.
export interface RawResult {
  status: number;
  statusText: string;
  ok: boolean;
  timeMs: number;
  body: unknown;
}

export async function rawRequest(path: string, method: string, body?: string): Promise<RawResult> {
  const start = performance.now();
  const res = await fetch(path, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body || undefined,
  });
  const timeMs = Math.round(performance.now() - start);
  const payload = await parseBody(res);
  return { status: res.status, statusText: res.statusText, ok: res.ok, timeMs, body: payload };
}

// Downloads a binary file (e.g. an invoice PDF) with the same cookie-based
// auth as every other call — a plain <a href> can't attach credentials, so
// the caller fetches the blob here and triggers the download itself.
export interface FileDownload {
  blob: Blob;
  filename: string;
}

export async function fetchFile(path: string): Promise<FileDownload> {
  const res = await fetch(path, { credentials: 'include' });

  if (!res.ok) {
    const text = await res.text();
    let body: ApiErrorBody | null = null;
    try { body = JSON.parse(text); } catch { /* not JSON */ }
    throw new ApiError(res.status, body, body?.message || `${res.status} ${res.statusText}`);
  }

  const disposition = res.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="?([^";]+)"?/i);
  const filename = match ? match[1] : 'download';
  const blob = await res.blob();
  return { blob, filename };
}

// Service prefixes proxied by Vite (see vite.config.ts) straight to the Roomly gateway.
export const SERVICE = {
  auth: '/auth-service',
  hotel: '/hotel-service',
  room: '/room-service',
  booking: '/booking-service',
  payment: '/payment-service',
  review: '/review-service',
  notification: '/notification-service',
  invoice: '/invoice-service',
} as const;
