import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { AlertCircle, ArrowRight, ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight, Compass, FileText, MapPin, RefreshCw, Search, TicketCheck, X } from 'lucide-react';
import { Booking, Language } from '../types';
import { BookingCancellationResponse } from '../types/api';
import { BookingCard } from '../components/booking/BookingCard';
import { BookingCancellationDialog } from '../components/booking/BookingCancellationDialog';
import { BookingInvoiceHistory } from '../components/booking/BookingInvoiceHistory';
import { BookingSortControl, BookingSort } from '../components/booking/BookingSortControl';
import { BookingFilter, bookingMatchesFilter } from '../lib/bookingPresentation';
import { ApiError } from '../lib/http';
import { formatDate, getTodayDateString } from '../lib/utils';
import { applyImageFallback } from '../lib/imageFallback';
import { fadeTween } from '../lib/motion';
import { bookingApi } from '../api/bookings';
import { useAuth } from '../context/AuthContext';

interface BookingsPageProps {
  bookings: Booking[];
  bookingsLoading?: boolean;
  bookingsRefreshing?: boolean;
  bookingsError?: boolean;
  bookingsLoaded?: boolean;
  onRefresh?: () => Promise<void>;
  onOpenInvoice: (booking: Booking) => void;
  onCancelBooking: (bookingId: string, reason?: string) => Promise<BookingCancellationResponse>;
  language: Language;
}

const PAGE_SIZE = 4;
const surface = 'rounded-[26px] border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,35,68,0.035)]';
const outlineButton = 'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-semibold text-navy-dark transition-colors hover:border-navy/25 hover:bg-navy-soft/50 disabled:cursor-not-allowed disabled:opacity-45';

