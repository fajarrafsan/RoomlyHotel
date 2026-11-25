import { useState, type FormEvent } from 'react';
import { adminApi } from '../../api/admin';
import { ApiError } from '../../lib/http';
import { notificationEventLabel, notificationEventTypes } from '../../lib/notificationLabels';
import type { NotificationEventType, NotificationReferenceType } from '../../types/api/notification';
import { AdminFormModal, SelectField, TextAreaField, TextField } from './AdminFormModal';
import { OperationsFilters } from './OperationsPage';

const references: Record<NotificationReferenceType, [string, string]> = {
  BOOKING: ['Reservasi', 'Booking'], PAYMENT: ['Pembayaran', 'Payment'], REFUND: ['Pengembalian dana', 'Refund'],
  INVOICE: ['Invoice', 'Invoice'], HOUSEKEEPING: ['Housekeeping', 'Housekeeping'], ROOM: ['Kamar', 'Room'], REVIEW: ['Ulasan', 'Review'],
};

export function AdminNotificationComposer({ isID, onClose, onAccepted }: { isID: boolean; onClose: () => void; onAccepted: () => void }) {
  const [form, setForm] = useState({
    recipients: '', eventType: 'BOOKING_CONFIRMED' as NotificationEventType, referenceType: '' as NotificationReferenceType | '',
    referenceId: '', mode: 'template', title: '', message: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const patch = (fields: Partial<typeof form>) => {
    setForm(previous => ({ ...previous, ...fields }));
    setError(null);
  };
  const recipients = form.recipients.trim().split(/[\s,]+/).filter(Boolean);
  const valid = recipients.length > 0 && recipients.every(value => /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) > 0);
  const userIds = valid ? [...new Set(recipients.map(Number))] : [];
  const custom = form.mode === 'custom';

  const send = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setError(null);
    if (!valid) {
      setError(isID ? 'Gunakan ID pengguna berupa bilangan bulat positif, dipisahkan koma atau spasi.' : 'Enter positive whole-number user IDs separated by commas or spaces.');
      return;
    }
    const referenceId = form.referenceId ? Number(form.referenceId) : undefined;
    if (referenceId !== undefined && (!/^\d+$/.test(form.referenceId) || !Number.isSafeInteger(referenceId) || referenceId <= 0)) {
      setError(isID ? 'ID referensi harus berupa bilangan bulat positif.' : 'Enter a positive whole-number reference ID.');
      return;
    }
    const title = form.title.trim();
    const message = form.message.trim();
    if (custom && (!title || !message)) {
      setError(isID ? 'Judul dan pesan wajib diisi.' : 'Enter a title and a message.');
      return;
    }
    setBusy(true);
    try {
      await adminApi.sendNotification({
        userIds, eventType: form.eventType, referenceType: form.referenceType || undefined, referenceId,
        ...(custom ? { title, message } : {}),
      });
      onAccepted();
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : (isID ? 'Permintaan pengiriman gagal.' : 'Could not submit the notification.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminFormModal isID={isID} title={isID ? 'Kirim notifikasi' : 'Send notification'} onClose={onClose}
      submitting={busy} error={error} onSubmit={send} submitLabel={isID ? 'Kirim' : 'Send'}>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label={isID ? 'ID pengguna' : 'User IDs'} required value={form.recipients} inputMode="text"
          onChange={event => patch({ recipients: event.target.value })} placeholder={isID ? 'Mis. 1, 2, 5' : 'e.g. 1, 2, 5'}
          hint={isID ? 'Pisahkan ID dengan koma atau spasi.' : 'Separate IDs with commas or spaces.'} />
        <SelectField label={isID ? 'Jenis notifikasi' : 'Notification type'} value={form.eventType}
          onChange={event => patch({ eventType: event.target.value as NotificationEventType })}
          options={notificationEventTypes.map(value => ({ value, label: notificationEventLabel(value, isID) }))} />
      </div>
      {userIds.length > 0 && <p className="rounded-xl border border-slate-200 bg-navy-soft/50 px-3 py-2 text-sm font-semibold text-navy-dark">
        {userIds.length} {isID ? 'penerima' : userIds.length === 1 ? 'recipient' : 'recipients'}
      </p>}
      <details className="rounded-xl border border-slate-200 px-3">
        <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold text-navy-dark">{isID ? 'Referensi (opsional)' : 'Reference (optional)'}</summary>
        <div className="grid gap-3 pb-3 sm:grid-cols-2">
          <SelectField label={isID ? 'Jenis referensi' : 'Reference type'} value={form.referenceType}
            onChange={event => patch({ referenceType: event.target.value as NotificationReferenceType | '' })}
            options={[{ value: '', label: '—' }, ...Object.entries(references).map(([value, pair]) => ({ value, label: pair[isID ? 0 : 1] }))]} />
          <TextField label={isID ? 'ID referensi' : 'Reference ID'} inputMode="numeric" value={form.referenceId}
            onChange={event => patch({ referenceId: event.target.value })} />
        </div>
      </details>
      <div className="space-y-3 border-t border-slate-200 pt-3">
        <p className="text-sm font-semibold text-navy-dark">{isID ? 'Isi notifikasi' : 'Notification content'}</p>
        <OperationsFilters label={isID ? 'Isi notifikasi' : 'Notification content'} value={form.mode}
          items={[{ value: 'template', label: isID ? 'Pakai template' : 'Use template' }, { value: 'custom', label: isID ? 'Tulis sendiri' : 'Write a message' }]}
          onChange={mode => patch({ mode })} />
        {custom ? <>
          <TextField label={isID ? 'Judul' : 'Title'} required maxLength={200} value={form.title}
            onChange={event => patch({ title: event.target.value })} />
          <TextAreaField label={isID ? 'Pesan' : 'Message'} required maxLength={8000} rows={4} value={form.message}
            onChange={event => patch({ message: event.target.value })} />
        </> : <p className="text-sm text-slate-600">{isID ? 'Sistem menggunakan template aktif untuk jenis notifikasi yang dipilih.' : 'The system uses active templates for the selected notification type.'}</p>}
      </div>
    </AdminFormModal>
  );
}
