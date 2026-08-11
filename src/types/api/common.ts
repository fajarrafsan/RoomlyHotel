// Shared envelope / pagination shapes used by every Roomly service.
// Every service wraps success responses as { message, data } and paginated list
// endpoints as { message, data: { content, page: { size, number, totalElements, totalPages } } }.

export interface ApiEnvelope<T> {
  message: string;
  data: T;
}

export interface ApiErrorBody {
  timestamp?: string;
  status?: number;
  error?: string;
  message: string;
  errors?: Record<string, string> | null;
  path?: string;
}

export interface PageMeta {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
}

export interface PagedResponse<T> {
  content: T[];
  page: PageMeta;
}
