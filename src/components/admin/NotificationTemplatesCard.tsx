import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle, CheckCircle2, FileText, Loader2, Plus, RotateCw, Save, X, XCircle,
} from 'lucide-react';
import { adminApi } from '../../api/admin';
import { ApiError } from '../../lib/http';
import {
  CreateNotificationTemplateRequest,
  NotificationChannel,
  NotificationEventType,
  NotificationTemplateResponse,
} from '../../types/api/notification';

interface NotificationTemplatesCardProps {
  isID: boolean;
  /** Same catalogue the manual-send form offers, so both stay in step. */
  eventTypes: NotificationEventType[];
}

const CHANNELS: NotificationChannel[] = ['IN_APP', 'EMAIL'];

const INPUT =
  'w-full min-h-11 p-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-900 placeholder-slate-300 focus:outline-none focus:border-slate-900 transition-colors';
const LABEL = 'text-[11px] font-semibold text-slate-500 block mb-1.5';

const emptyDraft = (eventType: NotificationEventType): CreateNotificationTemplateRequest => ({
  eventType,
  channel: 'IN_APP',
  titleTemplate: '',
  messageTemplate: '',
  isActive: true,
});

const channelLabel = (channel: NotificationChannel, isID: boolean) =>
  channel === 'IN_APP' ? (isID ? 'Dalam Aplikasi' : 'In-app') : 'Email';

