// ---------- notification-service ----------

export type NotificationEventType =
  | 'BOOKING_CREATED' | 'BOOKING_CONFIRMED' | 'BOOKING_CANCELLED' | 'BOOKING_EXPIRED' | 'BOOKING_NO_SHOW'
  | 'PAYMENT_CREATED' | 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED' | 'PAYMENT_EXPIRED' | 'PAYMENT_CANCELLED'
  | 'REFUND_REQUESTED' | 'REFUND_SUCCESS' | 'REFUND_FAILED'
  | 'INVOICE_ISSUED' | 'INVOICE_VOIDED' | 'INVOICE_REFUNDED'
  | 'CHECKIN_REMINDER' | 'CHECKIN_SUCCESS' | 'CHECKOUT_REMINDER' | 'CHECKOUT_SUCCESS'
  | 'HOUSEKEEPING_TASK_CREATED' | 'HOUSEKEEPING_TASK_STARTED' | 'HOUSEKEEPING_TASK_COMPLETED' | 'ROOM_READY'
  | 'REVIEW_CREATED' | 'REVIEW_HIDDEN' | 'REVIEW_DELETED';

// Raw JSON, not Roomly's usual { message, data } envelope.
export interface NotificationPreferenceResponse {
  id: number;
  userId: number;
  eventType: NotificationEventType;
  inAppEnabled: boolean;
  emailEnabled: boolean;
}

export interface UpdateNotificationPreferenceRequest {
  eventType: NotificationEventType;
  inAppEnabled: boolean;
  emailEnabled: boolean;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export type NotificationReferenceType =
  | 'BOOKING' | 'PAYMENT' | 'REFUND' | 'INVOICE' | 'HOUSEKEEPING' | 'ROOM' | 'REVIEW';

/** Body for POST /api/admin/notifications/send — manual dispatch to specific users. */
export interface SendNotificationRequest {
  userIds: number[];
  eventType: NotificationEventType;
  referenceType?: NotificationReferenceType;
  referenceId?: number;
  title?: string;
  message?: string;
  data?: Record<string, unknown>;
}

export interface NotificationResponse {
  id: number;
  userId: number;
  notificationType: string;
  title: string;
  message: string;
  channel: string;
  referenceType: string | null;
  referenceId: number | null;
  isRead: boolean;
  readAt: string | null;
  sentAt: string | null;
  deliveryStatus: string;
  createdAt: string;
}

export type NotificationChannel = 'IN_APP' | 'EMAIL';

/**
 * Admin-managed message templates. Title and message bodies interpolate
 * {{placeholder}} tokens filled in from the event payload at send time.
 */
export interface NotificationTemplateResponse {
  id: number;
  eventType: NotificationEventType;
  channel: NotificationChannel;
  titleTemplate: string;
  messageTemplate: string;
  isActive: boolean;
  updatedAt: string | null;
}

export interface CreateNotificationTemplateRequest {
  eventType: NotificationEventType;
  channel: NotificationChannel;
  titleTemplate: string;
  messageTemplate: string;
  isActive?: boolean;
}

/** PATCH semantics: only the fields present are changed. */
export interface UpdateNotificationTemplateRequest {
  titleTemplate?: string;
  messageTemplate?: string;
  isActive?: boolean;
}
