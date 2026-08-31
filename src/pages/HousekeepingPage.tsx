import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Ban,
  BedDouble,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Loader2,
  Play,
  Plus,
  Save,
  ShieldAlert,
  UserRound,
  Wrench,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { housekeepingApi } from '../api/housekeeping';
import { ApiError } from '../lib/http';
import { Language } from '../types';
import {
  CreateHousekeepingTaskRequest,
  HousekeepingTaskResponse,
  HousekeepingTaskStatus,
  HousekeepingTaskType,
} from '../types/api';
import { AdminFilterChips, AdminPageShell } from '../components/admin/AdminPageShell';
import { StatusPill } from '../components/admin/StatusPill';

const ACCESS_ROLES = new Set(['ADMIN', 'RECEPTIONIST', 'HOUSEKEEPING', 'MAINTENANCE']);
const MANAGER_ROLES = new Set(['ADMIN', 'RECEPTIONIST']);
const WORKER_ROLES = new Set(['ADMIN', 'HOUSEKEEPING', 'MAINTENANCE']);

const STATUS_OPTIONS = (isID: boolean) => [
  { value: '', label: isID ? 'Semua' : 'All' },
  { value: 'PENDING', label: isID ? 'Menunggu' : 'Pending' },
  { value: 'IN_PROGRESS', label: isID ? 'Dikerjakan' : 'In progress' },
  { value: 'DONE', label: isID ? 'Selesai' : 'Done' },
  { value: 'CANCELLED', label: isID ? 'Dibatalkan' : 'Cancelled' },
];

const TYPE_LABELS: Record<HousekeepingTaskType, { id: string; en: string }> = {
  CLEANING: { id: 'Pembersihan', en: 'Cleaning' },
  INSPECTION: { id: 'Inspeksi', en: 'Inspection' },
  MAINTENANCE: { id: 'Perawatan', en: 'Maintenance' },
};

const emptyForm: CreateHousekeepingTaskRequest = {
  roomUnitId: 0,
  taskType: 'CLEANING',
  notes: '',
};

function toOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function dateTime(value: string | null): string {
  if (!value) return '—';
  return value.replace('T', ' ').slice(0, 16);
}