export const NotificationTemplatesCard: React.FC<NotificationTemplatesCardProps> = ({
  isID,
  eventTypes,
}) => {
  const [templates, setTemplates] = useState<NotificationTemplateResponse[]>([]);
  const [loading, setLoading] = useState(false);
  // Kept apart from "no templates": a failed load must never read as an empty
  // catalogue, or a broken service looks like a fresh install.
  const [loadError, setLoadError] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<CreateNotificationTemplateRequest>(() => emptyDraft(eventTypes[0]));
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<number | null>(null);

  const [editing, setEditing] = useState<NotificationTemplateResponse | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setTemplates(await adminApi.listNotificationTemplates());
    } catch (err) {
      setLoadError(
        err instanceof ApiError
          ? err.message
          : isID ? 'Gagal memuat template notifikasi.' : 'Failed to load notification templates.'
      );
    } finally {
      setLoading(false);
    }
  }, [isID]);

  useEffect(() => { load(); }, [load]);

  const failureMessage = (err: unknown, fallback: string) =>
    err instanceof ApiError ? err.message : fallback;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.titleTemplate.trim() || !draft.messageTemplate.trim()) {
      setFormError(isID ? 'Judul dan pesan template wajib diisi.' : 'Title and message templates are required.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const created = await adminApi.createNotificationTemplate({
        ...draft,
        titleTemplate: draft.titleTemplate.trim(),
        messageTemplate: draft.messageTemplate.trim(),
      });
      setTemplates((prev) => [created, ...prev]);
      setDraft(emptyDraft(eventTypes[0]));
      setCreating(false);
      setSavedId(created.id);
    } catch (err) {
      // A duplicate (eventType, channel) pair is rejected by the backend; the
      // message explains which pair already exists, so show it verbatim.
      setFormError(failureMessage(err, isID ? 'Gagal menyimpan template.' : 'Failed to save the template.'));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (!editing.titleTemplate.trim() || !editing.messageTemplate.trim()) {
      setFormError(isID ? 'Judul dan pesan template wajib diisi.' : 'Title and message templates are required.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const updated = await adminApi.updateNotificationTemplate(editing.id, {
        titleTemplate: editing.titleTemplate.trim(),
        messageTemplate: editing.messageTemplate.trim(),
        isActive: editing.isActive,
      });
      setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setEditing(null);
      setSavedId(updated.id);
    } catch (err) {
      setFormError(failureMessage(err, isID ? 'Gagal memperbarui template.' : 'Failed to update the template.'));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (template: NotificationTemplateResponse) => {
    setBusyId(template.id);
    setFormError(null);
    try {
      const updated = await adminApi.updateNotificationTemplate(template.id, { isActive: !template.isActive });
      setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err) {
      setFormError(failureMessage(err, isID ? 'Gagal mengubah status template.' : 'Failed to change the template status.'));
    } finally {
      setBusyId(null);
    }
  };

  const sorted = useMemo(
    () => [...templates].sort((a, b) =>
      a.eventType === b.eventType ? a.channel.localeCompare(b.channel) : a.eventType.localeCompare(b.eventType)
    ),
    [templates]
  );

  return (
    <section className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm sm:text-base font-semibold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            {isID ? 'Template Notifikasi' : 'Notification Templates'}
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-400 font-light mt-0.5">
            {isID
              ? 'Judul dan isi pesan bawaan per event. Pakai token {{namaVariabel}} untuk data dinamis.'
              : 'Default title and body per event. Use {{variableName}} tokens for dynamic data.'}
          </p>
          <code className="inline-block mt-1 text-[9px] sm:text-[10px] text-slate-400 bg-slate-50 border border-slate-100 rounded-md px-1.5 py-0.5 font-mono">
            /api/admin/notification-templates
          </code>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="min-h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold inline-flex items-center gap-2 cursor-pointer disabled:opacity-40"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {isID ? 'Muat Ulang' : 'Refresh'}
          </button>
          <button
            type="button"
            onClick={() => { setCreating((open) => !open); setFormError(null); }}
            aria-expanded={creating}
            className="min-h-11 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            {isID ? 'Template Baru' : 'New Template'}
          </button>
        </div>
      </div>

      {formError && (
        <p role="alert" className="flex items-start gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
          <span>{formError}</span>
        </p>
      )}

      {creating && (
        <form onSubmit={handleCreate} className="rounded-2xl border border-slate-200 p-4 space-y-4 bg-slate-50/60">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label>
              <span className={LABEL}>{isID ? 'Jenis Event' : 'Event Type'}</span>
              <select
                value={draft.eventType}
                onChange={(e) => setDraft({ ...draft, eventType: e.target.value as NotificationEventType })}
                className={`${INPUT} cursor-pointer bg-white`}
              >
                {eventTypes.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </label>
            <label>
              <span className={LABEL}>Channel</span>
              <select
                value={draft.channel}
                onChange={(e) => setDraft({ ...draft, channel: e.target.value as NotificationChannel })}
                className={`${INPUT} cursor-pointer bg-white`}
              >
                {CHANNELS.map((c) => <option key={c} value={c}>{channelLabel(c, isID)}</option>)}
              </select>
            </label>
          </div>

          <label className="block">
            <span className={LABEL}>
              {isID ? 'Judul Template' : 'Title Template'} <span className="text-rose-500">*</span>
            </span>
            <input
              value={draft.titleTemplate}
              maxLength={200}
              onChange={(e) => setDraft({ ...draft, titleTemplate: e.target.value })}
              placeholder={isID ? 'mis. Booking {{bookingCode}} dikonfirmasi' : 'e.g. Booking {{bookingCode}} confirmed'}
              className={`${INPUT} bg-white`}
            />
          </label>

          <label className="block">
            <span className={LABEL}>
              {isID ? 'Isi Pesan' : 'Message Template'} <span className="text-rose-500">*</span>
            </span>
            <textarea
              value={draft.messageTemplate}
              rows={3}
              maxLength={4000}
              onChange={(e) => setDraft({ ...draft, messageTemplate: e.target.value })}
              placeholder={isID ? 'mis. Reservasi {{bookingCode}} sudah dikonfirmasi.' : 'e.g. Your reservation {{bookingCode}} is confirmed.'}
              className="w-full rounded-xl border border-slate-200 p-3 text-[13px] text-slate-900 placeholder-slate-300 resize-y bg-white focus:outline-none focus:border-slate-900"
            />
          </label>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 min-h-11">
              <input
                type="checkbox"
                checked={draft.isActive ?? true}
                onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 accent-slate-900"
              />
              {isID ? 'Aktifkan template ini' : 'Activate this template'}
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { setCreating(false); setFormError(null); }}
                className="min-h-11 px-4 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold cursor-pointer hover:bg-slate-100"
              >
                {isID ? 'Batal' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="min-h-11 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {isID ? 'Simpan Template' : 'Save Template'}
              </button>
            </div>
          </div>
        </form>
      )}

      {loadError ? (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 space-y-2">
          <p className="flex items-center gap-2 font-semibold">
            <AlertCircle className="w-4 h-4" />
            {loadError}
          </p>
          <button
            type="button"
            onClick={load}
            className="min-h-11 px-4 rounded-xl bg-white border border-rose-200 text-rose-700 font-semibold cursor-pointer hover:bg-rose-100"
          >
            {isID ? 'Coba lagi' : 'Try again'}
          </button>
        </div>
      ) : loading ? (
        <p className="px-4 py-10 text-center text-xs text-slate-400 font-light flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          {isID ? 'Memuat template...' : 'Loading templates...'}
        </p>
      ) : sorted.length === 0 ? (
        <p className="px-4 py-10 text-center text-xs text-slate-400 font-light">
          {isID ? 'Belum ada template notifikasi.' : 'No notification templates yet.'}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-xs min-w-[720px]">
            <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3">{isID ? 'Judul & Pesan' : 'Title & Message'}</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">{isID ? 'Diperbarui' : 'Updated'}</th>
                <th className="px-4 py-3 text-right">{isID ? 'Aksi' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700">
              {sorted.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors align-top">
                  <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                    {t.eventType.replace(/_/g, ' ')}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-[11px] whitespace-nowrap">
                    {channelLabel(t.channel, isID)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{t.titleTemplate}</p>
                    <p className="text-[11px] text-slate-500 font-light max-w-[380px]">{t.messageTemplate}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {t.isActive ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {isID ? 'Aktif' : 'Active'}
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 inline-flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        {isID ? 'Nonaktif' : 'Inactive'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                    {t.updatedAt ? t.updatedAt.replace('T', ' ').slice(0, 16) : '—'}
                    {savedId === t.id && (
                      <span className="block text-[10px] font-semibold text-emerald-600">
                        {isID ? 'Tersimpan' : 'Saved'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap space-x-1.5">
                    {busyId === t.id ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        {isID ? 'Memproses' : 'Processing'}
                      </span>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => { setEditing(t); setFormError(null); }}
                          className="min-h-11 px-3 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-[11px] cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleActive(t)}
                          className="min-h-11 px-3 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-[11px] cursor-pointer"
                        >
                          {t.isActive ? (isID ? 'Nonaktifkan' : 'Deactivate') : (isID ? 'Aktifkan' : 'Activate')}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-template-title"
        >
          <form onSubmit={handleUpdate} className="w-full max-w-xl bg-white rounded-2xl border border-slate-100 p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 id="edit-template-title" className="text-base font-semibold text-slate-900">
                  {isID ? 'Edit template' : 'Edit template'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {editing.eventType.replace(/_/g, ' ')} · {channelLabel(editing.channel, isID)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setEditing(null); setFormError(null); }}
                className="w-11 h-11 rounded-xl hover:bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer"
                aria-label={isID ? 'Tutup' : 'Close'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <label className="block">
              <span className={LABEL}>{isID ? 'Judul Template' : 'Title Template'}</span>
              <input
                value={editing.titleTemplate}
                maxLength={200}
                onChange={(e) => setEditing({ ...editing, titleTemplate: e.target.value })}
                className={INPUT}
              />
            </label>

            <label className="block">
              <span className={LABEL}>{isID ? 'Isi Pesan' : 'Message Template'}</span>
              <textarea
                value={editing.messageTemplate}
                rows={5}
                maxLength={4000}
                onChange={(e) => setEditing({ ...editing, messageTemplate: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-3 text-[13px] text-slate-900 resize-y focus:outline-none focus:border-slate-900"
              />
            </label>

            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 min-h-11">
              <input
                type="checkbox"
                checked={editing.isActive}
                onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 accent-slate-900"
              />
              {isID ? 'Template aktif' : 'Template active'}
            </label>

            {formError && (
              <p role="alert" className="flex items-start gap-2 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
                <span>{formError}</span>
              </p>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => { setEditing(null); setFormError(null); }}
                className="min-h-11 px-4 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold cursor-pointer hover:bg-slate-50"
              >
                {isID ? 'Batal' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="min-h-11 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {isID ? 'Simpan perubahan' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
};
