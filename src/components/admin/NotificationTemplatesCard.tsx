import { useState, type FormEvent } from 'react';
import { Pencil, Plus, Power } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { ApiError } from '../../lib/http';
import { notificationChannelLabel, notificationEventLabel, notificationEventTypes } from '../../lib/notificationLabels';
import type { Language } from '../../types';
import type {
  CreateNotificationTemplateRequest, NotificationChannel, NotificationEventType, NotificationTemplateResponse,
} from '../../types/api/notification';
import { AdminFormModal, SelectField, TextAreaField, TextField } from './AdminFormModal';
import {
  OperationsList, OperationsNotice, operationDate, operationField, operationPrimary, operationSecondary,
} from './OperationsPage';
import { StatusPill } from './StatusPill';

const channels: NotificationChannel[] = ['IN_APP', 'EMAIL'];
const emptyDraft: CreateNotificationTemplateRequest = {
  eventType: 'BOOKING_CONFIRMED', channel: 'IN_APP', titleTemplate: '', messageTemplate: '', isActive: true,
};

export function NotificationTemplatesCard({ language, data, loading, error, refresh }: {
  language: Language;
  data: NotificationTemplateResponse[] | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}) {
  const isID = language === 'ID';
  const [eventType, setEventType] = useState('');
  const [channel, setChannel] = useState('');
  const [editor, setEditor] = useState<{ id: number | null; draft: CreateNotificationTemplateRequest } | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const open = (template?: NotificationTemplateResponse) => {
    setActionError(null);
    setEditor(template ? { id: template.id, draft: {
      eventType: template.eventType, channel: template.channel, titleTemplate: template.titleTemplate,
      messageTemplate: template.messageTemplate, isActive: template.isActive,
    } } : { id: null, draft: { ...emptyDraft } });
  };

  const patchDraft = (values: Partial<CreateNotificationTemplateRequest>) => {
    setEditor(previous => previous && ({ ...previous, draft: { ...previous.draft, ...values } }));
    setActionError(null);
  };

  const run = async (task: () => Promise<NotificationTemplateResponse>, message: string) => {
    if (busy) return;
    setBusy(true);
    setActionError(null);
    setNotice(null);
    try {
      await task();
      setEditor(null);
      setNotice(message);
      await refresh();
    } catch (failure) {
      setActionError(failure instanceof ApiError ? failure.message : (isID ? 'Template gagal disimpan.' : 'Could not save the template.'));
    } finally {
      setBusy(false);
    }
  };

  const save = (event: FormEvent) => {
    event.preventDefault();
    if (!editor) return;
    const { id, draft } = editor;
    const titleTemplate = draft.titleTemplate.trim();
    const messageTemplate = draft.messageTemplate.trim();
    if (!titleTemplate || !messageTemplate) {
      setActionError(isID ? 'Judul dan isi pesan wajib diisi.' : 'Enter a title and message.');
      return;
    }
    const fields = { titleTemplate, messageTemplate, isActive: draft.isActive };
    void run(() => id === null ? adminApi.createNotificationTemplate({ ...draft, ...fields })
      : adminApi.updateNotificationTemplate(id, fields), isID ? 'Template disimpan.' : 'Template saved.');
  };

  const eventOptions = notificationEventTypes.map(value => ({ value, label: notificationEventLabel(value, isID) }));
  const channelOptions = channels.map(value => ({ value, label: notificationChannelLabel(value, isID) }));
  const rows = (data ?? []).filter(item => (!eventType || item.eventType === eventType) && (!channel || item.channel === channel))
    .sort((first, second) => notificationEventLabel(first.eventType, isID).localeCompare(notificationEventLabel(second.eventType, isID))
      || first.channel.localeCompare(second.channel));
  const draft = editor?.draft;

  return (
    <div className="space-y-3">
      {error && <OperationsNotice>{error}</OperationsNotice>}
      {!editor && actionError && <OperationsNotice>{actionError}</OperationsNotice>}
      {notice && <OperationsNotice success>{notice}</OperationsNotice>}
      <OperationsList title={isID ? 'Template notifikasi' : 'Notification templates'} isID={isID} rows={rows} loading={loading}
        description={data && !loading ? `${rows.length} ${isID ? 'template ditampilkan' : 'templates shown'}` : undefined}
        empty={error ? (isID ? 'Daftar template belum tersedia.' : 'Templates are unavailable.')
          : eventType || channel ? (isID ? 'Tidak ada template yang cocok.' : 'No matching templates.')
            : (isID ? 'Belum ada template notifikasi.' : 'There are no notification templates yet.')}
        controls={<div className="grid w-full min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(130px,auto)_auto] lg:w-auto lg:min-w-lg">
          <select aria-label={isID ? 'Filter jenis template' : 'Filter template event'} value={eventType} onChange={event => setEventType(event.target.value)} className={operationField + ' bg-white'}>
            <option value="">{isID ? 'Semua jenis' : 'All events'}</option>
            {eventOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <select aria-label={isID ? 'Filter kanal template' : 'Filter template channel'} value={channel} onChange={event => setChannel(event.target.value)} className={operationField + ' bg-white'}>
            <option value="">{isID ? 'Semua kanal' : 'All channels'}</option>
            {channelOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <button type="button" disabled={busy} onClick={() => open()} className={operationPrimary}>
            <Plus className="size-4" aria-hidden />{isID ? 'Tambah template' : 'Add template'}
          </button>
        </div>}
        primary={{ label: 'Template', render: item => (
          <div className="max-w-[29rem]">
            <p className="font-semibold text-navy-dark [overflow-wrap:anywhere]">{item.titleTemplate}</p>
            <p className="mt-1 text-xs text-slate-600">{notificationEventLabel(item.eventType, isID)}</p>
          </div>
        ) }}
        columns={[
          { label: isID ? 'Kanal' : 'Channel', render: item => notificationChannelLabel(item.channel, isID) },
          { label: isID ? 'Diperbarui' : 'Updated', render: item => operationDate(item.updatedAt, language) },
        ]}
        status={item => <StatusPill status={item.isActive ? 'ACTIVE' : 'INACTIVE'}
          label={item.isActive ? (isID ? 'Aktif' : 'Active') : (isID ? 'Nonaktif' : 'Inactive')} />}
        actions={item => <>
          <button type="button" disabled={busy || loading} onClick={() => open(item)} aria-label={`${isID ? 'Ubah template' : 'Edit template'} ${item.titleTemplate}`} className={operationSecondary}>
            <Pencil className="size-4" aria-hidden />{isID ? 'Ubah' : 'Edit'}
          </button>
          <button type="button" disabled={busy || loading} onClick={() => void run(
            () => adminApi.updateNotificationTemplate(item.id, { isActive: !item.isActive }),
            item.isActive ? (isID ? 'Template dinonaktifkan.' : 'Template deactivated.') : (isID ? 'Template diaktifkan.' : 'Template activated.'),
          )} aria-label={`${item.isActive ? (isID ? 'Nonaktifkan' : 'Deactivate') : (isID ? 'Aktifkan' : 'Activate')} ${item.titleTemplate}`} className={operationSecondary}>
            <Power className="size-4" aria-hidden />{item.isActive ? (isID ? 'Nonaktifkan' : 'Deactivate') : (isID ? 'Aktifkan' : 'Activate')}
          </button>
        </>}
      />
      {editor && draft && <AdminFormModal isID={isID} title={editor.id === null ? (isID ? 'Tambah template' : 'Add template') : (isID ? 'Ubah template' : 'Edit template')}
        subtitle={editor.id === null ? undefined : `${notificationEventLabel(draft.eventType, isID)} · ${notificationChannelLabel(draft.channel, isID)}`}
        submitting={busy} error={actionError} onSubmit={save} onClose={() => { setEditor(null); setActionError(null); }}
        submitLabel={isID ? 'Simpan template' : 'Save template'}>
        {editor.id === null && <div className="grid gap-3 sm:grid-cols-2">
          <SelectField label={isID ? 'Jenis notifikasi' : 'Notification type'} options={eventOptions} value={draft.eventType}
            onChange={event => patchDraft({ eventType: event.target.value as NotificationEventType })} />
          <SelectField label={isID ? 'Kanal' : 'Channel'} options={channelOptions} value={draft.channel}
            onChange={event => patchDraft({ channel: event.target.value as NotificationChannel })} />
        </div>}
        <TextField label={isID ? 'Judul template' : 'Template title'} required maxLength={200} value={draft.titleTemplate}
          onChange={event => patchDraft({ titleTemplate: event.target.value })} />
        <TextAreaField label={isID ? 'Isi pesan' : 'Message'} required rows={6} maxLength={4000} value={draft.messageTemplate}
          onChange={event => patchDraft({ messageTemplate: event.target.value })}
          hint={isID ? 'Gunakan variabel yang tersedia untuk jenis notifikasi ini, misalnya {{bookingCode}} untuk reservasi.' : 'Use variables available for this event, such as {{bookingCode}} for a reservation.'} />
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
          <input type="checkbox" checked={draft.isActive ?? true} onChange={event => patchDraft({ isActive: event.target.checked })} className="size-4 accent-navy" />
          {isID ? 'Template aktif' : 'Template active'}
        </label>
      </AdminFormModal>}
    </div>
  );
}
