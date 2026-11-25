import { ArrowUpRight, BedDouble, CalendarDays, KeyRound, Percent, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ADMIN_PATHS } from '../../lib/routes';
import { formatCurrency } from '../../lib/utils';
import type { RoomInventorySummaryResponse } from '../../types/api';

interface AdminStatsGridProps {
  isID: boolean;
  loading: boolean;
  bookingsError: boolean;
  inventory: RoomInventorySummaryResponse | null;
  stats: {
    totalRevenue: number;
    totalBookings: number;
    confirmedCount: number;
    checkedInCount: number;
    completedCount: number;
  };
}

export function AdminStatsGrid({ isID, loading, bookingsError, inventory, stats }: AdminStatsGridProps) {
  const number = new Intl.NumberFormat(isID ? 'id-ID' : 'en-US');
  const occupancy = inventory && inventory.totalUnits > 0 && Number.isFinite(inventory.occupiedUnits)
    ? Math.min(100, Math.round((inventory.occupiedUnits / inventory.totalUnits) * 100))
    : null;
  const hasBookings = !bookingsError && !loading;
  const metrics = [
    {
      label: isID ? 'Total pendapatan' : 'Total revenue',
      value: hasBookings ? formatCurrency(stats.totalRevenue) : '—',
      description: isID ? 'Dari reservasi lunas' : 'From paid reservations',
      icon: Wallet,
      tone: 'bg-emerald-50 text-emerald-800',
    },
    {
      label: isID ? 'Reservasi' : 'Reservations',
      value: hasBookings ? number.format(stats.totalBookings) : '—',
      description: hasBookings
        ? (isID ? `${number.format(stats.confirmedCount)} menunggu check-in` : `${number.format(stats.confirmedCount)} awaiting check-in`)
        : '',
      icon: CalendarDays,
      tone: 'bg-navy-soft text-navy-dark',
    },
    {
      label: isID ? 'Tamu menginap' : 'Active stays',
      value: hasBookings ? number.format(stats.checkedInCount) : '—',
      description: hasBookings
        ? (isID ? `${number.format(stats.completedCount)} masa inap selesai` : `${number.format(stats.completedCount)} stays completed`)
        : '',
      icon: KeyRound,
      tone: 'bg-gold-soft text-gold-dark',
    },
    {
      label: isID ? 'Okupansi kamar' : 'Room occupancy',
      value: occupancy != null && !loading ? `${occupancy}%` : '—',
      description: inventory && occupancy != null && !loading
        ? (isID ? `${number.format(inventory.occupiedUnits)} dari ${number.format(inventory.totalUnits)} unit terisi` : `${number.format(inventory.occupiedUnits)} of ${number.format(inventory.totalUnits)} rooms occupied`)
        : (isID ? 'Data unit kamar' : 'Physical room data'),
      icon: Percent,
      tone: 'bg-violet-50 text-violet-800',
    },
  ];

  return (
    <section aria-labelledby="admin-metrics" aria-busy={loading}>
      <h2 id="admin-metrics" className="mb-3 text-lg font-semibold text-navy-dark">{isID ? 'Ringkasan operasional' : 'Operations overview'}</h2>
      <dl className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
        {metrics.map(({ label, value, description, icon: Icon, tone }) => (
          <div key={label} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-5">
            <span className={`inline-grid size-8 place-items-center rounded-lg sm:size-10 ${tone}`}><Icon className="size-4 sm:size-5" aria-hidden /></span>
            <dt className="mt-2 text-xs font-semibold leading-4 text-slate-600 sm:text-sm">{label}</dt>
            <dd className="mt-1 break-words text-[clamp(1rem,2.25vw,1.85rem)] font-bold leading-tight tracking-tight text-navy-dark tabular-nums">{value}</dd>
            {description && <dd className="mt-1.5 text-xs leading-4 text-slate-600">{description}</dd>}
          </div>
        ))}
      </dl>
    </section>
  );
}

export function AdminRoomInventory({ inventory, loading, isID }: { inventory: RoomInventorySummaryResponse | null; loading: boolean; isID: boolean }) {
  const number = new Intl.NumberFormat(isID ? 'id-ID' : 'en-US');
  const segments = inventory ? [
    { label: isID ? 'Tersedia' : 'Available', count: inventory.availableUnits, color: 'bg-emerald-600' },
    { label: isID ? 'Terisi' : 'Occupied', count: inventory.occupiedUnits, color: 'bg-navy' },
    { label: isID ? 'Dipesan' : 'Reserved', count: inventory.reservedUnits, color: 'bg-sky-500' },
    { label: isID ? 'Perlu dibersihkan' : 'Housekeeping', count: inventory.housekeepingUnits, color: 'bg-amber-500' },
    { label: isID ? 'Tidak beroperasi' : 'Out of service', count: inventory.outOfServiceUnits, color: 'bg-slate-500' },
  ] : [];

  return (
    <section className="min-w-0 rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-labelledby="admin-inventory" aria-busy={loading}>
      <span className="inline-grid size-10 place-items-center rounded-xl bg-navy-soft text-navy"><BedDouble className="size-5" aria-hidden /></span>
      <h2 id="admin-inventory" className="mt-3 text-lg font-semibold leading-snug text-navy-dark">{isID ? 'Kesiapan kamar' : 'Room readiness'}</h2>
      {loading ? (
        <p className="mt-3 text-sm text-slate-600">{isID ? 'Memuat inventaris…' : 'Loading inventory…'}</p>
      ) : inventory ? (
        <>
          <p className="mt-1 text-sm text-slate-600">{number.format(inventory.totalUnits)} {isID ? 'unit kamar' : 'room units'}</p>
          <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-slate-100" aria-hidden>
            {segments.filter(segment => segment.count > 0).map(segment => (
              <span key={segment.label} className={segment.color} style={{ flex: segment.count }} />
            ))}
          </div>
          <dl className="mt-3 divide-y divide-slate-100">
            {segments.map(segment => (
              <div key={segment.label} className="flex items-center justify-between gap-2 py-2 text-sm">
                <dt className="flex items-center gap-2 text-slate-700"><span className={`size-2 rounded-full ${segment.color}`} aria-hidden />{segment.label}</dt>
                <dd className="font-semibold text-navy-dark tabular-nums">{Number.isFinite(segment.count) ? number.format(segment.count) : '—'}</dd>
              </div>
            ))}
          </dl>
        </>
      ) : (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{isID ? 'Data inventaris belum tersedia.' : 'Room inventory is unavailable.'}</p>
      )}
      <Link to={ADMIN_PATHS.housekeeping} className="mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-1 text-sm font-semibold text-navy hover:underline">
        {isID ? 'Buka Housekeeping' : 'Open Housekeeping'}<ArrowUpRight className="size-4" aria-hidden />
      </Link>
    </section>
  );
}
