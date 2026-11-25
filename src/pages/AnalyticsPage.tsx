import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { AlertCircle, ArrowRight, ArrowUpRight, BedDouble, CalendarDays, ChevronDown, Compass, Download, Info, MapPin, Moon, RefreshCw, Wallet } from 'lucide-react';
import { Booking, Hotel, Language } from '../types';
import { AnalyticsPeriod, AnalyticsDestination, buildTravelAnalytics, getAnalyticsYears } from '../lib/travelAnalytics';
import { AnalyticsPeriodControl } from '../components/analytics/AnalyticsPeriodControl';
import { AnalyticsStatusChart, AnalyticsTrendChart } from '../components/analytics/AnalyticsCharts';
import { formatCurrency } from '../lib/utils';
import { applyImageFallback } from '../lib/imageFallback';
import { fadeTween } from '../lib/motion';

interface AnalyticsPageProps {
  bookings: Booking[];
  hotels: Hotel[];
  bookingsLoading: boolean;
  bookingsRefreshing: boolean;
  bookingsLoaded: boolean;
  bookingsError: boolean;
  onRefresh: () => Promise<void>;
  language: Language;
}

const panel = 'rounded-[26px] border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,35,68,0.035)]';
const secondaryButton = 'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-semibold text-navy-dark transition-colors hover:border-navy/25 hover:bg-navy-soft/60 disabled:cursor-not-allowed disabled:opacity-45';

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({bookings, hotels, bookingsLoading, bookingsRefreshing, bookingsLoaded, bookingsError, onRefresh, language}) => {
  const isID = language === 'ID';
  const reduceMotion = useReducedMotion();
  const [period, setPeriod] = useState<AnalyticsPeriod>('all');
  const years = useMemo(() => getAnalyticsYears(bookings), [bookings]);
  const stats = useMemo(() => buildTravelAnalytics(bookings, hotels, period), [bookings, hotels, period]);
  const loading = bookingsLoading || !bookingsLoaded && !bookingsError;
  const periodLabel = period === 'all' ? (isID ? 'Semua waktu' : 'All time') : period === 'last12' ? (isID ? '12 bulan terakhir' : 'Last 12 months') : period.slice(5);
  const compactPaidValue = new Intl.NumberFormat(isID ? 'id-ID' : 'en-GB', {style:'currency',currency:'IDR',notation:'compact',maximumFractionDigits:1}).format(stats.paidValue);

  const downloadSummary = () => {
    if (!bookingsLoaded || bookingsRefreshing || !stats.bookingCount) return;
    const header = isID ? ['Periode check-in', 'Nilai pesanan lunas (IDR)', 'Jumlah reservasi', 'Malam selesai'] : ['Check-in period', 'Paid booking value (IDR)', 'Booking count', 'Completed nights'];
    const rows: (string | number)[][] = stats.trend.map(point => [point.key, point.paidValue, point.bookingCount, point.completedNights]);
    const dated = stats.trend.reduce((total, point) => ({value:total.value+point.paidValue,count:total.count+point.bookingCount,nights:total.nights+point.completedNights}), {value:0,count:0,nights:0});
    if (stats.bookingCount > dated.count) rows.push([isID ? 'Tanggal belum lengkap' : 'Date not available', stats.paidValue-dated.value, stats.bookingCount-dated.count, stats.completedNights-dated.nights]);
    rows.push([isID ? 'Total periode' : 'Period total', stats.paidValue, stats.bookingCount, stats.completedNights]);
    // Export only validated period keys and numeric aggregates, without guest details.
    const csv = [header, ...rows].map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob(['\uFEFF', csv], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `roomly-statistik-${period.replace(/[^a-zA-Z0-9-]/g, '-')}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return <div className="analytics-page mx-auto max-w-[1400px] space-y-6 pb-12 sm:space-y-7" data-analytics-page>
    <motion.section initial={reduceMotion ? false : {opacity:0}} animate={{opacity:1}} transition={fadeTween}
      className="relative rounded-[28px] bg-[#10253f] px-5 py-6 text-white sm:rounded-[32px] sm:px-8 sm:py-8 lg:px-10" aria-labelledby="analytics-heading" data-analytics-hero>
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center lg:gap-10">
        <div className="min-w-0">
          <p className="mb-3 flex items-center gap-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-light"><span className="h-px w-6 bg-gold-light/60" aria-hidden />{isID ? 'Jejak perjalananmu' : 'Your journey in numbers'}</p>
          <h1 id="analytics-heading" className="font-serif text-[32px] leading-[1.15] tracking-[-0.035em] sm:text-[43px]">{isID ? <>Statistik <span className="italic text-gold-light">perjalananmu.</span></> : <>Your travel <span className="italic text-gold-light">statistics.</span></>}</h1>
          <p className="mt-3 text-sm leading-6 text-white/75"><span className="sm:hidden">{isID ? 'Setiap reservasi, menjadi cerita dalam angka.' : 'Every reservation tells a story in numbers.'}</span><span className="hidden sm:inline">{isID ? 'Lihat nilai reservasi, malam yang telah dinikmati, dan tempat yang paling sering kamu singgahi.' : 'Explore your booking values, completed nights, and the places you return to most.'}</span></p>
        </div>
        <div className="w-full shrink-0 sm:w-[280px]">
          <p className="mb-2 hidden text-[10px] font-semibold uppercase tracking-[0.14em] text-gold-light lg:block">{isID ? 'Periode ringkasan' : 'Summary period'}</p>
          <div className="grid grid-cols-[minmax(0,1fr)_44px] items-center gap-2.5">
            <AnalyticsPeriodControl value={period} onChange={setPeriod} years={years} isID={isID} />
            <button type="button" onClick={() => { void onRefresh(); }} disabled={bookingsRefreshing} aria-busy={bookingsRefreshing} aria-label={isID ? 'Perbarui statistik' : 'Refresh statistics'} title={isID ? 'Perbarui statistik' : 'Refresh statistics'} className="flex size-11 cursor-pointer items-center justify-center rounded-xl border border-white/25 bg-white/5 text-white transition-colors hover:bg-white/15 disabled:cursor-wait disabled:opacity-50"><RefreshCw className={`size-4 ${bookingsRefreshing ? 'animate-spin motion-reduce:animate-none' : ''}`} aria-hidden /></button>
          </div>
          <p className="mt-2 text-[11px] leading-5 text-white/65">{isID ? 'Berdasarkan tanggal check-in reservasi.' : 'Based on the reservation check-in date.'}</p>
        </div>
      </div>
    </motion.section>

    {bookingsError && <div role="alert" className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4" data-analytics-error><AlertCircle className="size-5 shrink-0 text-amber-700" aria-hidden /><p className="min-w-0 flex-1 basis-48 text-sm leading-6 text-amber-900">{bookingsLoaded ? (isID ? 'Statistik belum dapat diperbarui. Ringkasan dari data terakhir masih ditampilkan.' : 'Statistics could not be refreshed. Your last loaded summary is still shown.') : (isID ? 'Statistik belum dapat dimuat. Periksa koneksi lalu coba lagi.' : 'Statistics could not be loaded. Check your connection and try again.')}</p><button type="button" disabled={bookingsRefreshing} onClick={() => { void onRefresh(); }} className={secondaryButton}><RefreshCw className="size-4" aria-hidden />{isID ? 'Coba lagi' : 'Try again'}</button></div>}

    {loading ? <AnalyticsSkeleton isID={isID} /> : bookingsLoaded && <>
      <section className="space-y-4" aria-labelledby="analytics-summary-heading">
        <div className="flex flex-wrap items-center justify-between gap-3 px-0.5">
          <div><h2 id="analytics-summary-heading" className="text-sm font-semibold text-navy-dark">{isID ? 'Ringkasan periode' : 'Period overview'} <span className="ml-1 font-normal text-slate-500">· {periodLabel}</span></h2><p role="status" aria-live="polite" className="mt-1 text-xs text-slate-500">{bookingsRefreshing ? (isID ? 'Menyinkronkan status reservasi…' : 'Syncing reservation statuses…') : `${stats.bookingCount} ${isID ? 'reservasi dalam ringkasan ini' : 'bookings in this overview'}`}</p></div>
          <button type="button" disabled={bookingsRefreshing || stats.bookingCount === 0} onClick={downloadSummary} className={secondaryButton} aria-label={isID ? 'Unduh ringkasan statistik CSV' : 'Download statistics summary CSV'}><Download className="size-4" aria-hidden /><span className="hidden sm:inline">{isID ? 'Unduh ringkasan' : 'Download summary'}</span><span className="sm:hidden">CSV</span></button>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 sm:gap-4" data-analytics-metrics>
          <article className="relative min-w-0 overflow-hidden rounded-[24px] border border-navy-dark bg-navy-dark p-4 text-white sm:p-5" data-stat="paid-value">
            <span className="mb-4 hidden size-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-gold-light sm:flex"><Wallet className="size-[18px]" aria-hidden /></span>
            <h3 className="min-h-10 text-xs font-medium leading-5 text-white/75 sm:min-h-0">{isID ? 'Nilai pesanan lunas' : 'Paid booking value'}</h3>
            <p className="mt-2 break-words font-serif text-[23px] leading-[1.2] tracking-tight text-gold-light sm:text-[26px]" title={formatCurrency(stats.paidValue)} aria-label={formatCurrency(stats.paidValue)}><span className="sm:hidden">{compactPaidValue}</span><span className="hidden sm:inline">{formatCurrency(stats.paidValue)}</span></p>
            <p className="mt-3 text-[11px] leading-5 text-white/65">{stats.paidCount} {isID ? 'pesanan berstatus lunas' : 'bookings marked paid'}</p>
          </article>
          <MetricCard label={isID ? 'Total reservasi' : 'Total bookings'} value={stats.bookingCount} description={isID ? 'Semua status dalam periode' : 'All statuses in this period'} icon={<CalendarDays className="size-[18px]" aria-hidden />} metric="bookings" />
          <MetricCard label={isID ? 'Malam selesai' : 'Completed nights'} value={stats.completedNights} description={`${stats.completedCount} ${isID ? 'reservasi selesai' : 'completed stays'}`} icon={<Moon className="size-[18px]" aria-hidden />} metric="nights" />
          <MetricCard label={isID ? 'Penginapan dikunjungi' : 'Properties visited'} value={stats.visitedHotelCount} description={isID ? 'Dari reservasi yang selesai' : 'From completed stays'} icon={<BedDouble className="size-[18px]" aria-hidden />} metric="properties" />
        </div>
      </section>

      {stats.bookingCount > 0 ? <>
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(310px,1fr)] xl:gap-6">
          <AnalyticsTrendChart data={stats.trend} unit={stats.trendUnit} language={language} />
          <AnalyticsStatusChart data={stats.statuses} language={language} />
        </div>
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(310px,1fr)] xl:gap-6">
          <Destinations destinations={stats.destinations} completedCount={stats.completedCount} isID={isID} />
          <div className="space-y-5">
            <CalculationNotes isID={isID} />
            <div className="rounded-[26px] border border-[#e8e0d2] bg-[#f6f2e9] p-5 sm:p-6"><span className="mb-4 flex size-11 items-center justify-center rounded-2xl border border-gold-light/35 bg-white/70 text-gold"><Compass className="size-5" aria-hidden /></span><h2 className="font-serif text-[24px] leading-tight text-navy-dark">{isID ? 'Lihat cerita di balik angkanya.' : 'See the stories behind the numbers.'}</h2><p className="mt-3 text-sm leading-6 text-slate-600">{isID ? 'Buka detail reservasi, periksa pembayaran, atau siapkan perjalanan berikutnya.' : 'Open your reservation details, check a payment, or plan your next journey.'}</p><Link to="/bookings" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-navy-dark hover:text-gold">{isID ? 'Kelola pesanan' : 'Manage bookings'}<ArrowUpRight className="size-4" aria-hidden /></Link></div>
          </div>
        </div>
        {stats.undatedCount > 0 && <p className="px-1 text-xs leading-6 text-slate-500">{isID ? `${stats.undatedCount} reservasi belum memiliki tanggal check-in yang lengkap. Reservasi tersebut tidak dimasukkan ke grafik waktu dan filter tanggal.` : `${stats.undatedCount} bookings do not have a complete check-in date. They are excluded from the time chart and date filters.`}</p>}
      </> : <div className={`${panel} px-6 py-12 text-center sm:py-16`} data-analytics-empty><span className="mx-auto mb-5 flex size-16 items-center justify-center rounded-[22px] border border-gold-light/35 bg-gold-soft/70 text-gold"><Compass className="size-7" aria-hidden /></span><h2 className="font-serif text-[28px] leading-tight tracking-tight text-navy-dark">{bookings.length ? (isID ? 'Belum ada perjalanan pada periode ini.' : 'No journeys in this period yet.') : (isID ? 'Setiap perjalanan punya cerita.' : 'Every journey has a story.')}</h2><p className="mx-auto mt-3 max-w-[470px] text-sm leading-6 text-slate-500">{bookings.length ? (isID ? 'Coba periode lain untuk melihat kembali ringkasan reservasimu.' : 'Choose another period to revisit your reservation summary.') : (isID ? 'Setelah kamu membuat reservasi, ringkasan dan jejak menginapmu akan tersusun di sini.' : 'Once you make a reservation, your travel overview and completed stays will appear here.')}</p>{bookings.length ? <button type="button" onClick={() => setPeriod('all')} className={`${secondaryButton} mt-6`}>{isID ? 'Lihat semua waktu' : 'Show all time'}</button> : <Link to="/explore" className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-navy-dark px-6 text-sm font-semibold text-white hover:bg-navy">{isID ? 'Jelajahi penginapan' : 'Explore stays'}<ArrowRight className="size-4" aria-hidden /></Link>}</div>}
    </>}
  </div>;
};

function MetricCard({label,value,description,icon,metric}:{label:string;value:number;description:string;icon:React.ReactNode;metric:string}) {
  return <article className={`${panel} min-w-0 p-4 sm:p-5`} data-stat={metric}><span className="mb-4 hidden size-10 items-center justify-center rounded-xl bg-navy-soft/80 text-navy sm:flex">{icon}</span><h3 className="min-h-10 text-xs font-medium leading-5 text-slate-500 sm:min-h-0">{label}</h3><p className="mt-2 font-serif text-[29px] leading-none tracking-tight text-navy-dark sm:text-[34px]">{value.toLocaleString()}</p><p className="mt-3 text-[11px] leading-5 text-slate-500">{description}</p></article>;
}

function Destinations({destinations,completedCount,isID}:{destinations:AnalyticsDestination[];completedCount:number;isID:boolean}) {
  const [expanded,setExpanded] = useState(false);
  const shown = expanded ? destinations : destinations.slice(0,4);
  return <section className={`${panel} p-5 sm:p-6`} aria-labelledby="analytics-destinations-title" data-analytics-destinations>
    <div className="mb-5 flex items-start justify-between gap-3"><div><p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-gold">{isID ? 'Jejak menginap' : 'Your stay memories'}</p><h2 id="analytics-destinations-title" className="font-serif text-[25px] tracking-tight text-navy-dark">{isID ? 'Destinasi favoritmu' : 'Your favourite destinations'}</h2><p className="mt-2 text-xs leading-6 text-slate-500">{isID ? 'Dari reservasi yang telah selesai.' : 'Based on completed reservations.'}</p></div><MapPin className="mt-1 size-5 shrink-0 text-gold" aria-hidden /></div>
    {shown.length ? <div className="divide-y divide-slate-100">{shown.map((destination,index) => {
      const share = completedCount > 0 ? destination.count / completedCount * 100 : 0;
      return <div key={destination.key} className="flex min-w-0 items-center gap-3 py-4 first:pt-0 last:pb-0" data-analytics-destination><div className="relative size-14 shrink-0 overflow-hidden rounded-2xl bg-navy-soft">{destination.image ? <img src={destination.image} alt="" loading="lazy" onError={applyImageFallback} className="size-full object-cover" /> : <MapPin className="m-4 size-6 text-navy/50" aria-hidden />}</div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><h3 className="truncate text-sm font-semibold text-navy-dark" title={destination.name}>{destination.name}</h3><span className="shrink-0 text-xs font-semibold text-slate-600">{Math.round(share)}%</span></div><p className="mt-1 text-xs leading-5 text-slate-500">{destination.count} {isID ? 'reservasi' : 'stays'} · {destination.nights} {isID ? 'malam' : 'nights'} · {destination.hotelCount} {isID ? 'penginapan' : 'properties'}</p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden><div className={`h-full rounded-full ${index === 0 ? 'bg-gold' : 'bg-navy/65'}`} style={{width:`${Math.min(100,share)}%`}} /></div></div></div>;
    })}</div> : <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-5 py-8 text-center"><MapPin className="mb-4 size-7 text-slate-300" aria-hidden /><p className="text-sm font-semibold text-navy-dark">{isID ? 'Jejak perjalananmu sedang menanti.' : 'Your travel memories are waiting.'}</p><p className="mt-2 max-w-sm text-xs leading-6 text-slate-500">{isID ? 'Destinasi akan masuk ke ringkasan setelah reservasi selesai.' : 'Destinations will appear once your reservation is completed.'}</p></div>}
    {destinations.length > 4 && <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4"><p className="text-xs text-slate-500">{shown.length} {isID ? 'dari' : 'of'} {destinations.length} {isID ? 'destinasi' : 'destinations'}</p><button type="button" onClick={()=>setExpanded(value=>!value)} className={secondaryButton}>{expanded ? (isID ? 'Ringkas daftar' : 'Show less') : (isID ? 'Lihat semua destinasi' : 'Show all destinations')}<ChevronDown className={`size-4 ${expanded?'rotate-180':''}`} aria-hidden /></button></div>}
  </section>;
}

function CalculationNotes({isID}:{isID:boolean}) {
  return <details className={`${panel} group overflow-hidden`} data-analytics-method><summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 p-5 text-sm font-semibold text-navy-dark [&::-webkit-details-marker]:hidden sm:p-6"><Info className="size-[18px] shrink-0 text-gold" aria-hidden /><span className="flex-1">{isID ? 'Dasar perhitungan' : 'How this is calculated'}</span><ChevronDown className="size-4 text-slate-400 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden /></summary><div className="space-y-4 border-t border-slate-100 px-5 pb-5 pt-4 text-[13px] leading-6 text-slate-600 sm:px-6 sm:pb-6"><p><strong className="text-navy-dark">{isID ? 'Periode perjalanan. ' : 'Travel period. '}</strong>{isID ? 'Mengikuti tanggal check-in. Semua waktu mencakup reservasi mendatang; 12 bulan terakhir berakhir hari ini.' : 'Follows the check-in date. All time includes future reservations; the last 12 months ends today.'}</p><p><strong className="text-navy-dark">{isID ? 'Nilai pesanan lunas. ' : 'Paid booking value. '}</strong>{isID ? 'Jumlah nilai reservasi dengan pembayaran berstatus lunas, termasuk yang dibatalkan jika status pembayarannya masih lunas. Ini bukan pengeluaran bersih: biaya pembatalan dan pengembalian sebagian belum diperhitungkan. Pesanan berstatus dana dikembalikan dikecualikan.' : 'The value of reservations marked paid, including cancelled bookings whose payment is still marked paid. This is not net spending: cancellation fees and partial refunds are not accounted for. Bookings marked refunded are excluded.'}</p><p><strong className="text-navy-dark">{isID ? 'Malam dan tempat yang dikunjungi. ' : 'Completed nights and properties visited. '}</strong>{isID ? 'Hanya menghitung reservasi selesai. Reservasi aktif dan malam yang masih direncanakan belum termasuk.' : 'Only completed reservations count. Active bookings and planned nights are excluded.'}</p><p><strong className="text-navy-dark">{isID ? 'Destinasi. ' : 'Destinations. '}</strong>{isID ? 'Dikelompokkan menurut kota penginapan. Nama atau lokasi penginapan digunakan jika kota belum tersedia.' : 'Grouped by property city. The property name or location is used when a city is not available.'}</p></div></details>;
}

function AnalyticsSkeleton({isID}:{isID:boolean}) {
  return <div role="status" aria-label={isID?'Memuat statistik':'Loading statistics'} aria-busy="true" className="space-y-6" data-analytics-loading><div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">{[0,1,2,3].map(index=><div key={index} className={`${panel} space-y-5 p-5`}><div className="size-10 animate-pulse rounded-xl bg-slate-100 motion-reduce:animate-none" /><div className="h-4 w-3/4 animate-pulse rounded bg-slate-100 motion-reduce:animate-none" /><div className="h-8 w-2/3 animate-pulse rounded bg-slate-100 motion-reduce:animate-none" /><div className="h-3 w-full animate-pulse rounded bg-slate-100 motion-reduce:animate-none" /></div>)}</div><div className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">{[0,1].map(index=><div key={index} className={`${panel} h-[380px] animate-pulse bg-slate-100/70 motion-reduce:animate-none`} />)}</div></div>;
}
