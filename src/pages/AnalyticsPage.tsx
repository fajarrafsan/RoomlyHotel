import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  TrendingUp,
  MapPin,
  Wallet,
  Calendar,
  Clock,
  Receipt,
  Hotel
} from 'lucide-react';
import { Language, Booking } from '../types';
import { formatCurrency } from '../lib/utils';

interface AnalyticsPageProps {
  bookings: Booking[];
  language: Language;
}

const CHART_COLORS = ['#0f172a', '#334155', '#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0'];

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({
  bookings,
  language
}) => {
  const isID = language === 'ID';

  const stats = useMemo(() => {
    const paidStatuses: Booking['status'][] = ['confirmed', 'checked-in', 'completed'];
    const paidBookings = bookings.filter((b) => paidStatuses.includes(b.status));

    const totalSpend = paidBookings.reduce((sum, b) => sum + b.totalPrice, 0);
    const totalNights = paidBookings.reduce((sum, b) => sum + b.nights, 0);
    const avgRate = totalNights > 0 ? Math.round(totalSpend / totalNights) : 0;
    const pendingCount = bookings.filter((b) => b.status === 'pending').length;

    const monthlyMap = new Map<string, number>();
    paidBookings.forEach((b) => {
      const month = b.checkIn?.slice(0, 7) || 'unknown';
      monthlyMap.set(month, (monthlyMap.get(month) || 0) + b.totalPrice);
    });
    const monthlyData = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => ({ month, total }));

    const locationMap = new Map<string, number>();
    paidBookings.forEach((b) => {
      const key = b.hotelLocation || b.hotelName;
      locationMap.set(key, (locationMap.get(key) || 0) + 1);
    });
    const locationDistribution = Array.from(locationMap.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([name, count], idx) => ({
        name,
        count,
        value: Math.round((count / Math.max(1, paidBookings.length)) * 100),
        color: CHART_COLORS[idx % CHART_COLORS.length],
      }));

    return { totalSpend, totalNights, avgRate, pendingCount, monthlyData, locationDistribution, paidCount: paidBookings.length };
  }, [bookings]);

  const statCards = [
    {
      icon: Wallet,
      label: isID ? 'Total Pengeluaran' : 'Total Spend',
      value: formatCurrency(stats.totalSpend),
      sub: isID ? `${stats.paidCount} reservasi terbayar` : `${stats.paidCount} paid bookings`,
      accent: 'bg-slate-950 text-white'
    },
    {
      icon: Calendar,
      label: isID ? 'Rata-rata / Malam' : 'Avg Rate / Night',
      value: formatCurrency(stats.avgRate),
      sub: `${stats.totalNights} ${isID ? 'malam' : 'nights'}`,
      accent: 'bg-slate-50 text-slate-600 border border-slate-100'
    },
    {
      icon: Clock,
      label: isID ? 'Menunggu' : 'Pending',
      value: String(stats.pendingCount),
      sub: isID ? 'reservasi belum lunas' : 'unpaid booking(s)',
      accent: 'bg-slate-50 text-slate-600 border border-slate-100'
    },
    {
      icon: Hotel,
      label: isID ? 'Total Reservasi' : 'Total Bookings',
      value: String(bookings.length),
      sub: isID ? 'sepanjang riwayat' : 'across history',
      accent: 'bg-slate-50 text-slate-600 border border-slate-100'
    }
  ];

  return (
    <div className="max-w-[1800px] mx-auto space-y-8 pb-20 px-4 sm:px-6 lg:px-12 2xl:px-16">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-slate-950 tracking-tight">
            {isID ? 'Analitik Perjalanan' : 'Travel Analytics'}
          </h1>
          <p className="text-[14px] text-slate-400 font-light max-w-md">
            {isID 
              ? 'Ringkasan statistik inap Anda berdasarkan data reservasi di Roomly.' 
              : 'A summary of your stay statistics based on your Roomly bookings.'}
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-50 border border-slate-100 text-[13px] font-medium text-slate-600">
          <TrendingUp className="w-4 h-4 text-slate-400" />
          <span>{stats.totalNights} {isID ? 'malam diinapi' : 'nights stayed'}</span>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: idx * 0.08 }}
            className="p-6 bg-white rounded-3xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4 hover:shadow-[0_8px_24px_rgba(0,0,0,0.05)] transition-all duration-300"
          >
            <span className={`w-10 h-10 rounded-2xl flex items-center justify-center ${card.accent}`}>
              <card.icon className="w-5 h-5" />
            </span>
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                {card.label}
              </span>
              <span className="text-2xl font-bold text-slate-950 tracking-tight block">
                {card.value}
              </span>
              <span className="text-[12px] text-slate-400 font-light">{card.sub}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Chart */}
        <div className="lg:col-span-2 p-6 sm:p-8 bg-white rounded-3xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900 tracking-tight">
                {isID ? 'Tren Pengeluaran Bulanan' : 'Monthly Spend Trend'}
              </h3>
              <p className="text-[12px] text-slate-400 font-light mt-0.5">
                {isID ? 'Total belanja per bulan' : 'Total spending per month'}
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            {stats.monthlyData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-slate-300" />
                </div>
                <span className="text-[13px] text-slate-400 font-light">
                  {isID ? 'Belum ada data reservasi terbayar.' : 'No paid bookings yet.'}
                </span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f172a" stopOpacity={0.08}/>
                      <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#cbd5e1" 
                    fontSize={11} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#cbd5e1" 
                    fontSize={11} 
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v / 1000000}M`}
                  />
                  <Tooltip 
                    formatter={(v: any) => [formatCurrency(Number(v)), isID ? 'Total' : 'Total']}
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: '1px solid #f1f5f9', 
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      fontSize: '12px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#0f172a" 
                    strokeWidth={2} 
                    fillOpacity={1} 
                    fill="url(#spendGrad)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pie Chart */}
        <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-6">
          <div>
            <h3 className="text-base font-semibold text-slate-900 tracking-tight">
              {isID ? 'Distribusi Destinasi' : 'Destination Share'}
            </h3>
            <p className="text-[12px] text-slate-400 font-light mt-0.5">
              {isID ? 'Persentase per lokasi' : 'Percentage by location'}
            </p>
          </div>

          {stats.locationDistribution.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-slate-300" />
              </div>
              <span className="text-[13px] text-slate-400 font-light text-center px-4">
                {isID ? 'Belum ada data destinasi.' : 'No destination data yet.'}
              </span>
            </div>
          ) : (
            <>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.locationDistribution}
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {stats.locationDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '12px', 
                        border: '1px solid #f1f5f9', 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        fontSize: '12px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-50">
                {stats.locationDistribution.map((loc) => (
                  <div key={loc.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <span 
                        className="w-3 h-3 rounded-full shrink-0" 
                        style={{ backgroundColor: loc.color }} 
                      />
                      <span className="text-[13px] text-slate-700 font-medium truncate flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-slate-300 shrink-0" />
                        {loc.name}
                      </span>
                    </div>
                    <span className="text-[12px] font-semibold text-slate-500 shrink-0 ml-2">
                      {loc.value}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};