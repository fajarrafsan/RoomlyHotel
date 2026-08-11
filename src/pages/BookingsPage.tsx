import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CalendarDays, Building2 } from 'lucide-react';
import { Booking, Language } from '../types';
import { BookingCard } from '../components/booking/BookingCard';

interface BookingsPageProps {
  bookings: Booking[];
  onOpenInvoice: (booking: Booking) => void;
  onCancelBooking: (bookingId: string) => void;
  language: Language;
}

export const BookingsPage: React.FC<BookingsPageProps> = ({
  bookings,
  onOpenInvoice,
  onCancelBooking,
  language
}) => {
  const isID = language === 'ID';
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'all') return true;
    return b.status === activeTab;
  });

  const tabs = [
    { key: 'all' as const, label: isID ? 'Semua' : 'All' },
    { key: 'pending' as const, label: isID ? 'Menunggu' : 'Pending' },
    { key: 'confirmed' as const, label: isID ? 'Aktif' : 'Active' },
    { key: 'completed' as const, label: isID ? 'Selesai' : 'Completed' },
    { key: 'cancelled' as const, label: isID ? 'Dibatalkan' : 'Cancelled' },
  ] as const;

  return (
    <div className="max-w-[1800px] mx-auto space-y-8 pb-20 px-4 sm:px-6 lg:px-12 2xl:px-16">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-5"
      >
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-semibold text-slate-950 tracking-tight">
            {isID ? 'Reservasi Saya' : 'My Bookings'}
          </h1>
          <div className="h-px w-12 bg-slate-200" />
          <p className="text-[14px] text-slate-400 font-light max-w-md">
            {isID
              ? 'Kelola invoice, lihat detail pembayaran, dan pantau status reservasi Anda.'
              : 'Manage invoices, view payment details, and track your reservation status.'}
          </p>
        </div>

        <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-white border border-slate-100 shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
          <span className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500">
            <CalendarDays className="w-5 h-5" />
          </span>
          <div>
            <p className="text-xl font-bold text-slate-950 leading-none">{bookings.length}</p>
            <p className="text-[11px] text-slate-400 font-medium mt-1">{isID ? 'Total Reservasi' : 'Total Bookings'}</p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1.5 bg-slate-50 rounded-2xl border border-slate-100 w-fit overflow-x-auto max-w-full">
        {tabs.map((tab) => {
          const count = bookings.filter((b) => tab.key === 'all' || b.status === tab.key).length;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative px-4 py-2 rounded-xl text-[13px] font-semibold transition-all duration-200 whitespace-nowrap flex items-center gap-1.5 ${
                active
                  ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.label}
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md leading-none ${
                active ? 'bg-slate-100 text-slate-700' : 'bg-slate-100/60 text-slate-400'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Booking List */}
      <div className="space-y-5">
        {filteredBookings.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-16 text-center bg-white rounded-3xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center mx-auto">
              <Building2 className="w-7 h-7 text-slate-300" />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-slate-700">
                {isID ? 'Tidak ada reservasi' : 'No bookings found'}
              </p>
              <p className="text-[13px] text-slate-400 font-light mt-1">
                {isID ? 'Belum ada reservasi di kategori ini.' : 'There are no reservations in this category.'}
              </p>
            </div>
          </motion.div>
        ) : (
          filteredBookings.map((booking, idx) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              isID={isID}
              index={idx}
              onOpenInvoice={onOpenInvoice}
              onCancelBooking={onCancelBooking}
            />
          ))
        )}
      </div>
    </div>
  );
};
