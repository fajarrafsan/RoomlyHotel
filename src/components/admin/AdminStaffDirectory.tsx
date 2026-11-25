import { useState } from 'react';
import { AlertCircle, LoaderCircle, UserRoundX, Users } from 'lucide-react';
import type { StaffUserDto } from '../../api/admin';
import { ApiError } from '../../lib/http';
import type { Hotel } from '../../types';
import { StatusPill } from './StatusPill';

interface StaffDirectoryProps {
  staff: StaffUserDto[];
  hotels: Hotel[];
  isID: boolean;
  loading: boolean;
  unavailable: boolean;
  blocked: boolean;
  onDeactivate: (id: number) => Promise<void>;
}

export function AdminStaffDirectory({ staff, hotels, isID, loading, unavailable, blocked, onDeactivate }: StaffDirectoryProps) {
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hotelNames = new Map(hotels.map(hotel => [hotel.id, hotel.name]));

  const deactivate = async (id: number) => {
    if (loading || blocked || busyId != null) return;
    setBusyId(id);
    setError(null);
    try {
      await onDeactivate(id);
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : (isID ? 'Akun staf gagal dinonaktifkan.' : 'Could not deactivate the staff account.'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="min-w-0 overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm" aria-labelledby="admin-staff" aria-busy={loading}>
      <div className="p-4 sm:p-5">
        <h2 id="admin-staff" className="text-lg font-semibold text-navy-dark">{isID ? 'Direktori staf' : 'Staff directory'}</h2>
        {!loading && !unavailable && <p className="mt-1 text-sm text-slate-600">{staff.filter(member => member.active).length} {isID ? 'akun staf aktif' : 'active staff accounts'}</p>}
        {error && <p role="alert" className="mt-3 flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"><AlertCircle className="size-4 shrink-0" aria-hidden />{error}</p>}
      </div>
      {staff.length ? (
        <ul className="divide-y divide-slate-200 border-t border-slate-200">
          {staff.map(member => (
            <li key={member.id} className="grid min-w-0 gap-3 px-4 py-4 hover:bg-slate-50/70 sm:px-5 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.7fr)_minmax(0,0.75fr)_auto] md:items-center">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-navy-soft text-xs font-bold text-navy-dark" aria-hidden>{member.fullName.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase()}</span>
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold text-navy-dark">{member.fullName}</p>
                  <p className="break-all text-xs text-slate-600">{member.email}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-slate-700">{member.role === 'RECEPTIONIST' && isID ? 'Resepsionis' : member.role === 'MAINTENANCE' && isID ? 'Teknisi' : member.role}</span>
                <StatusPill status={member.active ? 'ACTIVE' : 'INACTIVE'} label={member.active ? (isID ? 'Aktif' : 'Active') : (isID ? 'Nonaktif' : 'Inactive')} />
              </div>
              <p className="break-words text-sm text-slate-600">
                {member.role === 'ADMIN' ? (isID ? 'Semua hotel' : 'All hotels')
                  : member.hotelId != null ? (hotelNames.get(String(member.hotelId)) ?? `Hotel #${member.hotelId}`)
                    : (isID ? 'Hotel belum ditetapkan' : 'No hotel assigned')}
              </p>
              {member.active && (
                <button type="button" onClick={() => void deactivate(member.id)} disabled={loading || blocked || busyId != null} aria-busy={busyId === member.id} className="inline-flex min-h-11 w-fit cursor-pointer items-center gap-1.5 rounded-lg border border-rose-200 px-3 text-sm font-semibold text-rose-800 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60">
                  {busyId === member.id ? <LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden /> : <UserRoundX className="size-4" aria-hidden />}
                  {isID ? 'Nonaktifkan' : 'Deactivate'}
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="border-t border-slate-200 px-4 py-8 text-center text-sm text-slate-600">
          <Users className="mx-auto mb-2 size-5" aria-hidden />
          {loading ? (isID ? 'Memuat daftar staf…' : 'Loading staff…')
            : unavailable ? (isID ? 'Daftar staf belum dapat dimuat.' : 'The staff list could not be loaded.')
              : (isID ? 'Belum ada staf tambahan.' : 'No additional staff accounts.')}
        </p>
      )}
    </section>
  );
}