export const BookingsPage: React.FC<BookingsPageProps> = ({
  bookings, bookingsLoading = false, bookingsRefreshing = false, bookingsError = false,
  bookingsLoaded = true, onRefresh, onOpenInvoice, onCancelBooking, language,
}) => {
  const isID = language === 'ID';
  const { user } = useAuth();
  const reduceMotion = useReducedMotion();
  const accountRef = useRef(user);
  accountRef.current = user;
  const mounted = useRef(false);
  const resultsRef = useRef<HTMLElement>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<BookingFilter>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<BookingSort>('newest');
  const [page, setPage] = useState(0);
  const [invoicesOpen, setInvoicesOpen] = useState(false);
  const [invoiceRefreshKey, setInvoiceRefreshKey] = useState(0);
  const [invoiceBookingIds, setInvoiceBookingIds] = useState<string[]>([]);
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelResult, setCancelResult] = useState<BookingCancellationResponse | null>(null);
  const [cancelMode, setCancelMode] = useState<'cancel' | 'view'>('cancel');
  const cancelBusy = useRef(false);
  const cancelRequest = useRef(0);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; cancelRequest.current++; };
  }, []);

  const closeCancellation = () => {
    if (cancelBusy.current) return;
    cancelRequest.current++;
    setCancellingBooking(null);
    setCancelReason('');
    setCancelError(null);
    setCancelResult(null);
  };

  const startCancellation = (booking: Booking) => {
    if (cancelBusy.current) return;
    setCancellingBooking(booking);
    setCancelReason('');
    setCancelError(null);
    setCancelResult(null);
    setCancelMode('cancel');
  };

  const viewCancellation = async (booking: Booking) => {
    if (cancelBusy.current) return;
    const account = user;
    const request = ++cancelRequest.current;
    const current = () => mounted.current && accountRef.current === account && cancelRequest.current === request;
    cancelBusy.current = true;
    setCancellingBooking(booking);
    setCancelMode('view');
    setCancelResult(null);
    setCancelError(null);
    setCancelSubmitting(true);
    try {
      const result = await bookingApi.cancellation(Number(booking.id));
      if (current()) setCancelResult(result);
    } catch (error) {
      if (current()) setCancelError(error instanceof ApiError && error.status === 404
        ? (isID ? 'Rincian pembatalan belum tersedia untuk pesanan ini. Status reservasi tetap mengikuti data pesanan terbaru.' : 'Cancellation details are not available for this booking. The latest booking status still applies.')
        : (isID ? 'Rincian pembatalan belum dapat dimuat. Silakan coba lagi.' : 'Cancellation details could not be loaded. Please try again.'));
    } finally {
      if (current()) { cancelBusy.current = false; setCancelSubmitting(false); }
    }
  };

  const submitCancellation = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!cancellingBooking || cancelBusy.current) return;
    const account = user;
    const request = ++cancelRequest.current;
    const current = () => mounted.current && accountRef.current === account && cancelRequest.current === request;
    cancelBusy.current = true;
    setCancelSubmitting(true);
    setCancelError(null);
    try {
      const result = await onCancelBooking(cancellingBooking.id, cancelReason.trim() || undefined);
      if (current()) { setCancelResult(result); setInvoiceRefreshKey(value => value + 1); }
    } catch (error) {
      if (current()) setCancelError(error instanceof ApiError && error.status < 500 ? error.message
        : (isID ? 'Pembatalan belum berhasil dikonfirmasi. Periksa status pesanan atau coba lagi.' : 'Cancellation could not be confirmed. Check the booking status or try again.'));
    } finally {
      if (current()) { cancelBusy.current = false; setCancelSubmitting(false); }
    }
  };

  const tabs: { key: BookingFilter; label: string }[] = [
    { key: 'all', label: isID ? 'Semua pesanan' : 'All bookings' },
    { key: 'pending', label: isID ? 'Menunggu' : 'Pending' },
    { key: 'active', label: isID ? 'Aktif' : 'Active' },
    { key: 'completed', label: isID ? 'Selesai' : 'Completed' },
    { key: 'cancelled', label: isID ? 'Dibatalkan' : 'Cancelled' },
    { key: 'ended', label: isID ? 'Berakhir' : 'Ended' },
  ];
  const count = (filter: BookingFilter) => bookings.filter(booking => bookingMatchesFilter(booking, filter)).length;
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredBookings = bookings.filter(booking => bookingMatchesFilter(booking, activeTab)
    && `${booking.bookingCode} ${booking.hotelName} ${booking.hotelLocation} ${booking.roomType}`.toLocaleLowerCase().includes(normalizedQuery))
    .sort((a, b) => sort === 'check-in' ? a.checkIn.localeCompare(b.checkIn) || b.bookedAt.localeCompare(a.bookedAt)
      : sort === 'price' ? b.totalPrice - a.totalPrice || b.bookedAt.localeCompare(a.bookedAt)
        : b.bookedAt.localeCompare(a.bookedAt) || Number(b.id) - Number(a.id));
  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const visibleBookings = filteredBookings.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const today = getTodayDateString();
  const nextStay = bookings.filter(booking => booking.status === 'checked-in' || booking.status === 'confirmed' && booking.checkIn >= today)
    .sort((a, b) => Number(b.status === 'checked-in') - Number(a.status === 'checked-in') || a.checkIn.localeCompare(b.checkIn))[0];
  const selectFilter = (filter: BookingFilter, scroll = false) => {
    setActiveTab(filter); setPage(0);
    if (scroll) resultsRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  };
  const showInvoices = () => {
    setInvoicesOpen(true);
    invoiceRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  };

  return <div className="bookings-page mx-auto max-w-[1400px] space-y-7 pb-12 sm:space-y-9" data-bookings-page>
    <motion.section initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={fadeTween} className="relative isolate overflow-hidden rounded-[28px] bg-[#10253f] text-white sm:rounded-[32px]" aria-labelledby="bookings-heading" data-bookings-hero>
      <div className="grid lg:grid-cols-[1.15fr_1fr]">
        <div className="relative z-10 px-5 py-6 sm:px-9 sm:py-9 lg:px-10 lg:py-10">
          <p className="mb-3 flex items-center gap-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-light sm:mb-4"><span className="h-px w-6 bg-gold-light/70" aria-hidden />{isID ? 'Ruang perjalananmu' : 'Your travel space'}</p>
          <h1 id="bookings-heading" className="font-serif text-[34px] leading-[1.1] tracking-[-0.04em] sm:text-[48px]">{isID ? <>Pesanan <span className="italic text-gold-light">saya.</span></> : <>My <span className="italic text-gold-light">bookings.</span></>}</h1>
          <p className="mt-2 max-w-[390px] text-sm leading-6 text-white/75 sm:mt-3 sm:text-[15px]"><span className="sm:hidden">{isID ? 'Semua pesanan dan dokumen perjalananmu, di satu tempat.' : 'Your bookings and travel documents, in one place.'}</span><span className="hidden sm:inline">{isID ? 'Dari rencana menginap hingga kenangan perjalanan. Semua reservasi, tertata di satu tempat.' : 'From your next stay to your travel memories. Every reservation, together in one place.'}</span></p>
          <div className="mt-4 flex flex-wrap items-center gap-2 sm:mt-6 sm:gap-3">
            <Link to="/explore" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-gold-light px-4 text-[13px] font-semibold text-[#10253f] transition-colors hover:bg-white sm:px-5"><Compass className="size-4" aria-hidden /><span className="sm:hidden">{isID ? 'Cari hotel' : 'Find a stay'}</span><span className="hidden sm:inline">{isID ? 'Rencanakan perjalanan' : 'Plan a new trip'}</span><ArrowUpRight className="size-4" aria-hidden /></Link>
            <button type="button" onClick={showInvoices} aria-label={isID ? 'Dokumen invoice' : 'Invoice documents'} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full px-2 text-[13px] font-medium text-white/90 transition-colors hover:bg-white/10 sm:px-3"><FileText className="size-4 text-gold-light" aria-hidden /><span className="sm:hidden">Invoice</span><span className="hidden sm:inline">{isID ? 'Dokumen invoice' : 'Invoice documents'}</span></button>
          </div>
          <div className="mt-7 hidden grid-cols-3 divide-x divide-white/15 border-t border-white/15 pt-5 sm:grid" aria-label={isID ? 'Ringkasan pesanan' : 'Booking summary'}>
            {([{key:'all',label:isID?'Total pesanan':'Total bookings'}, {key:'active',label:isID?'Reservasi aktif':'Active stays'}, {key:'pending',label:isID?'Menunggu':'Pending'}] as const).map((item, index) => <button key={item.key} type="button" onClick={() => selectFilter(item.key, true)} className={`group min-w-0 cursor-pointer text-left ${index ? 'pl-4 sm:pl-6' : 'pr-3'}`}><span className="block font-serif text-[28px] leading-none text-white transition-colors group-hover:text-gold-light">{bookingsLoaded ? count(item.key).toLocaleString() : '—'}</span><span className="mt-2 block text-xs text-white/70">{item.label}<ArrowUpRight className="ml-1 inline size-3 text-gold-light" aria-hidden /></span></button>)}
          </div>
        </div>
        <div className="mx-3 mb-3 flex min-w-0 items-center gap-3 rounded-[20px] border border-white/10 bg-white/[0.06] p-3 sm:mx-4 sm:mb-4 lg:hidden" data-bookings-next-stay-compact>
          <img src={nextStay?.hotelImage || '/images/seed/hotels/samudra-belitung.png'} alt={nextStay?.hotelName || ''} onError={applyImageFallback} className="size-20 shrink-0 rounded-xl object-cover" />
          <div className="min-w-0"><p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-gold-light">{bookingsLoading ? (isID ? 'Memuat perjalanan' : 'Loading stays') : nextStay?.status === 'checked-in' ? (isID ? 'Sedang menginap' : 'Current stay') : (isID ? 'Perjalanan berikutnya' : 'Your next stay')}</p><h2 className="line-clamp-2 font-serif text-[17px] leading-[1.25] text-white">{nextStay?.hotelName || (isID ? 'Siap untuk cerita berikutnya?' : 'Ready for your next story?')}</h2><p className="mt-1.5 text-[11px] leading-4 text-white/75">{nextStay ? `${formatDate(nextStay.checkIn, language)} — ${formatDate(nextStay.checkOut, language)}` : (isID ? 'Temukan penginapan favoritmu di Roomly.' : 'Find your favourite stay on Roomly.')}</p></div>
        </div>
        <div className="relative m-4 ml-0 hidden min-h-0 overflow-hidden rounded-[22px] lg:block" data-bookings-next-stay>
          <img src={nextStay?.hotelImage || '/images/seed/hotels/samudra-belitung.png'} alt={nextStay?.hotelName || ''} onError={applyImageFallback} className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#071c30]/95 via-[#071c30]/30 to-[#071c30]/15" aria-hidden />
          <div className="relative flex h-full min-h-[220px] flex-col justify-between p-5 sm:min-h-[250px] sm:p-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-[#10253f]/45 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white backdrop-blur-sm"><CalendarDays className="size-3.5 text-gold-light" aria-hidden />{bookingsLoading ? (isID ? 'Memuat perjalanan' : 'Loading your stays') : nextStay?.status === 'checked-in' ? (isID ? 'Sedang menginap' : 'Your current stay') : (isID ? 'Perjalanan berikutnya' : 'Your next stay')}</span>
            <div className="pt-8"><h2 className="max-w-[460px] font-serif text-[25px] leading-[1.2] tracking-tight text-white sm:text-[29px]">{nextStay?.hotelName || (bookingsLoading ? (isID ? 'Menyiapkan pesananmu…' : 'Getting your bookings…') : !bookingsLoaded ? (isID ? 'Perjalananmu akan tampil di sini.' : 'Your next stay will appear here.') : (isID ? 'Jeda berikutnya, cerita baru.' : 'Your next escape, a new story.'))}</h2>
              {nextStay ? <><p className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-white/85"><MapPin className="mt-0.5 size-3.5 shrink-0 text-gold-light" aria-hidden />{nextStay.hotelLocation || nextStay.hotelAddress || nextStay.bookingCode}</p><div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-white/25 pt-3 text-xs font-medium text-white"><span>{formatDate(nextStay.checkIn, language)} <span className="mx-1 text-gold-light">—</span> {formatDate(nextStay.checkOut, language)}</span><span className="rounded-full bg-white/15 px-2.5 py-1">{nextStay.nights} {isID ? 'malam' : 'nights'}</span></div></> : <p className="mt-2 max-w-[340px] text-sm leading-6 text-white/80">{isID ? 'Reservasi aktif terdekat akan ditampilkan di sini, siap menyambut perjalananmu.' : 'Your next active reservation will appear here, ready for your journey.'}</p>}
            </div>
          </div>
        </div>
      </div>
    </motion.section>

    <section ref={resultsRef} className="scroll-mt-24 space-y-5" aria-labelledby="booking-list-heading" data-bookings-results>
      <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">{isID ? 'Semua rencana, satu tempat' : 'Every plan, one place'}</p><h2 id="booking-list-heading" className="font-serif text-[27px] tracking-tight text-navy-dark sm:text-[31px]">{isID ? 'Daftar reservasi' : 'Your reservations'}</h2></div>{onRefresh && <button type="button" onClick={() => { void onRefresh(); }} disabled={bookingsRefreshing} className={outlineButton} aria-label={isID ? 'Perbarui pesanan' : 'Refresh bookings'}><RefreshCw className={`size-4 ${bookingsRefreshing ? 'animate-spin motion-reduce:animate-none' : ''}`} aria-hidden />{bookingsRefreshing ? (isID ? 'Memperbarui…' : 'Refreshing…') : (isID ? 'Perbarui' : 'Refresh')}</button>}</div>
      <div className={`${surface} p-3 sm:p-4`}>
        <div className="bookings-scroll flex max-w-full gap-1.5 overflow-x-auto pb-3" role="group" aria-label={isID ? 'Filter status pesanan' : 'Filter booking status'}>
          {tabs.map(tab => <button key={tab.key} type="button" onClick={() => selectFilter(tab.key)} aria-pressed={activeTab === tab.key} className={`inline-flex min-h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full px-3.5 text-[13px] font-semibold transition-colors sm:px-4 ${activeTab === tab.key ? 'bg-navy-dark text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>{tab.label}<span className={`rounded-full px-1.5 text-[11px] leading-5 ${activeTab === tab.key ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-500'}`}>{bookingsLoaded ? count(tab.key) : '—'}</span></button>)}
        </div>
        <div className="flex flex-col gap-2.5 border-t border-slate-100 pt-3 sm:flex-row">
          <div className="relative min-w-0 flex-1"><label htmlFor="booking-search" className="sr-only">{isID ? 'Cari kode pesanan, hotel, atau kota' : 'Search booking code, hotel or city'}</label><Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden /><input id="booking-search" type="search" value={query} onChange={event => { setQuery(event.target.value); setPage(0); }} placeholder={isID ? 'Cari kode pesanan, hotel, atau kota…' : 'Search booking code, hotel or city…'} className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-12 text-base text-navy-dark outline-none placeholder:text-slate-500 focus:border-navy/40 sm:text-sm" />{query && <button type="button" onClick={() => { setQuery(''); setPage(0); }} aria-label={isID ? 'Hapus pencarian' : 'Clear search'} className="absolute right-0 top-1/2 flex size-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-xl text-slate-500 hover:text-navy"><X className="size-4" aria-hidden /></button>}</div>
          <BookingSortControl value={sort} onChange={value => { setSort(value); setPage(0); }} isID={isID} />
        </div>
      </div>
      {bookingsError && <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center"><AlertCircle className="size-5 shrink-0 text-amber-700" aria-hidden /><p className="flex-1 text-sm leading-6 text-amber-900">{bookingsLoaded ? (isID ? 'Pembaruan pesanan belum berhasil. Data terakhir tetap ditampilkan; perbarui sebelum melanjutkan tindakan.' : 'Bookings could not be refreshed. The last loaded data is shown; refresh before taking action.') : (isID ? 'Pesanan belum dapat dimuat. Periksa koneksi lalu coba lagi.' : 'Your bookings could not be loaded. Check your connection and try again.')}</p>{onRefresh && <button type="button" disabled={bookingsRefreshing} onClick={() => { void onRefresh(); }} className={outlineButton}><RefreshCw className="size-4" aria-hidden />{isID ? 'Coba lagi' : 'Try again'}</button>}</div>}
      <p role="status" aria-live="polite" className="px-1 text-xs text-slate-500">{bookingsLoading ? (isID ? 'Memuat reservasi…' : 'Loading reservations…') : !bookingsLoaded ? (isID ? 'Data pesanan belum tersedia.' : 'Booking data is not available yet.') : <>{filteredBookings.length.toLocaleString()} {isID ? 'pesanan' : 'bookings'}{normalizedQuery ? (isID ? ` cocok dengan “${query.trim()}”` : ` match “${query.trim()}”`) : (isID ? ' dalam daftar ini' : ' in this list')}{bookingsRefreshing && <span className="ml-2">· {isID ? 'Menyinkronkan status…' : 'Syncing status…'}</span>}</>}</p>
      {bookingsLoading ? <BookingListSkeleton isID={isID} /> : !bookingsLoaded && bookingsError ? null : visibleBookings.length ? <div className="space-y-5">{visibleBookings.map((booking, index) => <BookingCard key={booking.id} booking={booking} isID={isID} index={index} invoiceAvailable={invoiceBookingIds.includes(booking.id)} onOpenInvoice={onOpenInvoice} onCancelBooking={() => startCancellation(booking)} onViewCancellation={() => { void viewCancellation(booking); }} />)}</div> : <div className={`${surface} relative overflow-hidden px-6 py-12 text-center sm:py-16`} data-bookings-empty><span className="mx-auto mb-5 flex size-16 items-center justify-center rounded-[22px] border border-gold-light/30 bg-gold-soft/70 text-gold"><TicketCheck className="size-7" aria-hidden /></span><h3 className="font-serif text-[27px] tracking-tight text-navy-dark">{bookings.length === 0 ? (isID ? 'Cerita perjalananmu dimulai di sini.' : 'Your travel story starts here.') : (isID ? 'Belum ada pesanan yang cocok.' : 'No matching bookings yet.')}</h3><p className="mx-auto mt-3 max-w-[430px] text-sm leading-6 text-slate-500">{bookings.length === 0 ? (isID ? 'Temukan penginapan favoritmu. Setelah memesan, detail perjalanan dan statusnya akan tersimpan di sini.' : 'Find a stay you love. Your trip details and booking status will appear here after you book.') : (isID ? 'Coba kata kunci lain atau tampilkan semua status reservasi.' : 'Try a different search or show all booking statuses.')}</p>{bookings.length === 0 ? <Link to="/explore" className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-navy-dark px-6 text-sm font-semibold text-white transition-colors hover:bg-navy">{isID ? 'Jelajahi penginapan' : 'Explore stays'}<ArrowRight className="size-4" aria-hidden /></Link> : <button type="button" onClick={() => { setQuery(''); selectFilter('all'); }} className={`${outlineButton} mt-6`}>{isID ? 'Tampilkan semua pesanan' : 'Show all bookings'}</button>}</div>}
      {!bookingsLoading && filteredBookings.length > PAGE_SIZE && <nav aria-label={isID ? 'Halaman pesanan' : 'Booking pages'} className="flex flex-wrap items-center justify-between gap-3 px-1 pt-2"><p className="text-xs text-slate-500">{currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, filteredBookings.length)} {isID ? 'dari' : 'of'} {filteredBookings.length} {isID ? 'pesanan' : 'bookings'}</p><div className="flex items-center gap-2"><button type="button" disabled={currentPage === 0} onClick={() => { setPage(currentPage - 1); resultsRef.current?.scrollIntoView({behavior:reduceMotion?'auto':'smooth'}); }} className={`${outlineButton} px-3`} aria-label={isID ? 'Halaman pesanan sebelumnya' : 'Previous booking page'}><ChevronLeft className="size-4" aria-hidden /></button><span className="px-2 text-xs font-semibold text-navy-dark">{currentPage + 1} / {totalPages}</span><button type="button" disabled={currentPage + 1 === totalPages} onClick={() => { setPage(currentPage + 1); resultsRef.current?.scrollIntoView({behavior:reduceMotion?'auto':'smooth'}); }} className={`${outlineButton} px-3`} aria-label={isID ? 'Halaman pesanan berikutnya' : 'Next booking page'}><ChevronRight className="size-4" aria-hidden /></button></div></nav>}
    </section>
    {user?.role === 'CUSTOMER' && <div ref={invoiceRef} className="scroll-mt-24"><BookingInvoiceHistory language={language} open={invoicesOpen} onToggle={() => setInvoicesOpen(value => !value)} refreshKey={invoiceRefreshKey} onAvailableBookingIdsChange={setInvoiceBookingIds} /></div>}
    <BookingCancellationDialog booking={cancellingBooking} isID={isID} mode={cancelMode} reason={cancelReason} onReasonChange={setCancelReason} busy={cancelSubmitting} error={cancelError} result={cancelResult} onClose={closeCancellation} onSubmit={submitCancellation} onRetry={cancellingBooking ? () => { void viewCancellation(cancellingBooking); } : undefined} />
  </div>;
};

function BookingListSkeleton({isID}: {isID:boolean}) {
  return <div role="status" aria-label={isID ? 'Memuat pesanan' : 'Loading bookings'} aria-busy="true" className="space-y-5" data-bookings-loading>{[0,1].map(index => <div key={index} className={`${surface} grid gap-5 overflow-hidden p-4 sm:p-5 md:grid-cols-[240px_1fr]`}><div className="h-44 rounded-2xl bg-slate-200/70 animate-pulse motion-reduce:animate-none md:h-60" /><div className="space-y-5 py-3"><div className="h-4 w-32 rounded bg-slate-100 animate-pulse motion-reduce:animate-none" /><div className="h-7 w-3/4 rounded bg-slate-100 animate-pulse motion-reduce:animate-none" /><div className="h-16 rounded-xl bg-slate-100 animate-pulse motion-reduce:animate-none" /><div className="h-10 w-1/2 rounded-xl bg-slate-100 animate-pulse motion-reduce:animate-none" /></div></div>)}</div>;
}
