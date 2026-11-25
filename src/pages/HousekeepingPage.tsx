import { useCallback, useState, type FormEvent } from 'react';
import { Ban, BedDouble, CheckCircle2, ClipboardCheck, Clock3, LoaderCircle, Pencil, Play, Plus, ShieldAlert, Wrench } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOperationsQuery } from '../hooks/useOperationsQuery';
import { housekeepingApi } from '../api/housekeeping';
import { ApiError } from '../lib/http';
import type { Language } from '../types';
import type { HousekeepingTaskResponse, HousekeepingTaskStatus, HousekeepingTaskType } from '../types/api';
import { StatusPill } from '../components/admin/StatusPill';
import { OperationsDialog } from '../components/admin/OperationsDialog';
import { AdminCardsSkeleton } from '../components/admin/AdminSkeleton';
import {
  OperationsEmpty, OperationsFilters, OperationsNotice, OperationsPage,
  operationButton, operationDanger, operationDate, operationField, operationPanel, operationPrimary, operationSecondary,
} from '../components/admin/OperationsPage';

const accessRoles = new Set(['ADMIN', 'RECEPTIONIST', 'HOUSEKEEPING', 'MAINTENANCE']);
const statusLabels: Record<HousekeepingTaskStatus, [string, string]> = {
  PENDING: ['Menunggu', 'Pending'], IN_PROGRESS: ['Dikerjakan', 'In progress'],
  DONE: ['Selesai', 'Done'], CANCELLED: ['Dibatalkan', 'Cancelled'],
};
const typeLabels: Record<HousekeepingTaskType, [string, string]> = {
  CLEANING: ['Pembersihan', 'Cleaning'], INSPECTION: ['Inspeksi', 'Inspection'], MAINTENANCE: ['Perawatan', 'Maintenance'],
};
const emptyForm = { roomUnitId: '', hotelId: '', bookingId: '', assignee: '', taskType: 'CLEANING' as HousekeepingTaskType, notes: '' };
const optionalId = (value: string) => Number.isInteger(Number(value)) && Number(value) > 0 ? Number(value) : undefined;

