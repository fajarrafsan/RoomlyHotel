import React, { useState, useMemo } from 'react';
import { Search, Receipt, UserCheck, LogOut, CheckCircle2, Clock, XCircle, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Booking, Language } from '../../types';
import { formatCurrency, formatDate } from '../../lib/utils';

interface AdminBookingsTableProps {
  isID: boolean;
  language: Language;
  bookings: Booking[];
  onOpenInvoice: (booking: Booking) => void;
  onCheckOut: (bookingId: string) => void;
}

export const AdminBookingsTable: React.FC<AdminBookingsTableProps> = ({
  isID,
  language,
  bookings,
  onOpenInvoice,
  onCheckOut,
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'confirmed' | 'checked-in' | 'completed' | 'cancelled'>('ALL');

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchSearch =
        !searchTerm ||
        b.bookingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.hotelName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === 'ALL' || b.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [bookings, searchTerm, statusFilter]);

  const getStatusBadge = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {isID ? 'Terkonfirmasi' : 'Confirmed'}
          </span>
        );
      case 'checked-in':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100 flex items-center gap-1">
            <UserCheck className="w-3 h-3" />
            {isID ? 'Sudah Check-In' : 'Checked In'}
          </span>
        );
      case 'completed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            {isID ? 'Selesai' : 'Completed'}
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-100 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            {isID ? 'Dibatalkan' : 'Cancelled'}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden space-y-4 p-3.5 sm:p-5">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">
            {isID ? 'Daftar Reservasi Sistem' : 'System Bookings Directory'}
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-400 font-light mt-0.5">
            {isID ? 'Kelola status check-in/out dan transaksi seluruh tamu hotel' : 'Manage guest check-ins, check-outs, and invoices'}
          </p>
        </div>

        {/* Search & Status Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isID ? 'Cari kode, tamu, hotel...' : 'Search code, guest, hotel...'}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">{isID ? 'Semua Status' : 'All Statuses'}</option>
            <option value="confirmed">{isID ? 'Terkonfirmasi' : 'Confirmed'}</option>
            <option value="checked-in">{isID ? 'Checked In' : 'Checked In'}</option>
            <option value="completed">{isID ? 'Selesai' : 'Completed'}</option>
            <option value="cancelled">{isID ? 'Dibatalkan' : 'Cancelled'}</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-100 touch-pan-x scrollbar-thin">
        <table className="w-full text-left text-xs min-w-[600px]">
          <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-4 py-3">{isID ? 'Kode & Tamu' : 'Code & Guest'}</th>
              <th className="px-4 py-3">{isID ? 'Hotel & Kamar' : 'Hotel & Room'}</th>
              <th className="px-4 py-3">{isID ? 'Tanggal' : 'Dates'}</th>
              <th className="px-4 py-3">{isID ? 'Total' : 'Total'}</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">{isID ? 'Aksi' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 font-normal text-slate-700">
            {filteredBookings.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                  {isID ? 'Tidak ada reservasi yang sesuai.' : 'No matching bookings found.'}
                </td>
              </tr>
            ) : (
              filteredBookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                  {/* Code & Guest */}
                  <td className="px-4 py-3">
                    <code className="font-mono font-bold text-slate-900 text-[12px] block">
                      {b.bookingCode}
                    </code>
                    <span className="text-slate-600 font-medium">{b.guestName}</span>
                  </td>

                  {/* Hotel & Room */}
                  <td className="px-4 py-3">
                    <span className="font-semibold text-slate-900 block truncate max-w-[180px]">
                      {b.hotelName}
                    </span>
                    <span className="text-[11px] text-slate-400 block truncate max-w-[180px]">
                      {b.roomType}
                    </span>
                  </td>

                  {/* Dates */}
                  <td className="px-4 py-3 text-[11px] text-slate-600">
                    <div>{formatDate(b.checkIn, language)}</div>
                    <div className="text-slate-400 text-[10px]">{b.nights} {isID ? 'malam' : 'nights'}</div>
                  </td>

                  {/* Total */}
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {formatCurrency(b.totalPrice)}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    {getStatusBadge(b.status)}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                    {b.status === 'confirmed' && (
                      <button
                        onClick={() => navigate('/staff/check-in')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] transition-all inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                        title={isID ? 'Proses Check-In Tamu' : 'Process Guest Check-In'}
                      >
                        <UserCheck className="w-3 h-3" />
                        <span>Check-In</span>
                      </button>
                    )}

                    {b.status === 'checked-in' && (
                      <button
                        onClick={() => onCheckOut(b.id)}
                        className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[11px] transition-all inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                        title={isID ? 'Proses Check-Out' : 'Process Check-Out'}
                      >
                        <LogOut className="w-3 h-3" />
                        <span>Check-Out</span>
                      </button>
                    )}

                    <button
                      onClick={() => onOpenInvoice(b)}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-[11px] transition-all inline-flex items-center gap-1 cursor-pointer"
                      title={isID ? 'Lihat Struk Invoice' : 'View Invoice'}
                    >
                      <Receipt className="w-3 h-3 text-slate-500" />
                      <span>Invoice</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
