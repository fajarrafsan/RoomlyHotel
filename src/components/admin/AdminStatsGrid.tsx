import React from 'react';
import { motion } from 'motion/react';
import { Wallet, CalendarCheck, UserCheck, Percent, Building2 } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

interface AdminStatsGridProps {
  isID: boolean;
  stats: {
    totalRevenue: number;
    totalBookings: number;
    confirmedCount: number;
    checkedInCount: number;
    completedCount: number;
    cancelledCount: number;
    /** null when capacity is unknown — occupancy can't be computed without it. */
    occupancyRate: number | null;
    totalHotels: number;
    /** Real physical unit count from room-service; null if it couldn't be loaded. */
    totalInventory: number | null;
    availableUnits: number | null;
    occupiedUnits: number | null;
    outOfServiceUnits: number | null;
  };
}

export const AdminStatsGrid: React.FC<AdminStatsGridProps> = ({ isID, stats }) => {
  const cards = [
    {
      title: isID ? 'Total Pendapatan' : 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      subtext: isID ? 'Dari reservasi terkonfirmasi' : 'From confirmed stays',
      icon: Wallet,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      title: isID ? 'Total Pemesanan' : 'Total Bookings',
      value: stats.totalBookings.toLocaleString(),
      subtext: isID ? `${stats.confirmedCount} menunggu check-in` : `${stats.confirmedCount} pending check-in`,
      icon: CalendarCheck,
      color: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      title: isID ? 'Tamu Aktif / Check-In' : 'Active Check-Ins',
      value: stats.checkedInCount.toLocaleString(),
      subtext: isID ? `${stats.completedCount} selesai menginap` : `${stats.completedCount} completed stays`,
      icon: UserCheck,
      color: 'bg-amber-50 text-amber-600 border-amber-100',
    },
    {
      title: isID ? 'Tingkat Okupansi' : 'Occupancy Rate',
      value: stats.occupancyRate === null ? '—' : `${stats.occupancyRate}%`,
      subtext:
        stats.totalInventory === null
          ? (isID ? 'Kapasitas belum dapat dimuat' : 'Capacity unavailable')
          : isID
          ? `${stats.checkedInCount} dari ${stats.totalInventory} unit kamar terisi`
          : `${stats.checkedInCount} of ${stats.totalInventory} room units occupied`,
      icon: Percent,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
      {cards.map((card, idx) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.08, duration: 0.4 }}
          className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-100/90 shadow-xs hover:shadow-md transition-all space-y-2.5 sm:space-y-3"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {card.title}
            </span>
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl border flex items-center justify-center shrink-0 ${card.color}`}>
              <card.icon className="w-4 h-4" />
            </div>
          </div>

          <div>
            <p className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight truncate">
              {card.value}
            </p>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-light mt-0.5 sm:mt-1 leading-snug">
              {card.subtext}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
