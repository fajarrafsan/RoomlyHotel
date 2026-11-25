import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, Bell, FileText, History, Search, Send } from 'lucide-react';
import { adminApi } from '../api/admin';
import { AdminAccessGuard } from '../components/admin/AdminAccessGuard';
import { AdminNotificationComposer } from '../components/admin/AdminNotificationComposer';
import { NotificationTemplatesCard } from '../components/admin/NotificationTemplatesCard';
import { OperationsDialog } from '../components/admin/OperationsDialog';
import {
  OperationsEmpty, OperationsList, OperationsNotice, OperationsPage, OperationsPager, OperationsTabs,
  operationButton, operationDate, operationField, operationSecondary,
} from '../components/admin/OperationsPage';
import { StatusPill } from '../components/admin/StatusPill';
import { useAuth } from '../context/AuthContext';
import { useOperationsQuery } from '../hooks/useOperationsQuery';
import { parseNotificationMessage } from '../lib/notificationFormatter';
import { notificationChannelLabel, notificationEventLabel, notificationEventTypes } from '../lib/notificationLabels';
import type { Language } from '../types';
import type { NotificationChannel, NotificationEventType, NotificationResponse } from '../types/api/notification';

const deliveryLabels: Record<string, [string, string]> = {
  PENDING: ['Menunggu', 'Pending'], SENT: ['Terkirim', 'Sent'], FAILED: ['Gagal', 'Failed'],
  READ: ['Dibaca', 'Read'], RETRYING: ['Dicoba ulang', 'Retrying'],
};
const emptyFilters = { userId: undefined as number | undefined, channel: '' as NotificationChannel | '', type: '' as NotificationEventType | '' };
const channels: NotificationChannel[] = ['IN_APP', 'EMAIL'];
type View = 'history' | 'templates';

