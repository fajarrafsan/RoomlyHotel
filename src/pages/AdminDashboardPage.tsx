import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ShieldAlert, ShieldCheck, UserPlus, UserCheck, RotateCw,
  Users, UserX, CheckCircle2, ArrowRight, User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAdminData } from '../hooks/useAdminData';
import { Booking, Hotel, Language } from '../types';
import { AdminStatsGrid } from '../components/admin/AdminStatsGrid';
import { AdminBookingsTable } from '../components/admin/AdminBookingsTable';
import { AdminCustomersTable } from '../components/admin/AdminCustomersTable';
import { StaffModal } from '../components/admin/StaffModal';

interface AdminDashboardPageProps {
  hotels: Hotel[];
  language: Language;
  onOpenInvoice: (booking: Booking) => void;
  onOpenAuth: () => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  hotels,
  language,
  onOpenInvoice,
  onOpenAuth,
}) => {
  const isID = language === 'ID';
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'staff' | 'customers'>('overview');

  const {
    stats,
    allBookings,
    bookingsLoading,
    bookingsError,
    staffList,
    staffLoading,
    loadAdminData,
    handleCreateStaff,
    handleDeactivateStaff,
    handleCheckOutGuest,
  } = useAdminData(user, hotels);

  // Access Guard: ADMIN Role Only
  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-[65vh] flex flex-col items-center justify-center text-center p-6 my-10 max-w-md mx-auto bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center mx-auto shadow-2xs">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {isID ? 'Akses Ditolak' : 'Access Restricted'}
          </h2>
          <p className="text-xs text-slate-400 font-light leading-relaxed">
            {isID
              ? 'Halaman Admin Dashboard hanya dapat diakses oleh staf berwenang dengan peran ADMIN.'
              : 'The Admin Dashboard is strictly reserved for staff signed in with an ADMIN role.'}
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2 w-full">
          {!user ? (
            <button
              onClick={onOpenAuth}
              className="w-full py-2.5 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-md cursor-pointer"
            >
              {isID ? 'Masuk Akun Admin' : 'Sign In as Admin'}
            </button>
          ) : (
            <button
              onClick={() => navigate('/')}
              className="w-full py-2.5 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
            >
              {isID ? 'Kembali ke Beranda' : 'Back to Home'}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-20 max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 2xl:px-16 text-slate-800">
      {/* ===== HERO HEADER ===== */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-white p-4 sm:p-8 shadow-sm border border-slate-100"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-50/50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-50/40 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 sm:gap-6">
          <div className="space-y-1.5 sm:space-y-2 max-w-2xl">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-700 rounded-full font-bold text-[9px] sm:text-[10px] uppercase tracking-[0.2em] border border-slate-200">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              {isID ? 'Portal Administrator' : 'Administrator Portal'}
            </span>
            <h1 className="text-xl sm:text-3xl lg:text-4xl font-light tracking-tight text-slate-900 leading-snug">
              {isID ? 'Selamat Datang, ' : 'Welcome, '}
              <span className="font-serif italic font-semibold text-slate-900 block sm:inline">
                {user.fullName}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-light leading-relaxed">
              {isID
                ? 'Kelola operasional hotel, performa pendapatan, data reservasi, dan akun staf dalam satu panel terpadu.'
                : 'Manage hotel operations, revenue metrics, reservations, and staff accounts from one central panel.'}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
            <button
              onClick={() => navigate('/staff/check-in')}
              className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all inline-flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              <UserCheck className="w-4 h-4 shrink-0" />
              <span>{isID ? 'Check-In Tamu' : 'Guest Check-In'}</span>
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setIsStaffModalOpen(true)}
                className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all inline-flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <UserPlus className="w-4 h-4 shrink-0" />
                <span>{isID ? 'Tambah Staf' : 'Add Staff'}</span>
              </button>

              <button
                onClick={loadAdminData}
                disabled={bookingsLoading}
                className="py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold transition-all inline-flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40 shrink-0"
                title={isID ? 'Muat Ulang Data' : 'Refresh Data'}
              >
                <RotateCw className={`w-3.5 h-3.5 ${bookingsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Selection (Horizontal Scrollable on Mobile 320px) */}
        <div className="mt-6 sm:mt-8 pt-4 border-t border-slate-100 flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-3.5 sm:px-4 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'overview'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            {isID ? 'Ikhtisar & Reservasi' : 'Overview & Bookings'}
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            className={`py-2 px-3.5 sm:px-4 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'customers'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <User className="w-3.5 h-3.5 shrink-0" />
            <span>{isID ? 'Akun Pelanggan' : 'Customer Accounts'}</span>
          </button>

          <button
            onClick={() => setActiveTab('staff')}
            className={`py-2 px-3.5 sm:px-4 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'staff'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span>{isID ? 'Kelola Staf' : 'Staff Directory'}</span>
            {staffList.length > 0 && (
              <span className="px-1.5 py-0.2 bg-slate-700 text-white text-[10px] rounded-full">
                {staffList.length}
              </span>
            )}
          </button>
        </div>
      </motion.div>

      {activeTab === 'overview' ? (
        <>
          {bookingsError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {bookingsError}
            </div>
          )}

          {/* ===== KPI METRICS GRID ===== */}
          <AdminStatsGrid isID={isID} stats={stats} />

          {/* ===== LIVE SYSTEM BOOKINGS DIRECTORY ===== */}
          <AdminBookingsTable
            isID={isID}
            language={language}
            bookings={allBookings}
            onOpenInvoice={onOpenInvoice}
            onCheckOut={handleCheckOutGuest}
          />
        </>
      ) : activeTab === 'customers' ? (
        /* ===== CUSTOMERS DIRECTORY SECTION ===== */
        <AdminCustomersTable
          isID={isID}
          language={language}
          bookings={allBookings}
          staffList={staffList}
          onFilterCustomerBookings={() => setActiveTab('overview')}
        />
      ) : (
        /* ===== STAFF DIRECTORY SECTION ===== */
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                {isID ? 'Direktori Akun Staf' : 'Staff Accounts Directory'}
              </h3>
              <p className="text-xs text-slate-400 font-light mt-0.5">
                {isID
                  ? 'Daftar staf operasional hotel (Resepsionis, Housekeeping, Maintenance)'
                  : 'Hotel operational staff accounts across all departments'}
              </p>
            </div>

            <button
              onClick={() => setIsStaffModalOpen(true)}
              className="py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{isID ? 'Buat Staf Baru' : 'Create New Staff'}</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">{isID ? 'Nama Staf' : 'Staff Name'}</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">{isID ? 'Peran / Jabatan' : 'Role'}</th>
                  <th className="px-4 py-3">{isID ? 'Status' : 'Status'}</th>
                  <th className="px-4 py-3 text-right">{isID ? 'Aksi' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-normal text-slate-700">
                {staffList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                      {staffLoading
                        ? (isID ? 'Memuat daftar staf...' : 'Loading staff...')
                        : (isID ? 'Belum ada staf tambahan.' : 'No staff accounts found.')}
                    </td>
                  </tr>
                ) : (
                  staffList.map((staf) => (
                    <tr key={staf.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900">{staf.fullName}</td>
                      <td className="px-4 py-3 text-slate-500">{staf.email}</td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {staf.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {staf.active ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            {isID ? 'Aktif' : 'Active'}
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-100">
                            {isID ? 'Non-aktif' : 'Inactive'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {staf.active && (
                          <button
                            onClick={() => handleDeactivateStaff(staf.id)}
                            className="px-2.5 py-1 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold text-[11px] transition-all inline-flex items-center gap-1 cursor-pointer"
                          >
                            <UserX className="w-3 h-3" />
                            <span>{isID ? 'Nonaktifkan' : 'Deactivate'}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Staff Modal */}
      <StaffModal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        isID={isID}
        onSubmit={handleCreateStaff}
      />
    </div>
  );
};
