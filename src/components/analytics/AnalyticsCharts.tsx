import React, { useId, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts';
import { BarChart3, ChevronDown, CircleDashed, Table2 } from 'lucide-react';
import type { Language } from '../../types';
import type { AnalyticsStatus, AnalyticsTrendPoint } from '../../lib/travelAnalytics';

interface AnalyticsTrendChartProps {
  data: AnalyticsTrendPoint[];
  unit: 'month' | 'year';
  language: Language;
}

interface AnalyticsStatusChartProps {
  data: AnalyticsStatus[];
  language: Language;
}

const panel = 'min-w-0 rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,35,68,0.035)] sm:p-6';
const localeFor = (isID: boolean) => isID ? 'id-ID' : 'en-GB';

function money(value: number, isID: boolean): string {
  return new Intl.NumberFormat(localeFor(isID), {style: 'currency', currency: 'IDR', maximumFractionDigits: 0}).format(value);
}

function periodLabel(value: string, unit: 'month' | 'year', isID: boolean, short = false, withYear = false): string {
  if (unit === 'year') return value;
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return value;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, 15, 12);
  if (!Number.isFinite(date.getTime())) return value;
  return new Intl.DateTimeFormat(localeFor(isID), {
    month: short ? 'short' : 'long', ...(short ? withYear ? {year: '2-digit'} : {} : {year: 'numeric'}),
  }).format(date);
}

function numericValue(value: unknown): number | null {
  const result = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  return Number.isFinite(result) ? result : null;
}

function TrendTooltip({active, label, value, unit, isID, metric}: {
  active: boolean; label: unknown; value: unknown; unit: 'month' | 'year'; isID: boolean; metric: 'paidValue' | 'bookingCount';
}) {
  const amount = numericValue(value);
  if (!active || amount === null) return null;
  return <div role="status" aria-live="polite" className="max-w-[230px] rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_12px_32px_rgba(15,35,68,0.12)]">
    <p className="text-xs font-medium text-slate-500">{periodLabel(String(label ?? ''), unit, isID)}</p>
    <p className="mt-1 text-sm font-semibold text-navy-dark">{metric === 'paidValue' ? money(amount, isID) : `${amount.toLocaleString(localeFor(isID))} ${isID ? 'reservasi' : 'bookings'}`}</p>
    {metric === 'paidValue' && <p className="mt-1 text-[11px] leading-5 text-slate-500">{isID ? 'Nilai pesanan berstatus lunas' : 'Value of bookings marked paid'}</p>}
  </div>;
}

