import { buildQuery, http, SERVICE } from '../lib/http';
import { NotificationPreferenceResponse, NotificationResponse, PagedResponse, UpdateNotificationPreferenceRequest } from '../types/api';

const BASE = `${SERVICE.notification}/api/notifications`;

export const notificationApi = {
  list: (page = 0, size = 20) =>
    http
      .get<PagedResponse<NotificationResponse>>(`${BASE}${buildQuery({ page, size })}`)
      .catch(() => ({ content: [], totalElements: 0, totalPages: 0, number: 0, size })),
  unreadCount: () => http.get<number>(`${BASE}/unread-count`).catch(() => 0),
  markRead: (id: number) => http.patch<void>(`${BASE}/${id}/read`),
  markAllRead: () => http.patch<void>(`${BASE}/read-all`),
};

export const notificationPreferenceApi = {
  list: () => http.get<NotificationPreferenceResponse[]>(`${BASE}/preferences`),
  update: (payload: UpdateNotificationPreferenceRequest) =>
    http.patch<NotificationPreferenceResponse>(`${BASE}/preferences`, payload),
};
