import React, { useState, useMemo } from 'react';
import { Search, UserCheck, Mail, Phone, ShoppingBag, Calendar, ArrowUpRight, ShieldCheck, Filter } from 'lucide-react';
import { Booking, Language } from '../../types';
import { StaffUserDto } from '../../api/admin';
import { formatCurrency, formatDate } from '../../lib/utils';

interface AdminCustomersTableProps {
  isID: boolean;
  language: Language;
  bookings: Booking[];
  staffList: StaffUserDto[];
  onFilterCustomerBookings: (customerEmail: string) => void;
}

export interface CustomerUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  bookingCount: number;
  totalSpent: number;
  lastBookingDate: string;
  isStaff: boolean;
}

export const AdminCustomersTable: React.FC<AdminCustomersTableProps> = ({
  isID,
  language,
  bookings,
  staffList,
  onFilterCustomerBookings,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'spent' | 'bookings' | 'name'>('spent');

  // Aggregate user records from bookings & staff list
  const users = useMemo<CustomerUser[]>(() => {
    const userMap = new Map<string, CustomerUser>();

    // 1. Add staff members
    staffList.forEach((s) => {
      userMap.set(s.email.toLowerCase(), {
        id: `staff-${s.id}`,
        fullName: s.fullName,
        email: s.email,
        phone: '—',
        role: s.role,
        bookingCount: 0,
        totalSpent: 0,
        lastBookingDate: s.createdAt || '—',
        isStaff: true,
      });
    });

    // 2. Aggregate customers from bookings
    bookings.forEach((b) => {
      const emailKey = (b.guestEmail || b.guestName || 'unknown').toLowerCase();
      const existing = userMap.get(emailKey);

      const isPaid = b.paymentStatus === 'paid' && b.status !== 'cancelled';
      const spent = isPaid ? b.totalPrice : 0;

      if (existing) {
        existing.bookingCount += 1;
        existing.totalSpent += spent;
        if (!existing.phone || existing.phone === '—') existing.phone = b.guestPhone || '—';
        if (b.checkIn > existing.lastBookingDate) existing.lastBookingDate = b.checkIn;
      } else {
        userMap.set(emailKey, {
          id: `cust-${emailKey}`,
          fullName: b.guestName || 'Pelanggan Roomly',
          email: b.guestEmail || emailKey,
          phone: b.guestPhone || '—',
          role: 'CUSTOMER',
          bookingCount: 1,
          totalSpent: spent,
          lastBookingDate: b.checkIn,
          isStaff: false,
        });
      }
    });

    return Array.from(userMap.values());
  }, [bookings, staffList]);

  // Filter and sort users
  const filteredUsers = useMemo(() => {
    return users
      .filter((u) => {
        const matchesSearch =
          !searchTerm ||
          u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;

        return matchesSearch && matchesRole;
      })
      .sort((a, b) => {
        if (sortBy === 'spent') return b.totalSpent - a.totalSpent;
        if (sortBy === 'bookings') return b.bookingCount - a.bookingCount;
        return a.fullName.localeCompare(b.fullName);
      });
  }, [users, searchTerm, roleFilter, sortBy]);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-100 flex items-center gap-1 w-fit">
            <ShieldCheck className="w-3 h-3 text-purple-600" />
            ADMIN
          </span>
        );
      case 'RECEPTIONIST':
      case 'HOUSEKEEPING':
      case 'MAINTENANCE':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-100 w-fit block">
            {role}
          </span>
        );
      case 'CUSTOMER':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 w-fit block">
            {isID ? 'PELANGGAN' : 'CUSTOMER'}
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-3.5 sm:p-6 shadow-xs space-y-4 sm:space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">
            {isID ? 'Direktori Akun Pengguna & Pelanggan' : 'User & Customer Accounts Directory'}
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-400 font-light mt-0.5">
            {isID
              ? 'Pantau data akun pelanggan, riwayat pemesanan, dan total pengeluaran tamu'
              : 'Track customer profiles, booking history, and guest lifetime value'}
          </p>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isID ? 'Cari nama atau email...' : 'Search name or email...'}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            />
          </div>

          <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">{isID ? 'Semua Peran' : 'All Roles'}</option>
              <option value="CUSTOMER">{isID ? 'Pelanggan' : 'Customer'}</option>
              <option value="RECEPTIONIST">Receptionist</option>
              <option value="HOUSEKEEPING">Housekeeping</option>
              <option value="ADMIN">Admin</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="spent">{isID ? 'Pengeluaran' : 'Highest Spent'}</option>
              <option value="bookings">{isID ? 'Booking' : 'Most Bookings'}</option>
              <option value="name">{isID ? 'Nama (A-Z)' : 'Name (A-Z)'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-100 touch-pan-x scrollbar-thin">
        <table className="w-full text-left text-xs min-w-[640px]">
          <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-4 py-3">{isID ? 'Pengguna / Pelanggan' : 'User / Customer'}</th>
              <th className="px-4 py-3">{isID ? 'Kontak' : 'Contact'}</th>
              <th className="px-4 py-3">{isID ? 'Peran' : 'Role'}</th>
              <th className="px-4 py-3 text-center">{isID ? 'Total Booking' : 'Total Stays'}</th>
              <th className="px-4 py-3 text-right">{isID ? 'Total Belanja' : 'Total Spent'}</th>
              <th className="px-4 py-3 text-right">{isID ? 'Aksi' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 font-normal text-slate-700">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                  {isID ? 'Tidak ada pengguna yang sesuai.' : 'No matching users found.'}
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const initials = u.fullName
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();

                return (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Name & Initials Avatar */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                          {initials || 'US'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 leading-snug">{u.fullName}</p>
                          <p className="text-[11px] text-slate-400 font-light">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-4 py-3 text-[11px] text-slate-600">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[160px]">{u.email}</span>
                      </div>
                      {u.phone && u.phone !== '—' && (
                        <div className="flex items-center gap-1.5 text-slate-400 text-[10px] mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{u.phone}</span>
                        </div>
                      )}
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3">
                      {getRoleBadge(u.role)}
                    </td>

                    {/* Total Booking Count */}
                    <td className="px-4 py-3 text-center">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold text-xs">
                        {u.bookingCount}
                      </span>
                    </td>

                    {/* Total Spent */}
                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      {u.totalSpent > 0 ? formatCurrency(u.totalSpent) : '—'}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                      {u.email && (
                        <a
                          href={`mailto:${u.email}`}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-[11px] transition-all inline-flex items-center gap-1 cursor-pointer"
                          title={isID ? 'Kirim Email' : 'Send Email'}
                        >
                          <Mail className="w-3 h-3 text-slate-500" />
                          <span>Email</span>
                        </a>
                      )}

                      {u.bookingCount > 0 && (
                        <button
                          onClick={() => onFilterCustomerBookings(u.email)}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[11px] transition-all inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                          title={isID ? 'Lihat Reservasi Pelanggan Ini' : 'View Customer Stays'}
                        >
                          <ShoppingBag className="w-3 h-3" />
                          <span>{isID ? 'Reservasi' : 'Stays'}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