export function AnalyticsTrendChart({data, unit, language}: AnalyticsTrendChartProps) {
  const isID = language === 'ID';
  const headingId = useId();
  const tableId = useId();
  const [metric, setMetric] = useState<'paidValue' | 'bookingCount'>('paidValue');
  const hasValues = data.some(point => point[metric] > 0);
  const hasBookings = data.some(point => point.bookingCount > 0);
  const hasPaidBookings = data.some(point => point.paidCount > 0);
  const showTickYear = unit === 'month' && new Set(data.map(point => point.key.slice(0, 4))).size > 1;
  const number = new Intl.NumberFormat(localeFor(isID), {notation: 'compact', maximumFractionDigits: 1});
  const metricLabel = metric === 'paidValue' ? (isID ? 'Nilai pesanan lunas' : 'Paid booking value') : (isID ? 'Jumlah reservasi' : 'Number of bookings');

  return <section className={panel} aria-labelledby={headingId} data-analytics-trend>
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-gold">{isID ? 'Pola perjalanan' : 'Your travel pattern'}</p>
        <h2 id={headingId} className="font-serif text-[25px] leading-tight tracking-tight text-navy-dark">{isID ? 'Jejak reservasi' : 'Your booking timeline'}</h2>
        <p className="mt-2 text-xs leading-5 text-slate-500">{unit === 'month'
          ? (isID ? 'Dikelompokkan menurut bulan check-in.' : 'Grouped by check-in month.')
          : (isID ? 'Dikelompokkan menurut tahun check-in.' : 'Grouped by check-in year.')}</p>
      </div>
      <div className="inline-flex w-fit shrink-0 gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1" role="group" aria-label={isID ? 'Metrik grafik reservasi' : 'Booking chart metric'}>
        {(['paidValue', 'bookingCount'] as const).map(value => <button key={value} type="button" aria-pressed={metric === value} onClick={() => setMetric(value)} className={`inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg px-3 text-xs font-semibold transition-colors motion-reduce:transition-none ${metric === value ? 'bg-navy-dark text-white shadow-sm' : 'text-slate-600 hover:bg-white hover:text-navy-dark'}`}>
          {value === 'paidValue' ? (isID ? 'Nilai lunas' : 'Paid value') : (isID ? 'Reservasi' : 'Bookings')}
        </button>)}
      </div>
    </header>

    <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-xs">
      <p className="inline-flex items-center gap-2 font-medium text-slate-600"><span className={`size-2 rounded-full ${metric === 'paidValue' ? 'bg-navy' : 'bg-gold'}`} aria-hidden />{metricLabel}</p>
      <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{metric === 'paidValue' ? 'IDR' : (isID ? 'Pesanan' : 'Bookings')}</span>
    </div>
    <div className="mt-3 h-[260px] min-w-0 w-full" aria-label={`${metricLabel}, ${isID ? 'berdasarkan tanggal check-in' : 'by check-in date'}`}>
      {hasValues ? <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart data={data} margin={{top: 14, right: 6, left: -6, bottom: 0}} accessibilityLayer barCategoryGap="28%">
          <CartesianGrid vertical={false} stroke="#e8edf4" strokeDasharray="3 5" />
          <XAxis dataKey="key" tickFormatter={value => periodLabel(String(value), unit, isID, true, showTickYear)} tick={{fill: '#64748b', fontSize: 11}} tickLine={false} axisLine={false} minTickGap={20} tickMargin={12} height={36} />
          <YAxis tickFormatter={value => metric === 'paidValue' ? number.format(Number(value)) : Number(value).toLocaleString(localeFor(isID))} tick={{fill: '#64748b', fontSize: 10}} tickLine={false} axisLine={false} allowDecimals={false} width={56} tickMargin={8} />
          <Tooltip cursor={{fill: '#e9eef5', opacity: 0.55}} isAnimationActive={false} content={props => <TrendTooltip active={props.active} label={props.label} value={props.payload?.[0]?.value} unit={unit} isID={isID} metric={metric} />} />
          <Bar dataKey={metric} name={metricLabel} fill={metric === 'paidValue' ? '#1e3a8a' : '#a16207'} radius={[6, 6, 0, 0]} maxBarSize={46} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer> : <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-5 text-center" data-analytics-trend-empty>
        <span className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-navy-soft text-navy"><BarChart3 className="size-5" aria-hidden /></span>
        <p className="text-sm font-semibold text-navy-dark">{hasBookings && metric === 'paidValue'
          ? hasPaidBookings ? (isID ? `Nilai pesanan lunas tercatat ${money(0, isID)}.` : `Paid booking value is ${money(0, isID)}.`) : (isID ? 'Belum ada pesanan berstatus lunas.' : 'No bookings are marked paid yet.')
          : data.length === 0 ? (isID ? 'Belum ada data check-in untuk grafik ini.' : 'No check-in data for this chart yet.') : (isID ? 'Belum ada reservasi pada periode ini.' : 'No bookings in this period yet.')}</p>
        <p className="mt-2 max-w-[300px] text-xs leading-6 text-slate-500">{hasBookings && metric === 'paidValue'
          ? (isID ? 'Pilih Reservasi untuk melihat jumlah pesananmu.' : 'Choose Bookings to see your reservation counts.')
          : (isID ? 'Grafik akan terisi saat reservasi dengan tanggal check-in tersedia.' : 'This chart will fill when bookings with check-in dates are available.')}</p>
      </div>}
    </div>
    <p className="mt-3 text-[11px] leading-5 text-slate-500">{isID ? 'Periode mengikuti check-in, bukan tanggal pembayaran.' : 'Periods follow check-in dates, not payment dates.'}</p>

    {data.length > 0 && <details className="group mt-3 border-t border-slate-100 pt-2" data-analytics-trend-data>
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg text-xs font-semibold text-navy-dark [&::-webkit-details-marker]:hidden"><span className="inline-flex items-center gap-2"><Table2 className="size-4 text-gold" aria-hidden />{isID ? 'Lihat rincian data' : 'View exact data'}</span><ChevronDown className="size-4 text-slate-400 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden /></summary>
      <ul id={tableId} tabIndex={0} className="mt-2 max-h-[360px] space-y-3 overflow-y-auto overscroll-contain rounded-xl pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label={isID ? 'Rincian grafik menurut periode check-in' : 'Exact chart data by check-in period'}>
        {data.map(point => <li key={point.key} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
          <p className="mb-3 text-[13px] font-semibold text-navy-dark">{periodLabel(point.key, unit, isID)}</p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
            <div className="min-w-0"><dt className="text-slate-500">{isID ? 'Nilai pesanan lunas' : 'Paid booking value'}</dt><dd className="mt-1 break-words font-semibold leading-5 text-navy-dark">{money(point.paidValue, isID)}</dd></div>
            <div><dt className="text-slate-500">{isID ? 'Reservasi' : 'Bookings'}</dt><dd className="mt-1 font-semibold leading-5 text-navy-dark">{point.bookingCount.toLocaleString(localeFor(isID))}</dd></div>
            <div><dt className="text-slate-500">{isID ? 'Pesanan lunas' : 'Paid bookings'}</dt><dd className="mt-1 font-semibold leading-5 text-navy-dark">{point.paidCount.toLocaleString(localeFor(isID))}</dd></div>
            <div><dt className="text-slate-500">{isID ? 'Malam selesai' : 'Completed nights'}</dt><dd className="mt-1 font-semibold leading-5 text-navy-dark">{point.completedNights.toLocaleString(localeFor(isID))}</dd></div>
          </dl>
        </li>)}
      </ul>
    </details>}
  </section>;
}