export function HousekeepingPage({ language }: { language: Language }) {
  const isID = language === 'ID';
  const locale = isID ? 0 : 1;
  const { user, isLoading: authLoading } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const allowed = Boolean(user && accessRoles.has(user.role));
  const canManage = isAdmin || user?.role === 'RECEPTIONIST';
  const canWork = isAdmin || user?.role === 'HOUSEKEEPING' || user?.role === 'MAINTENANCE';

  const read = useCallback(() => housekeepingApi.list(), [user?.userId]);
  const { data, loading, error, refresh } = useOperationsQuery(read, allowed, isID ? 'Gagal memuat tugas housekeeping.' : 'Could not load housekeeping tasks.');
  const tasks = data ?? [];
  const [filter, setFilter] = useState('');
  const [editor, setEditor] = useState<HousekeepingTaskResponse | 'create' | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | 'editor' | null>(null);
  const [notice, setNotice] = useState<{ text: string; success: boolean } | null>(null);

  const openEditor = (task: HousekeepingTaskResponse | 'create') => {
    setEditor(task);
    setFormError(null);
    setForm(task === 'create' ? emptyForm : {
      roomUnitId: String(task.roomUnitId),
      hotelId: task.hotelId == null ? '' : String(task.hotelId),
      bookingId: task.bookingId == null ? '' : String(task.bookingId),
      assignee: task.assignedToUserId == null ? '' : String(task.assignedToUserId),
      taskType: task.taskType,
      notes: task.notes || '',
    });
  };

  const runTask = async (id: number, action: () => Promise<HousekeepingTaskResponse>, success: string) => {
    if (busy != null || loading) return;
    setBusy(id);
    setNotice(null);
    try {
      await action();
      setNotice({ text: success, success: true });
      await refresh();
    } catch (failure) {
      setNotice({ text: failure instanceof ApiError ? failure.message : (isID ? 'Tindakan gagal diproses.' : 'The task action failed.'), success: false });
    } finally {
      setBusy(null);
    }
  };

  const saveTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editor || busy != null || !canManage) return;
    const roomUnitId = optionalId(form.roomUnitId);
    if (!roomUnitId) {
      setFormError(isID ? 'ID unit kamar harus angka positif.' : 'Room unit ID must be a positive whole number.');
      return;
    }
    setBusy('editor');
    setFormError(null);
    setNotice(null);
    try {
      if (editor === 'create') {
        await housekeepingApi.create({
          roomUnitId,
          hotelId: isAdmin ? optionalId(form.hotelId) : user?.hotelId ?? undefined,
          bookingId: optionalId(form.bookingId),
          assignedToUserId: isAdmin ? optionalId(form.assignee) : undefined,
          taskType: form.taskType,
          notes: form.notes.trim() || undefined,
        });
      } else {
        await housekeepingApi.update(editor.id, {
          assignedToUserId: isAdmin ? optionalId(form.assignee) : undefined,
          taskType: form.taskType,
          notes: form.notes.trim(),
        });
      }
      setNotice({ text: editor === 'create' ? (isID ? 'Tugas baru dibuat.' : 'Task created.') : (isID ? 'Perubahan tugas disimpan.' : 'Task updated.'), success: true });
      setEditor(null);
      await refresh();
    } catch (failure) {
      setFormError(failure instanceof ApiError ? failure.message : (isID ? 'Tugas tidak dapat disimpan.' : 'The task could not be saved.'));
    } finally {
      setBusy(null);
    }
  };

  if (!allowed) return (
    <section className={operationPanel + ' mx-auto mt-6 max-w-lg p-6 text-center'}>
      {authLoading ? <LoaderCircle className="mx-auto mb-3 size-7 text-navy motion-safe:animate-spin" aria-hidden /> : <ShieldAlert className="mx-auto mb-3 size-7 text-navy" aria-hidden />}
      <h1 className="text-lg font-semibold text-navy-dark">{authLoading ? (isID ? 'Memeriksa sesi staf…' : 'Checking staff session…') : (isID ? 'Akses operasional diperlukan' : 'Operations access required')}</h1>
      {!authLoading && <p className="mt-2 text-sm text-slate-600">{isID ? 'Halaman ini tersedia untuk admin, resepsionis, housekeeping, dan maintenance.' : 'This page is available to admins, receptionists, housekeeping, and maintenance staff.'}</p>}
    </section>
  );

  const visible = filter ? tasks.filter(task => task.status === filter) : tasks;
  const statusOptions = [{ value: '', label: isID ? 'Semua tugas' : 'All tasks' },
    ...Object.entries(statusLabels).map(([value, labels]) => ({ value, label: labels[locale] }))];
  const summaries = [
    { status: 'PENDING', icon: Clock3, tone: 'bg-gold-soft text-gold-dark' },
    { status: 'IN_PROGRESS', icon: Wrench, tone: 'bg-navy-soft text-navy' },
    { status: 'DONE', icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-800' },
  ] as const;

  return (
    <OperationsPage icon={ClipboardCheck} title="Housekeeping" description={isID ? 'Atur pembersihan, inspeksi, dan perawatan kamar.' : 'Manage room cleaning, inspections, and maintenance.'}
      image="/images/seed/rooms/deluxe-1.jpg" isID={isID} loading={loading} onRefresh={() => void refresh()} blocked={busy != null || !!editor}
      action={canManage && <button type="button" disabled={loading || busy != null} onClick={() => openEditor('create')} className={operationButton + ' bg-gold-soft text-navy-dark hover:bg-white'}><Plus className="size-4" aria-hidden />{isID ? 'Tugas baru' : 'New task'}</button>}>
      <dl className="grid grid-cols-3 gap-2 sm:gap-4">
        {summaries.map(({ status, icon: Icon, tone }) => (
          <div key={status} className={operationPanel + ' p-3 sm:flex sm:items-center sm:gap-4 sm:p-5'}>
            <span className={`mb-2 grid size-8 shrink-0 place-items-center rounded-lg sm:mb-0 sm:size-11 ${tone}`}><Icon className="size-4 sm:size-5" aria-hidden /></span>
            <div className="min-w-0">
              <dt className="break-words text-xs font-semibold text-slate-600 sm:text-sm">{statusLabels[status][locale]}</dt>
              <dd className="mt-0.5 text-xl font-bold text-navy-dark tabular-nums sm:text-2xl">{loading || error ? '—' : tasks.filter(task => task.status === status).length}</dd>
            </div>
          </div>
        ))}
      </dl>

      {error && <OperationsNotice>{error}</OperationsNotice>}
      {notice && <OperationsNotice success={notice.success}>{notice.text}</OperationsNotice>}

      <section aria-labelledby="housekeeping-tasks" className="space-y-3">
        <div className={operationPanel + ' flex flex-wrap items-center justify-between gap-3 p-4'}>
          <div>
            <h2 id="housekeeping-tasks" className="text-lg font-semibold text-navy-dark">{isID ? 'Daftar tugas' : 'Task list'}</h2>
            {!loading && !error && <p className="mt-0.5 text-sm text-slate-600">{visible.length} {isID ? 'tugas ditampilkan' : 'tasks shown'}</p>}
          </div>
          <OperationsFilters label={isID ? 'Status tugas' : 'Task status'} items={statusOptions} value={filter} onChange={setFilter} />
        </div>

        {loading && visible.length === 0 ? <AdminCardsSkeleton isID={isID} layout="tasks" /> : visible.length === 0 ? (
          <div className={operationPanel}><OperationsEmpty loading={false} isID={isID} empty={error ? (isID ? 'Daftar tugas belum tersedia.' : 'The task list is unavailable.') : (isID ? 'Tidak ada tugas untuk filter ini.' : 'No tasks match this filter.')} /></div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2 lg:gap-4">
            {visible.map(task => {
              const working = busy === task.id;
              const blocked = loading || busy != null;
              const mine = task.assignedToUserId != null && task.assignedToUserId === user?.userId;
              const start = task.status === 'PENDING' && (isAdmin || (canWork && (mine || task.assignedToUserId == null)));
              const complete = task.status === 'IN_PROGRESS' && (isAdmin || (canWork && mine));
              const editable = canManage && (task.status === 'PENDING' || task.status === 'IN_PROGRESS');

              return (
                <article key={task.id} className={operationPanel + ' flex min-w-0 flex-col gap-3.5 p-4 sm:p-5'}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-navy-soft text-navy"><BedDouble className="size-5" aria-hidden /></span>
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold text-navy-dark">{typeLabels[task.taskType]?.[locale] ?? task.taskType}</h3>
                        <p className="text-sm text-slate-600">{isID ? 'Unit kamar' : 'Room unit'} #{task.roomUnitId} · {isID ? 'Tugas' : 'Task'} #{task.id}</p>
                      </div>
                    </div>
                    <StatusPill status={task.status} label={statusLabels[task.status]?.[locale]} />
                  </div>
                  <dl className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-sm sm:grid-cols-4">
                    <div><dt className="text-xs text-slate-600">Hotel</dt><dd className="mt-1 font-semibold">{task.hotelId == null ? '—' : `#${task.hotelId}`}</dd></div>
                    <div><dt className="text-xs text-slate-600">{isID ? 'Reservasi' : 'Reservation'}</dt><dd className="mt-1 font-semibold">{task.bookingId == null ? '—' : `#${task.bookingId}`}</dd></div>
                    <div><dt className="text-xs text-slate-600">{isID ? 'Petugas' : 'Assignee'}</dt><dd className="mt-1 font-semibold">{task.assignedToUserId == null ? '—' : `#${task.assignedToUserId}`}</dd></div>
                    <div><dt className="text-xs text-slate-600">{isID ? 'Dibuat' : 'Created'}</dt><dd className="mt-1 text-xs font-medium">{operationDate(task.createdAt, language)}</dd></div>
                  </dl>
                  {task.notes && <p className="whitespace-pre-wrap break-words text-sm leading-5 text-slate-700">{task.notes}</p>}
                  {(working || start || complete || editable) && (
                    <div className="mt-auto flex flex-wrap gap-2 border-t border-slate-200 pt-3">
                      {working ? <span role="status" className="inline-flex min-h-11 items-center gap-2 text-sm text-slate-600"><LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden />{isID ? 'Memproses…' : 'Processing…'}</span> : (
                        <>
                          {start && <button type="button" disabled={blocked} className={operationPrimary} onClick={() => void runTask(task.id, () => housekeepingApi.start(task.id, isAdmin ? task.assignedToUserId ?? undefined : user?.userId), isID ? 'Tugas dimulai.' : 'Task started.')}><Play className="size-4" aria-hidden />{isID ? 'Mulai' : 'Start'}</button>}
                          {complete && <button type="button" disabled={blocked} className={operationPrimary} onClick={() => void runTask(task.id, () => housekeepingApi.complete(task.id), isID ? 'Tugas diselesaikan.' : 'Task completed.')}><CheckCircle2 className="size-4" aria-hidden />{isID ? 'Selesaikan' : 'Complete'}</button>}
                          {editable && <button type="button" disabled={blocked} className={operationSecondary} onClick={() => openEditor(task)}><Pencil className="size-4" aria-hidden />Edit</button>}
                          {editable && task.status === 'PENDING' && <button type="button" disabled={blocked} className={operationDanger} onClick={() => void runTask(task.id, () => housekeepingApi.cancel(task.id), isID ? 'Tugas dibatalkan.' : 'Task cancelled.')}><Ban className="size-4" aria-hidden />{isID ? 'Batalkan' : 'Cancel'}</button>}
                        </>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {editor && canManage && (
        <OperationsDialog title={editor === 'create' ? (isID ? 'Tugas baru' : 'New task') : `${isID ? 'Edit tugas' : 'Edit task'} #${editor.id}`} isID={isID} busy={busy === 'editor'} onClose={() => setEditor(null)}>
          <form onSubmit={saveTask} className="space-y-4">
            <fieldset disabled={busy === 'editor'} className="space-y-3">
              {editor === 'create' && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm font-semibold">{isID ? 'ID unit kamar' : 'Room unit ID'}<input type="number" min={1} required value={form.roomUnitId} onChange={event => setForm({ ...form, roomUnitId: event.target.value })} className={operationField + ' mt-1'} /></label>
                  {isAdmin && <label className="block text-sm font-semibold">ID hotel<input type="number" min={1} value={form.hotelId} onChange={event => setForm({ ...form, hotelId: event.target.value })} className={operationField + ' mt-1'} /></label>}
                  <label className="block text-sm font-semibold">{isID ? 'ID reservasi' : 'Reservation ID'}<input type="number" min={1} value={form.bookingId} onChange={event => setForm({ ...form, bookingId: event.target.value })} className={operationField + ' mt-1'} /></label>
                </div>
              )}
              {isAdmin && <label className="block text-sm font-semibold">{isID ? 'ID petugas' : 'Assignee ID'}<input type="number" min={1} value={form.assignee} onChange={event => setForm({ ...form, assignee: event.target.value })} className={operationField + ' mt-1'} /></label>}
              <label className="block text-sm font-semibold">{isID ? 'Jenis tugas' : 'Task type'}<select value={form.taskType} onChange={event => setForm({ ...form, taskType: event.target.value as HousekeepingTaskType })} className={operationField + ' mt-1'}>{Object.entries(typeLabels).map(([value, labels]) => <option key={value} value={value}>{labels[locale]}</option>)}</select></label>
              <label className="block text-sm font-semibold">{isID ? 'Catatan' : 'Notes'}<textarea maxLength={1000} rows={3} value={form.notes} onChange={event => setForm({ ...form, notes: event.target.value })} className={operationField + ' mt-1 resize-y'} /></label>
            </fieldset>
            {formError && <OperationsNotice>{formError}</OperationsNotice>}
            <div className="flex justify-end gap-2">
              <button type="button" disabled={busy === 'editor'} onClick={() => setEditor(null)} className={operationSecondary}>{isID ? 'Batal' : 'Cancel'}</button>
              <button type="submit" disabled={busy === 'editor'} className={operationPrimary}>{busy === 'editor' && <LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden />}{editor === 'create' ? (isID ? 'Simpan tugas' : 'Save task') : (isID ? 'Simpan perubahan' : 'Save changes')}</button>
            </div>
          </form>
        </OperationsDialog>
      )}
    </OperationsPage>
  );
}
