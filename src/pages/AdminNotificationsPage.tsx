import React, { useCallback, useEffect, useState } from 'react';
import { Bell, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { adminApi } from '../api/admin';
import { ApiError } from '../lib/http';
import { Language } from '../types';
import {
  NotificationEventType, NotificationReferenceType, NotificationResponse
} from '../types/api/notification';
import { AdminAccessGuard } from '../components/admin/AdminAccessGuard';
import { AdminPageShell, AdminTableCard } from '../components/admin/AdminPageShell';
import { StatusPill } from '../components/admin/StatusPill';

const EVENT_TYPES: NotificationEventType[] = [
  'BOOKING_CREATED', 'BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'BOOKING_EXPIRED',
  'PAYMENT_CREATED', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'PAYMENT_EXPIRED', 'PAYMENT_CANCELLED',
  'REFUND_REQUESTED', 'REFUND_SUCCESS', 'REFUND_FAILED',
  'INVOICE_ISSUED', 'INVOICE_VOIDED', 'INVOICE_REFUNDED',
  'CHECKIN_REMINDER', 'CHECKIN_SUCCESS', 'CHECKOUT_REMINDER', 'CHECKOUT_SUCCESS',
  'HOUSEKEEPING_TASK_CREATED', 'HOUSEKEEPING_TASK_STARTED', 'HOUSEKEEPING_TASK_COMPLETED', 'ROOM_READY',
  'REVIEW_CREATED', 'REVIEW_HIDDEN', 'REVIEW_DELETED',
];
const REFERENCE_TYPES: NotificationReferenceType[] = [
  'BOOKING', 'PAYMENT', 'REFUND', 'INVOICE', 'HOUSEKEEPING', 'ROOM', 'REVIEW',
];

const INPUT = 'w-full p-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-900 placeholder-slate-300 focus:outline-none focus:border-slate-900 transition-colors';
const LABEL = 'text-[11px] font-semibold text-slate-500 block mb-1.5';

export const AdminNotificationsPage: React.FC<{ language: Language; onOpenAuth?: () => void }> = ({
  language,
  onOpenAuth,
}) => {
  const isID = language === 'ID';

  const [sent, setSent] = useState<NotificationResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    userIds: '',
    eventType: 'BOOKING_CONFIRMED' as NotificationEventType,
    referenceType: '' as NotificationReferenceType | '',
    referenceId: '',
    title: '',
    message: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await adminApi.searchNotifications(0, 50);
      setSent(page.content);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (isID ? 'Gagal memuat notifikasi.' : 'Failed to load notifications.'));
    } finally {
      setLoading(false);
    }
  }, [isID]);

  useEffect(() => { load(); }, [load]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    // The backend takes a list of numeric user IDs; accept a comma/space list.
    const userIds = form.userIds
      .split(/[,\s]+/)
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n > 0);

    if (userIds.length === 0) {
      setError(isID ? 'Masukkan minimal satu User ID.' : 'Enter at least one user ID.');
      return;
    }

    setSending(true);
    setError(null);
    setSuccess(false);
    try {
      await adminApi.sendNotification({
        userIds,
        eventType: form.eventType,
        referenceType: form.referenceType || undefined,
        referenceId: form.referenceId === '' ? undefined : Number(form.referenceId),
        title: form.title.trim() || undefined,
        message: form.message.trim() || undefined,
      });
      setSuccess(true);
      setForm({ ...form, userIds: '', title: '', message: '', referenceId: '' });
      // Dispatch is asynchronous on the backend, so reload rather than assume.
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (isID ? 'Gagal mengirim notifikasi.' : 'Failed to send notification.'));
    } finally {
      setSending(false);
    }
  };

  return (
    <AdminAccessGuard isID={isID} onOpenAuth={onOpenAuth}>
      <AdminPageShell
        icon={Bell}
        title={isID ? 'Notifikasi' : 'Notifications'}
        subtitle={
          isID
            ? 'Kirim notifikasi manual ke pengguna tertentu, dan telusuri seluruh notifikasi yang pernah dikirim sistem.'
            : 'Dispatch a notification manually to specific users, and browse everything the system has sent.'
        }
        endpoint="POST /api/admin/notifications/send"
        isID={isID}
        loading={loading}
        error={error}
        onRefresh={load}
      >
        <form onSubmit={handleSend} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label>
              <span className={LABEL}>
                User ID <span className="text-rose-500">*</span>
              </span>
              <input
                value={form.userIds}
                onChange={(e) => setForm({ ...form, userIds: e.target.value })}
                placeholder={isID ? 'mis. 1, 2, 5' : 'e.g. 1, 2, 5'}
                className={INPUT}
              />
              <span className="text-[10px] text-slate-400 font-light block mt-1">
                {isID ? 'Pisahkan dengan koma atau spasi.' : 'Separate with commas or spaces.'}
              </span>
            </label>
            <label>
              <span className={LABEL}>{isID ? 'Jenis Event' : 'Event Type'}</span>
              <select
                value={form.eventType}
                onChange={(e) => setForm({ ...form, eventType: e.target.value as NotificationEventType })}
                className={`${INPUT} cursor-pointer`}
              >
                {EVENT_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label>
                <span className={LABEL}>{isID ? 'Referensi' : 'Reference'}</span>
                <select
                  value={form.referenceType}
                  onChange={(e) => setForm({ ...form, referenceType: e.target.value as NotificationReferenceType | '' })}
                  className={`${INPUT} cursor-pointer`}
                >
                  <option value="">—</option>
                  {REFERENCE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <label>
                <span className={LABEL}>Ref ID</span>
                <input
                  type="number" min={1} value={form.referenceId}
                  onChange={(e) => setForm({ ...form, referenceId: e.target.value })}
                  className={INPUT}
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label>
              <span className={LABEL}>{isID ? 'Judul' : 'Title'}</span>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={isID ? 'Kosongkan untuk pakai template' : 'Leave blank to use the template'}
                className={INPUT}
              />
            </label>
            <label className="sm:col-span-2">
              <span className={LABEL}>{isID ? 'Pesan' : 'Message'}</span>
              <input
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder={isID ? 'Kosongkan untuk pakai template' : 'Leave blank to use the template'}
                className={INPUT}
              />
            </label>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            {success ? (
              <p className="text-[12px] text-emerald-600 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {isID ? 'Notifikasi dikirim (diproses asinkron).' : 'Notification dispatched (processed asynchronously).'}
              </p>
            ) : <span />}
            <button
              type="submit" disabled={sending}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all inline-flex items-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
            >
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              {isID ? 'Kirim Notifikasi' : 'Send Notification'}
            </button>
          </div>
        </form>

        <AdminTableCard
          isID={isID}
          loading={loading}
          isEmpty={sent.length === 0}
          emptyLabel={isID ? 'Belum ada notifikasi terkirim.' : 'No notifications sent yet.'}
        >
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">{isID ? 'Judul' : 'Title'}</th>
                <th className="px-4 py-3">{isID ? 'Jenis' : 'Type'}</th>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3">{isID ? 'Dibaca' : 'Read'}</th>
                <th className="px-4 py-3">{isID ? 'Pengiriman' : 'Delivery'}</th>
                <th className="px-4 py-3">{isID ? 'Waktu' : 'Sent'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700">
              {sent.map((n) => (
                <tr key={n.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-500">#{n.userId}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{n.title}</p>
                    <p className="text-[11px] text-slate-500 font-light max-w-[280px] truncate">{n.message}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-[11px]">{n.notificationType?.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-slate-500 text-[11px]">{n.channel}</td>
                  <td className="px-4 py-3">
                    {n.isRead
                      ? <span className="text-[10px] font-semibold text-slate-400">{isID ? 'Dibaca' : 'Read'}</span>
                      : <span className="text-[10px] font-bold text-amber-600">{isID ? 'Belum' : 'Unread'}</span>}
                  </td>
                  <td className="px-4 py-3"><StatusPill status={n.deliveryStatus} /></td>
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                    {(n.sentAt || n.createdAt)?.replace('T', ' ').slice(0, 16)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminTableCard>
      </AdminPageShell>
    </AdminAccessGuard>
  );
};
