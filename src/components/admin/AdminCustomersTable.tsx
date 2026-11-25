import { useMemo, useState } from 'react';
import { ArrowUpRight, Mail, Search, Users } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import type { Booking } from '../../types';
import type { StaffUserDto } from '../../api/admin';

interface AdminCustomersTableProps {
  isID: boolean;
  bookings: Booking[];
  staffList: StaffUserDto[];
  loading: boolean;
  incomplete: boolean;
  onFilterCustomerBookings: (customerEmail: string) => void;
}

interface CustomerUser {
  key: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  bookingCount: number;
  totalSpent: number;
}

const roleLabels: Record<string, [string, string]> = {
  ADMIN: ['Admin', 'Admin'],
  CUSTOMER: ['Pelanggan', 'Customer'],
  RECEPTIONIST: ['Resepsionis', 'Receptionist'],
  HOUSEKEEPING: ['Housekeeping', 'Housekeeping'],
  MAINTENANCE: ['Teknisi', 'Maintenance'],
};
const inputClass = 'h-11 min-w-0 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm text-slate-800';

export function AdminCustomersTable({ isID, bookings, staffList, loading, incomplete, onFilterCustomerBookings }: AdminCustomersTableProps) {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const [sort, setSort] = useState<'spent' | 'bookings' | 'name'>('spent');

  const users = useMemo(() => {
    const byGuest = new Map<string, CustomerUser>();
    for (const staff of staffList) {
      const key = staff.email.toLowerCase();
      byGuest.set(key, { key, fullName: staff.fullName, email: staff.email, phone: '', role: staff.role, bookingCount: 0, totalSpent: 0 });
    }
    for (const booking of bookings) {
      const key = (booking.guestEmail || booking.guestName || 'unknown').toLowerCase();
      const guest = byGuest.get(key) ?? {
        key, fullName: booking.guestName || 'Pelanggan Roomly', email: booking.guestEmail || '',
        phone: '', role: 'CUSTOMER', bookingCount: 0, totalSpent: 0,
      };
      guest.bookingCount++;
      if (!guest.phone) guest.phone = booking.guestPhone;
      if (booking.paymentStatus === 'paid' && booking.status !== 'cancelled') guest.totalSpent += booking.totalPrice;
      byGuest.set(key, guest);
    }
    return [...byGuest.values()];
  }, [bookings, staffList]);

  const term = search.trim().toLowerCase();
  const displayed = users.filter(user =>
    (role === 'all' || user.role === role)
    && (!term || user.fullName.toLowerCase().includes(term) || user.email.toLowerCase().includes(term)))
    .sort((a, b) => sort === 'spent' ? b.totalSpent - a.totalSpent : sort === 'bookings' ? b.bookingCount - a.bookingCount : a.fullName.localeCompare(b.fullName));

  return (
    <section className="min-w-0 overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm" aria-labelledby="admin-accounts" aria-busy={loading}>
      <div className="space-y-4 p-4 sm:p-5">
        <div>
          <h2 id="admin-accounts" className="text-lg font-semibold text-navy-dark">{isID ? 'Daftar akun' : 'Account directory'}</h2>
          <p className="mt-1 text-sm text-slate-600">{isID ? 'Lihat kontak dan riwayat reservasi pelanggan.' : 'Find contact details and customer reservations.'}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-[minmax(0,1fr)_160px_175px]">
          <label className="relative col-span-2 min-w-0 md:col-span-1">
            <span className="sr-only">{isID ? 'Cari akun' : 'Search accounts'}</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-600" aria-hidden />
            <input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder={isID ? 'Cari nama atau email' : 'Search name or email'} className={inputClass + ' pl-9 text-base sm:text-sm'} />
          </label>
          <select aria-label={isID ? 'Filter peran' : 'Filter by role'} value={role} onChange={event => setRole(event.target.value)} className={inputClass}>
            <option value="all">{isID ? 'Semua peran' : 'All roles'}</option>
            {Object.entries(roleLabels).map(([key, label]) => <option key={key} value={key}>{label[isID ? 0 : 1]}</option>)}
          </select>
          <select aria-label={isID ? 'Urutkan akun' : 'Sort accounts'} value={sort} onChange={event => setSort(event.target.value as typeof sort)} className={inputClass}>
            <option value="spent">{isID ? 'Pengeluaran' : 'Highest spent'}</option>
            <option value="bookings">{isID ? 'Jumlah reservasi' : 'Most reservations'}</option>
            <option value="name">{isID ? 'Nama (A–Z)' : 'Name (A–Z)'}</option>
          </select>
        </div>
        {incomplete && <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{isID ? 'Sebagian data akun belum dapat dimuat.' : 'Some account data could not be loaded.'}</p>}
      </div>
      {displayed.length ? (
        <ul className="divide-y divide-slate-200 border-t border-slate-200">
          {displayed.map(user => (
            <li key={user.key} className="grid gap-3 px-4 py-4 hover:bg-slate-50/60 sm:px-5 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.6fr)_minmax(0,1fr)_auto] md:items-center">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-navy-soft text-xs font-bold text-navy-dark" aria-hidden>{user.fullName.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase()}</span>
                <div className="min-w-0">
                  <p className="break-words font-semibold text-navy-dark">{user.fullName}</p>
                  {user.email && <p className="break-all text-xs text-slate-600">{user.email}</p>}
                  {user.phone && user.phone !== '—' && <p className="text-xs text-slate-600">{user.phone}</p>}
                </div>
              </div>
              <span className="w-fit rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{roleLabels[user.role]?.[isID ? 0 : 1] ?? user.role}</span>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div><dt className="text-xs text-slate-600">{isID ? 'Reservasi' : 'Reservations'}</dt><dd className="font-semibold text-navy-dark">{user.bookingCount}</dd></div>
                <div><dt className="text-xs text-slate-600">{isID ? 'Pengeluaran' : 'Spent'}</dt><dd className="font-semibold text-navy-dark">{user.totalSpent ? formatCurrency(user.totalSpent) : '—'}</dd></div>
              </dl>
              <div className="flex flex-wrap gap-1.5">
                {user.email && <a href={`mailto:${user.email}`} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-xs font-semibold text-navy hover:bg-navy-soft"><Mail className="size-4" aria-hidden />Email</a>}
                {user.bookingCount > 0 && <button type="button" onClick={() => onFilterCustomerBookings(user.key)} className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-lg bg-navy-soft px-2.5 text-xs font-semibold text-navy-dark hover:bg-slate-100">{isID ? 'Lihat reservasi' : 'View reservations'}<ArrowUpRight className="size-4" aria-hidden /></button>}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="border-t border-slate-200 px-4 py-8 text-center text-sm text-slate-600"><Users className="mx-auto mb-2 size-5" aria-hidden />{loading ? (isID ? 'Memuat akun…' : 'Loading accounts…') : (isID ? 'Tidak ada akun yang sesuai.' : 'No matching accounts.')}</p>
      )}
    </section>
  );
}