export const HousekeepingPage: React.FC<{ language: Language }> = ({ language }) => {
  const isID = language === 'ID';
  const { user } = useAuth();
  const canAccess = !!user && ACCESS_ROLES.has(user.role);
  const canManage = !!user && MANAGER_ROLES.has(user.role);
  const canWork = !!user && WORKER_ROLES.has(user.role);

  const [tasks, setTasks] = useState<HousekeepingTaskResponse[]>([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateHousekeepingTaskRequest>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingTask, setEditingTask] = useState<HousekeepingTaskResponse | null>(null);

  const load = useCallback(async () => {
    if (!canAccess) return;
    setLoading(true);
    setError(null);
    try {
      const data = await housekeepingApi.list({
        status: (status || undefined) as HousekeepingTaskStatus | undefined,
      });
      setTasks(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (isID ? 'Gagal memuat tugas housekeeping.' : 'Failed to load housekeeping tasks.'));
    } finally {
      setLoading(false);
    }
  }, [canAccess, isID, status]);

  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => ({
    pending: tasks.filter((task) => task.status === 'PENDING').length,
    inProgress: tasks.filter((task) => task.status === 'IN_PROGRESS').length,
    done: tasks.filter((task) => task.status === 'DONE').length,
  }), [tasks]);

  const runTaskAction = async (
    taskId: number,
    action: () => Promise<HousekeepingTaskResponse>
  ) => {
    setBusyId(taskId);
    setError(null);
    try {
      await action();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (isID ? 'Aksi tugas gagal.' : 'Task action failed.'));
    } finally {
      setBusyId(null);
    }
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!Number.isInteger(form.roomUnitId) || form.roomUnitId <= 0) {
      setFormError(isID ? 'ID unit kamar wajib berupa angka positif.' : 'Room unit ID must be a positive number.');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const created = await housekeepingApi.create({
        ...form,
        bookingId: form.bookingId || undefined,
        hotelId: user?.role === 'ADMIN' ? form.hotelId || undefined : user?.hotelId || undefined,
        assignedToUserId: user?.role === 'ADMIN' ? form.assignedToUserId || undefined : undefined,
        notes: form.notes?.trim() || undefined,
      });
      void created;
      setForm(emptyForm);
      setShowCreate(false);
      await load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : (isID ? 'Gagal membuat tugas.' : 'Failed to create task.'));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingTask) return;
    setSaving(true);
    setFormError(null);
    try {
      const updated = await housekeepingApi.update(editingTask.id, {
        ...(user?.role === 'ADMIN'
          ? { assignedToUserId: editingTask.assignedToUserId || undefined }
          : {}),
        taskType: editingTask.taskType,
        notes: editingTask.notes?.trim() || '',
      });
      void updated;
      setEditingTask(null);
      await load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : (isID ? 'Gagal memperbarui tugas.' : 'Failed to update task.'));
    } finally {
      setSaving(false);
    }
  };

  if (!canAccess) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center gap-4 py-20 px-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-900">{isID ? 'Akses operasional diperlukan' : 'Operations access required'}</h1>
          <p className="text-sm text-slate-500 mt-1 max-w-md">
            {isID ? 'Halaman ini tersedia untuk admin, resepsionis, housekeeping, dan maintenance.' : 'This page is available to admins, receptionists, housekeeping, and maintenance staff.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <AdminPageShell
      icon={ClipboardCheck}
      title={isID ? 'Operasional Housekeeping' : 'Housekeeping Operations'}
      subtitle={isID ? 'Kelola pembersihan, inspeksi, dan perawatan unit kamar berdasarkan status nyata.' : 'Manage cleaning, inspections, and room maintenance with live task status.'}
      endpoint="GET /api/admin/housekeeping/tasks"
      isID={isID}
      loading={loading}
      error={error}
      onRefresh={load}
      filters={
        <>
          <AdminFilterChips options={STATUS_OPTIONS(isID)} active={status} onChange={setStatus} />
          {canManage && (
            <button
              type="button"
              onClick={() => { setShowCreate((open) => !open); setFormError(null); }}
              className="ml-auto min-h-11 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              {showCreate ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showCreate ? (isID ? 'Tutup form' : 'Close form') : (isID ? 'Tugas baru' : 'New task')}
            </button>
          )}
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: isID ? 'Menunggu' : 'Pending', value: counts.pending, icon: Clock3 },
          { label: isID ? 'Dikerjakan' : 'In progress', value: counts.inProgress, icon: Wrench },
          { label: isID ? 'Selesai pada hasil ini' : 'Done in result', value: counts.done, icon: CheckCircle2 },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-2xl font-semibold text-slate-900">{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
            <span className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center"><Icon className="w-4 h-4" /></span>
          </div>
        ))}
      </div>

      {showCreate && canManage && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-6 space-y-4" noValidate>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">{isID ? 'Buat tugas operasional' : 'Create operations task'}</h2>
            <p className="text-xs text-slate-500 mt-1">{isID ? 'ID unit kamar wajib. Kolom lain dapat dilengkapi bila referensinya tersedia.' : 'Room unit ID is required. Add the other references when available.'}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <label className="space-y-1.5 text-xs font-medium text-slate-700">
              <span>{isID ? 'ID unit kamar' : 'Room unit ID'} *</span>
              <input type="number" min={1} required value={form.roomUnitId || ''} onChange={(e) => setForm((current) => ({ ...current, roomUnitId: Number(e.target.value) }))} className="w-full min-h-11 rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
            </label>
            <label className="space-y-1.5 text-xs font-medium text-slate-700">
              <span>ID hotel</span>
              <input inputMode="numeric" value={form.hotelId ?? ''} onChange={(e) => setForm((current) => ({ ...current, hotelId: toOptionalNumber(e.target.value) }))} className="w-full min-h-11 rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
            </label>
            <label className="space-y-1.5 text-xs font-medium text-slate-700">
              <span>ID booking</span>
              <input inputMode="numeric" value={form.bookingId ?? ''} onChange={(e) => setForm((current) => ({ ...current, bookingId: toOptionalNumber(e.target.value) }))} className="w-full min-h-11 rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
            </label>
            {user?.role === 'ADMIN' && (
              <label className="space-y-1.5 text-xs font-medium text-slate-700">
                <span>{isID ? 'ID petugas' : 'Assignee user ID'}</span>
                <input inputMode="numeric" value={form.assignedToUserId ?? ''} onChange={(e) => setForm((current) => ({ ...current, assignedToUserId: toOptionalNumber(e.target.value) }))} className="w-full min-h-11 rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
              </label>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] gap-3">
            <label className="space-y-1.5 text-xs font-medium text-slate-700">
              <span>{isID ? 'Jenis tugas' : 'Task type'}</span>
              <select value={form.taskType} onChange={(e) => setForm((current) => ({ ...current, taskType: e.target.value as HousekeepingTaskType }))} className="w-full min-h-11 rounded-xl border border-slate-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300">
                {(Object.keys(TYPE_LABELS) as HousekeepingTaskType[]).map((type) => <option key={type} value={type}>{isID ? TYPE_LABELS[type].id : TYPE_LABELS[type].en}</option>)}
              </select>
            </label>
            <label className="space-y-1.5 text-xs font-medium text-slate-700">
              <span>{isID ? 'Catatan' : 'Notes'}</span>
              <input maxLength={1000} value={form.notes ?? ''} onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))} className="w-full min-h-11 rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
            </label>
          </div>
          {formError && <p role="alert" className="text-xs text-rose-700 flex items-center gap-2"><AlertCircle className="w-4 h-4" />{formError}</p>}
          <button type="submit" disabled={saving} className="min-h-11 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isID ? 'Simpan tugas' : 'Save task'}
          </button>
        </form>
      )}

      {tasks.length === 0 && !loading ? (
        <div className="bg-white rounded-2xl border border-slate-100 px-4 py-16 text-center">
          <ClipboardCheck className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-medium text-slate-700 mt-3">{isID ? 'Tidak ada tugas untuk filter ini.' : 'No tasks match this filter.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {tasks.map((task) => {
            const isBusy = busyId === task.id;
            const isAdmin = user?.role === 'ADMIN';
            const isAssignedToCurrentUser = task.assignedToUserId != null
              && task.assignedToUserId === user?.userId;
            const canStartTask = isAdmin
              || (canWork && (task.assignedToUserId == null || isAssignedToCurrentUser));
            const canCompleteTask = isAdmin
              || (canWork && isAssignedToCurrentUser);
            return (
              <article key={task.id} className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0"><BedDouble className="w-4 h-4" /></span>
                    <div className="min-w-0">
                      <h2 className="text-sm font-semibold text-slate-900">{isID ? 'Unit kamar' : 'Room unit'} #{task.roomUnitId}</h2>
                      <p className="text-xs text-slate-500 mt-1">{isID ? TYPE_LABELS[task.taskType].id : TYPE_LABELS[task.taskType].en} · Task #{task.id}</p>
                    </div>
                  </div>
                  <StatusPill status={task.status} />
                </div>

                <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div><dt className="text-slate-400">Hotel</dt><dd className="font-medium text-slate-700 mt-1">{task.hotelId ?? '—'}</dd></div>
                  <div><dt className="text-slate-400">Booking</dt><dd className="font-medium text-slate-700 mt-1">{task.bookingId ?? '—'}</dd></div>
                  <div><dt className="text-slate-400">{isID ? 'Petugas' : 'Assignee'}</dt><dd className="font-medium text-slate-700 mt-1 inline-flex items-center gap-1"><UserRound className="w-3.5 h-3.5" />{task.assignedToUserId ?? '—'}</dd></div>
                  <div><dt className="text-slate-400">{isID ? 'Dibuat' : 'Created'}</dt><dd className="font-medium text-slate-700 mt-1">{dateTime(task.createdAt)}</dd></div>
                </dl>

                {task.notes && <p className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5 text-xs leading-relaxed text-slate-600">{task.notes}</p>}

                <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
                  {isBusy && <span className="min-h-11 px-3 inline-flex items-center gap-2 text-xs text-slate-500"><Loader2 className="w-4 h-4 animate-spin" />{isID ? 'Memproses' : 'Processing'}</span>}
                  {!isBusy && canStartTask && task.status === 'PENDING' && (
                    <button onClick={() => runTaskAction(task.id, () => housekeepingApi.start(task.id, user?.role === 'ADMIN' ? task.assignedToUserId ?? undefined : user?.userId))} className="min-h-11 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"><Play className="w-4 h-4" />{isID ? 'Mulai' : 'Start'}</button>
                  )}
                  {!isBusy && canCompleteTask && task.status === 'IN_PROGRESS' && (
                    <button onClick={() => runTaskAction(task.id, () => housekeepingApi.complete(task.id))} className="min-h-11 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"><CheckCircle2 className="w-4 h-4" />{isID ? 'Selesaikan' : 'Complete'}</button>
                  )}
                  {!isBusy && canManage && task.status !== 'DONE' && task.status !== 'CANCELLED' && (
                    <>
                      <button onClick={() => { setEditingTask(task); setFormError(null); }} className="min-h-11 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-2 cursor-pointer">{isID ? 'Edit' : 'Edit'}</button>
                      {task.status === 'PENDING' && (
                        <button onClick={() => runTaskAction(task.id, () => housekeepingApi.cancel(task.id))} className="min-h-11 px-4 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"><Ban className="w-4 h-4" />{isID ? 'Batalkan' : 'Cancel'}</button>
                      )}
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {editingTask && canManage && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="edit-housekeeping-title">
          <form onSubmit={handleUpdate} className="w-full max-w-lg bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div><h2 id="edit-housekeeping-title" className="text-base font-semibold text-slate-900">{isID ? 'Edit tugas' : 'Edit task'} #{editingTask.id}</h2><p className="text-xs text-slate-500 mt-1">{isID ? 'Ubah penugasan, jenis, atau catatan.' : 'Change assignment, type, or notes.'}</p></div>
              <button type="button" onClick={() => setEditingTask(null)} className="w-11 h-11 rounded-xl hover:bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer" aria-label={isID ? 'Tutup' : 'Close'}><X className="w-4 h-4" /></button>
            </div>
            {user?.role === 'ADMIN' && (
              <label className="block space-y-1.5 text-xs font-medium text-slate-700"><span>{isID ? 'ID petugas' : 'Assignee user ID'}</span><input inputMode="numeric" value={editingTask.assignedToUserId ?? ''} onChange={(e) => setEditingTask((current) => current ? { ...current, assignedToUserId: toOptionalNumber(e.target.value) ?? null } : current)} className="w-full min-h-11 rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" /></label>
            )}
            <label className="block space-y-1.5 text-xs font-medium text-slate-700"><span>{isID ? 'Jenis tugas' : 'Task type'}</span><select value={editingTask.taskType} onChange={(e) => setEditingTask((current) => current ? { ...current, taskType: e.target.value as HousekeepingTaskType } : current)} className="w-full min-h-11 rounded-xl border border-slate-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300">{(Object.keys(TYPE_LABELS) as HousekeepingTaskType[]).map((type) => <option key={type} value={type}>{isID ? TYPE_LABELS[type].id : TYPE_LABELS[type].en}</option>)}</select></label>
            <label className="block space-y-1.5 text-xs font-medium text-slate-700"><span>{isID ? 'Catatan' : 'Notes'}</span><textarea rows={4} maxLength={1000} value={editingTask.notes ?? ''} onChange={(e) => setEditingTask((current) => current ? { ...current, notes: e.target.value } : current)} className="w-full rounded-xl border border-slate-200 p-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-slate-300" /></label>
            {formError && <p role="alert" className="text-xs text-rose-700 flex items-center gap-2"><AlertCircle className="w-4 h-4" />{formError}</p>}
            <button type="submit" disabled={saving} className="min-h-11 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer disabled:opacity-50">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{isID ? 'Simpan perubahan' : 'Save changes'}</button>
          </form>
        </div>
      )}
    </AdminPageShell>
  );
};