const statusPresentation: Record<AnalyticsStatus['key'], {id: string; en: string; color: string}> = {
  pending: {id: 'Menunggu', en: 'Pending', color: '#b77917'},
  confirmed: {id: 'Terkonfirmasi', en: 'Confirmed', color: '#1e3a8a'},
  'checked-in': {id: 'Sedang menginap', en: 'Checked in', color: '#0e7490'},
  completed: {id: 'Selesai', en: 'Completed', color: '#047857'},
  cancelled: {id: 'Dibatalkan', en: 'Cancelled', color: '#be123c'},
  expired: {id: 'Kedaluwarsa', en: 'Expired', color: '#64748b'},
  'no-show': {id: 'Tidak hadir', en: 'No-show', color: '#7c3aed'},
};

export function AnalyticsStatusChart({data, language}: AnalyticsStatusChartProps) {
  const isID = language === 'ID';
  const headingId = useId();
  const rows = data.filter(entry => entry.count > 0).map(entry => ({...entry, ...statusPresentation[entry.key], name: isID ? statusPresentation[entry.key].id : statusPresentation[entry.key].en}));
  const total = rows.reduce((sum, entry) => sum + entry.count, 0);
  const percent = (count: number) => new Intl.NumberFormat(localeFor(isID), {style: 'percent', maximumFractionDigits: 1}).format(total > 0 ? count / total : 0);

  return <section className={panel} aria-labelledby={headingId} data-analytics-status>
    <header><p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-gold">{isID ? 'Ringkasan status' : 'Status overview'}</p><h2 id={headingId} className="font-serif text-[25px] leading-tight tracking-tight text-navy-dark">{isID ? 'Komposisi reservasi' : 'Your booking mix'}</h2><p className="mt-2 text-xs leading-5 text-slate-500">{isID ? 'Seluruh status dalam periode pilihanmu.' : 'Every status in your selected period.'}</p></header>
    {total > 0 ? <>
      <div className="relative mx-auto mt-3 h-[190px] w-full max-w-[260px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <PieChart accessibilityLayer>
            <Pie data={rows} dataKey="count" nameKey="name" innerRadius={60} outerRadius={83} paddingAngle={rows.length > 1 ? 3 : 0} stroke="none" isAnimationActive={false}>
              {rows.map(row => <Cell key={row.key} fill={row.color} />)}
            </Pie>
            <Tooltip isAnimationActive={false} content={props => {
              const amount = numericValue(props.payload?.[0]?.value);
              const name = props.payload?.[0]?.name;
              if (!props.active || amount === null) return null;
              return <div role="status" aria-live="polite" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-[0_8px_24px_rgba(15,35,68,0.12)]"><p className="text-xs font-semibold text-navy-dark">{typeof name === 'string' ? name : ''}</p><p className="mt-1 text-xs text-slate-600">{amount.toLocaleString(localeFor(isID))} {isID ? 'reservasi' : 'bookings'} · {percent(amount)}</p></div>;
            }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><p className="font-serif text-[34px] leading-none tracking-tight text-navy-dark" data-analytics-status-total>{total.toLocaleString(localeFor(isID))}</p><p className="mt-2 text-[11px] text-slate-500">{isID ? 'reservasi' : 'bookings'}</p></div>
      </div>
      <ul className="mt-2 space-y-1 border-t border-slate-100 pt-3" aria-label={isID ? 'Jumlah dan persentase tiap status' : 'Count and share of each status'}>
        {rows.map(row => <li key={row.key} className="flex min-h-8 items-center justify-between gap-3 text-xs" data-analytics-status-row data-status={row.key}><span className="inline-flex min-w-0 items-center gap-2"><span className="size-2 shrink-0 rounded-full" style={{backgroundColor: row.color}} aria-hidden /><span className="text-slate-600">{row.name}</span></span><span className="inline-flex shrink-0 items-center gap-2"><strong className="font-semibold text-navy-dark">{row.count.toLocaleString(localeFor(isID))}</strong><span className="min-w-[43px] text-right text-slate-500">{percent(row.count)}</span></span></li>)}
      </ul>
    </> : <div className="mt-5 flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-5 text-center" data-analytics-status-empty><span className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-navy-soft text-navy"><CircleDashed className="size-6" aria-hidden /></span><p className="text-sm font-semibold text-navy-dark">{isID ? 'Belum ada status untuk ditampilkan.' : 'No booking statuses to display yet.'}</p><p className="mt-2 max-w-[240px] text-xs leading-6 text-slate-500">{isID ? 'Komposisi akan muncul setelah ada reservasi dalam periode ini.' : 'The mix will appear when there are bookings in this period.'}</p></div>}
  </section>;
}