export function AdminNotificationsPage({ language, onOpenAuth }: { language: Language; onOpenAuth?: () => void }) {
  const isID = language === 'ID';
  const { user, isLoading: authLoading } = useAuth();
  const allowed = user?.role === 'ADMIN';
  const [view, setView] = useState<View>('history');
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState(emptyFilters);
  const [userSearch, setUserSearch] = useState('');
  const [filterError, setFilterError] = useState<string | null>(null);
  const [composer, setComposer] = useState(false);
  const [selected, setSelected] = useState<NotificationResponse | null>(null);
  const [accepted, setAccepted] = useState(false);

  const readHistory = useCallback(() => adminApi.searchNotifications(page, 15, {
    userId: filters.userId, channel: filters.channel || undefined, type: filters.type || undefined,
  }), [page, filters, user?.userId]);
  const readTemplates = useCallback(() => adminApi.listNotificationTemplates(), [user?.userId]);
  const history = useOperationsQuery(readHistory, allowed && view === 'history', isID ? 'Gagal memuat riwayat notifikasi.' : 'Could not load notification history.');
  const templates = useOperationsQuery(readTemplates, allowed && view === 'templates', isID ? 'Gagal memuat template.' : 'Could not load templates.');
  const active = view === 'history' ? history : templates;
  const totalPages = history.data?.totalPages;

  useEffect(() => {
    if (totalPages !== undefined && page > 0 && page >= totalPages) setPage(Math.max(0, totalPages - 1));
  }, [page, totalPages]);

  const filterByUser = (event: FormEvent) => {
    event.preventDefault();
    const raw = userSearch.trim();
    const userId = raw ? Number(raw) : undefined;
    if (userId !== undefined && (!/^\d+$/.test(raw) || !Number.isSafeInteger(userId) || userId <= 0)) {
      setFilterError(isID ? 'Masukkan ID pengguna berupa bilangan bulat positif.' : 'Enter a positive whole-number user ID.');
      return;
    }
    setFilterError(null);
    setUserSearch(raw);
    if (userId !== filters.userId) {
      setPage(0);
      setFilters({ ...filters, userId });
    }
  };

  if (!allowed) {
    if (authLoading) return <OperationsEmpty loading isID={isID} empty="" />;
    return <AdminAccessGuard isID={isID} onOpenAuth={onOpenAuth}>{null}</AdminAccessGuard>;
  }

  const filtered = Boolean(filters.userId || filters.channel || filters.type);
  const eventOptions = notificationEventTypes.map(value => ({ value, label: notificationEventLabel(value, isID) }));
  const deliveryBadge = (row: NotificationResponse) => (
    <StatusPill status={row.deliveryStatus} label={deliveryLabels[row.deliveryStatus]?.[isID ? 0 : 1]} />
  );
  const detail = selected ? parseNotificationMessage(selected.message) : null;

  return (
    <OperationsPage icon={Bell} title={isID ? 'Notifikasi' : 'Notifications'}
      description={isID ? 'Kirim notifikasi, pantau pengirimannya, dan kelola template pesan.' : 'Send notifications, track delivery, and manage message templates.'}
      isID={isID} loading={active.loading} blocked={composer || !!selected} onRefresh={() => void active.refresh()}
      action={view === 'history' && <button type="button" onClick={() => { setAccepted(false); setComposer(true); }}
        className={operationButton + ' bg-gold-soft text-[#162951] hover:bg-white'}><Send className="size-4" aria-hidden />{isID ? 'Kirim notifikasi' : 'Send notification'}</button>}>
      <OperationsTabs<View> label={isID ? 'Bagian notifikasi' : 'Notification sections'} value={view} items={[
        { value: 'history', label: isID ? 'Riwayat' : 'History', icon: History },
        { value: 'templates', label: isID ? 'Template pesan' : 'Message templates', icon: FileText },
      ]} onChange={setView} />
      {view === 'templates' ? <NotificationTemplatesCard language={language} {...templates} /> : <>
        {history.error && <OperationsNotice>{history.error}</OperationsNotice>}
        {accepted && <OperationsNotice success>{isID ? 'Permintaan pengiriman diterima.' : 'Notification request accepted.'}</OperationsNotice>}
        <OperationsList title={isID ? 'Riwayat pengiriman' : 'Delivery history'} isID={isID} rows={history.data?.content ?? []} loading={history.loading}
          description={history.data && !history.loading ? `${history.data.totalElements.toLocaleString(isID ? 'id-ID' : 'en-US')} ${isID ? 'notifikasi ditemukan' : 'notifications found'}` : undefined}
          empty={history.error ? (isID ? 'Riwayat pengiriman belum tersedia.' : 'Delivery history is unavailable.')
            : filtered ? (isID ? 'Tidak ada notifikasi yang cocok.' : 'No matching notifications.')
              : (isID ? 'Belum ada riwayat pengiriman.' : 'There is no delivery history yet.')}
          controls={<div className="w-full min-w-0 space-y-2">
            <form onSubmit={filterByUser} className="grid min-w-0 gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(175px,auto)_minmax(140px,auto)]">
              <div className="flex min-w-0 gap-2 sm:col-span-2 lg:col-span-1">
                <label className="relative min-w-0 flex-1">
                  <span className="sr-only">{isID ? 'Cari ID pengguna' : 'Search by user ID'}</span>
                  <Search className="pointer-events-none absolute top-3.5 left-3 size-4 text-slate-500" aria-hidden />
                  <input type="search" inputMode="numeric" value={userSearch} onChange={event => { setUserSearch(event.target.value); setFilterError(null); }}
                    className={operationField + ' pl-9'} placeholder={isID ? 'Cari ID pengguna…' : 'Search user ID…'} />
                </label>
                <button type="submit" className={operationSecondary}>{isID ? 'Cari' : 'Search'}</button>
              </div>
              <select aria-label={isID ? 'Filter jenis notifikasi' : 'Filter notification type'} value={filters.type}
                onChange={event => { setPage(0); setFilters({ ...filters, type: event.target.value as NotificationEventType | '' }); }} className={operationField + ' bg-white'}>
                <option value="">{isID ? 'Semua jenis' : 'All types'}</option>
                {eventOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <select aria-label={isID ? 'Filter kanal notifikasi' : 'Filter notification channel'} value={filters.channel}
                onChange={event => { setPage(0); setFilters({ ...filters, channel: event.target.value as NotificationChannel | '' }); }} className={operationField + ' bg-white'}>
                <option value="">{isID ? 'Semua kanal' : 'All channels'}</option>
                {channels.map(channel => <option key={channel} value={channel}>{notificationChannelLabel(channel, isID)}</option>)}
              </select>
            </form>
            {filterError && <OperationsNotice>{filterError}</OperationsNotice>}
            {filtered && <button type="button" onClick={() => { setPage(0); setUserSearch(''); setFilterError(null); setFilters(emptyFilters); }}
              className={operationSecondary}>{isID ? 'Atur ulang filter' : 'Reset filters'}</button>}
          </div>}
          primary={{ label: isID ? 'Notifikasi' : 'Notification', render: row => (
            <div className="max-w-[32rem]">
              <p className="font-semibold text-navy-dark [overflow-wrap:anywhere]">{row.title}</p>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600 [overflow-wrap:anywhere]">{parseNotificationMessage(row.message).cleanPreview}</p>
            </div>
          ) }}
          columns={[
            { label: isID ? 'Penerima' : 'Recipient', render: row => `#${row.userId}` },
            { label: isID ? 'Jenis' : 'Type', render: row => notificationEventLabel(row.notificationType, isID) },
            { label: isID ? 'Kanal' : 'Channel', render: row => notificationChannelLabel(row.channel, isID) },
            { label: isID ? 'Waktu' : 'Time', render: row => operationDate(row.sentAt || row.createdAt, language) },
          ]}
          status={deliveryBadge}
          actions={row => <button type="button" onClick={() => setSelected(row)} aria-label={`${isID ? 'Lihat detail' : 'View details'} ${row.title}`}
            className={operationSecondary}>{isID ? 'Lihat detail' : 'View details'}<ArrowRight className="size-4" aria-hidden /></button>}
          footer={(page > 0 || (totalPages ?? 0) > 1) && <OperationsPager page={page} totalPages={totalPages ?? 0} isID={isID} disabled={history.loading} onChange={setPage} />}
        />
      </>}

      {composer && <AdminNotificationComposer isID={isID} onClose={() => setComposer(false)} onAccepted={() => {
        setComposer(false);
        setAccepted(true);
        if (page > 0) setPage(0);
        else void history.refresh();
      }} />}

      {selected && detail && <OperationsDialog title={isID ? 'Detail pengiriman' : 'Delivery details'}
        description={notificationChannelLabel(selected.channel, isID)} isID={isID} onClose={() => setSelected(null)}>
        <div className="space-y-4">
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-lg font-semibold text-navy-dark [overflow-wrap:anywhere]">{selected.title}</h3>
              {deliveryBadge(selected)}
            </div>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700 [overflow-wrap:anywhere]">{detail.cleanPreview || '—'}</p>
          </div>
          <dl className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            {[
              [isID ? 'ID pengguna' : 'User ID', `#${selected.userId}`],
              [isID ? 'Jenis' : 'Type', notificationEventLabel(selected.notificationType, isID)],
              [isID ? 'Dibuat' : 'Created', operationDate(selected.createdAt, language)],
              [isID ? 'Dikirim' : 'Sent', operationDate(selected.sentAt, language)],
              ...(selected.channel === 'IN_APP' || selected.isRead ? [[isID ? 'Status baca' : 'Read status',
                selected.isRead ? (selected.readAt ? operationDate(selected.readAt, language) : (isID ? 'Dibaca' : 'Read'))
                  : (isID ? 'Belum dibaca' : 'Unread')]] : []),
              ...(selected.referenceType || selected.referenceId != null ? [[isID ? 'Referensi' : 'Reference',
                [selected.referenceType?.replace(/_/g, ' '), selected.referenceId != null ? `#${selected.referenceId}` : null].filter(Boolean).join(' · ')]] : []),
              ...(detail.invoiceNumber ? [['Invoice', detail.invoiceNumber]] : []),
              ...(detail.bookingCode ? [[isID ? 'Kode reservasi' : 'Booking code', detail.bookingCode]] : []),
              ...(detail.totalPaid ? [[isID ? 'Total dibayar' : 'Total paid', detail.totalPaid]] : []),
            ].map(([label, value]) => (
              <div key={label} className="min-w-0">
                <dt className="text-xs text-slate-600">{label}</dt>
                <dd className="mt-1 text-sm font-semibold text-navy-dark [overflow-wrap:anywhere]">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </OperationsDialog>}
    </OperationsPage>
  );
}
