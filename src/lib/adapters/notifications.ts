import { Notification } from '../../types';
import { NotificationResponse } from '../../types/api';

export function mapNotificationToUI(n: NotificationResponse): Notification {
  const type = /BOOKING/i.test(n.notificationType)
    ? 'booking'
    : /PROMO|DISCOUNT|VOUCHER/i.test(n.notificationType)
      ? 'promo'
      : 'system';

  return {
    id: String(n.id),
    title: n.title,
    message: n.message,
    time: relativeTime(n.sentAt || n.createdAt),
    unread: !n.isRead,
    type,
  };
}

function relativeTime(isoDate: string | null): string {
  if (!isoDate) return '';
  const then = new Date(isoDate).getTime();
  if (Number.isNaN(then)) return '';
  const diffMin = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (diffMin < 1) return 'Baru saja';
  if (diffMin < 60) return `${diffMin} menit yang lalu`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam yang lalu`;
  const diffDay = Math.round(diffHour / 24);
  return `${diffDay} hari yang lalu`;
}
