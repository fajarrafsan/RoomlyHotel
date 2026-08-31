import { buildQuery, http, SERVICE } from '../lib/http';
import {
  NotificationEventType,
  NotificationPreferenceResponse,
  NotificationResponse,
  SpringPage,
  UnreadCountResponse,
  UpdateNotificationPreferenceRequest,
} from '../types/api';

const BASE = `${SERVICE.notification}/api/notifications`;

export const notificationApi = {
  list: (page = 0, size = 20, type?: NotificationEventType) =>
    http.get<SpringPage<NotificationResponse>>(`${BASE}${buildQuery({ page, size, type })}`),
  listUnread: (page = 0, size = 20) =>
    http.get<SpringPage<NotificationResponse>>(`${BASE}/unread${buildQuery({ page, size })}`),
  getById: (id: number) => http.get<NotificationResponse>(`${BASE}/${id}`),
  unreadCount: async () => (await http.get<UnreadCountResponse>(`${BASE}/unread-count`)).unreadCount,
  markRead: (id: number) => http.patch<NotificationResponse>(`${BASE}/${id}/read`),
  markAllRead: () => http.patch<UnreadCountResponse>(`${BASE}/read-all`),
};

export const notificationPreferenceApi = {
  list: () => http.get<NotificationPreferenceResponse[]>(`${BASE}/preferences`),
  update: (payload: UpdateNotificationPreferenceRequest) =>
    http.patch<NotificationPreferenceResponse>(`${BASE}/preferences`, payload),
};
