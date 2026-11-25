import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { AlertCircle, ArrowRight, ArrowUpRight, Check, ChevronLeft, ChevronRight, Compass, Heart, Loader2, MapPin, RefreshCw, Search, Undo2, X } from 'lucide-react';
import { Hotel, Language } from '../types';
import { useAuth } from '../context/AuthContext';
import { WishlistHotelCard } from '../components/wishlist/WishlistHotelCard';
import { WishlistSortControl } from '../components/wishlist/WishlistSortControl';
import { sortWishlistHotels, WishlistSort } from '../lib/wishlistPresentation';
import { applyImageFallback } from '../lib/imageFallback';
import { fadeTween } from '../lib/motion';

interface WishlistPageProps {
  hotels: Hotel[];
  wishlistHotels: Hotel[];
  wishlistIds: string[];
  wishlistSavedAt: Record<string, string>;
  wishlistLoading: boolean;
  wishlistRefreshing: boolean;
  wishlistLoaded: boolean;
  wishlistError: boolean;
  wishlistMutationError: boolean;
  wishlistPendingIds: string[];
  catalogLoading: boolean;
  catalogError: boolean;
  onRefresh: () => void;
  onSetSaved: (hotelId: string, saved: boolean) => Promise<boolean>;
  onSelectHotel: (hotel: Hotel) => void;
  language: Language;
}

type SavedChoice = Pick<Hotel, 'id' | 'name'>;
type Notice = { hotel: SavedChoice; phase: 'removing' | 'removed' | 'restoring' | 'restored' | 'remove-error' | 'restore-error'; keyboard: boolean };
const PAGE_SIZE = 6;
const panel = 'rounded-[26px] border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,35,68,0.035)]';
const secondaryButton = 'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-semibold text-navy-dark transition-colors hover:border-navy/25 hover:bg-navy-soft/60 disabled:cursor-not-allowed disabled:opacity-45';

export const WishlistPage: React.FC<WishlistPageProps> = ({
  hotels, wishlistHotels, wishlistIds, wishlistSavedAt, wishlistLoading, wishlistRefreshing,
  wishlistLoaded, wishlistError, wishlistMutationError, wishlistPendingIds, catalogLoading,
  catalogError, onRefresh, onSetSaved, onSelectHotel, language,
}) => {
  const isID = language === 'ID';
  const reduceMotion = useReducedMotion();
  const { user } = useAuth();
  const userRef = useRef(user);
  userRef.current = user;
  const mounted = useRef(false);
  const noticeSequence = useRef(0);
  const resultsRef = useRef<HTMLElement>(null);
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('ALL');
  const [sort, setSort] = useState<WishlistSort>('recent');
  const [page, setPage] = useState(0);
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; noticeSequence.current++; };
  }, []);

  useEffect(() => {
    if (!notice || !['removed', 'restored'].includes(notice.phase)) return;
    const sequence = noticeSequence.current;
    const timer = window.setTimeout(() => {
      if (document.querySelector('[data-wishlist-notice]:focus-within, [data-wishlist-notice]:hover')) return;
      if (noticeSequence.current === sequence) setNotice(null);
    }, notice.phase === 'removed' ? 12000 : 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const savedHotels = useMemo(() => {
    // The wishlist endpoint includes hotel details, even beyond the catalog's first page.
    const lookup = new Map([...wishlistHotels, ...hotels].map(hotel => [hotel.id, hotel]));
    return wishlistIds.flatMap(id => lookup.has(id) ? [lookup.get(id)!] : []);
  }, [hotels, wishlistHotels, wishlistIds]);
  const cities = useMemo(() => [...new Set(savedHotels.map(hotel => hotel.city).filter(Boolean))].sort((a, b) => a.localeCompare(b)), [savedHotels]);
  const selectedCity = cities.includes(city) ? city : 'ALL';
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filtered = sortWishlistHotels(savedHotels.filter(hotel => (selectedCity === 'ALL' || hotel.city === selectedCity)
    && `${hotel.name} ${hotel.city} ${hotel.location}`.toLocaleLowerCase().includes(normalizedQuery)), sort, wishlistSavedAt);
  const featured = sortWishlistHotels(savedHotels, 'recent', wishlistSavedAt).slice(0, 3);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const visible = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const unresolvedIds = wishlistLoaded && !catalogLoading && !catalogError
    ? wishlistIds.filter(id => !savedHotels.some(hotel => hotel.id === id)) : [];
  const loading = wishlistLoading || (!wishlistLoaded && !wishlistError);
  const refreshing = wishlistRefreshing || catalogLoading;
  const hasFilter = selectedCity !== 'ALL' || normalizedQuery.length > 0;
  const canRefresh = !refreshing && wishlistPendingIds.length === 0;

  const updateSaved = async (hotel: SavedChoice, saved: boolean) => {
    if (!user || wishlistPendingIds.includes(hotel.id)) return;
    const account = user;
    const sequence = ++noticeSequence.current;
    const keyboard = document.activeElement instanceof HTMLElement && document.activeElement.matches(':focus-visible');
    setNotice({ hotel, phase: saved ? 'restoring' : 'removing', keyboard });
    let success = false;
    try { success = await onSetSaved(hotel.id, saved); } catch { /* The shared cache retains the last confirmed state. */ }
    if (!mounted.current || userRef.current !== account || noticeSequence.current !== sequence) return;
    setNotice({ hotel, phase: success ? (saved ? 'restored' : 'removed') : (saved ? 'restore-error' : 'remove-error'), keyboard });
  };
  const removeHotel = (hotel: SavedChoice) => { void updateSaved(hotel, false); };
  const selectHotel = (hotel: Hotel) => {
    noticeSequence.current++;
    setNotice(null);
    onSelectHotel(hotel);
  };
  const resetFilters = () => { setQuery(''); setCity('ALL'); setPage(0); };
  const movePage = (next: number) => {
    setPage(next);
    resultsRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  };

  return <div className="wishlist-page mx-auto max-w-[1400px] space-y-7 pb-12 sm:space-y-9" data-wishlist-page>
    <motion.section initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={fadeTween}
      className="relative isolate overflow-hidden rounded-[28px] border border-[#e8e0d2] bg-[#f6f2e9] sm:rounded-[32px]" aria-labelledby="wishlist-heading" data-wishlist-hero>
      <div className="grid items-center lg:grid-cols-[1.08fr_1fr]">
        <div className="px-5 py-6 sm:px-9 sm:py-9 lg:px-10 lg:py-10">
          <p className="mb-3 flex items-center gap-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold"><span className="h-px w-6 bg-gold/50" aria-hidden />{isID ? 'Koleksi perjalananmu' : 'Your travel collection'}</p>
          <h1 id="wishlist-heading" className="font-serif text-[34px] leading-[1.13] tracking-[-0.04em] text-navy-dark sm:text-[47px]">Wishlist <span className="ml-1 italic text-gold">{isID ? 'pilihanmu.' : 'to wander.'}</span></h1>
          <p className="mt-3 max-w-[405px] text-sm leading-6 text-slate-600 sm:text-[15px]">{isID ? 'Penginapan yang menarik hatimu. Simpan inspirasinya, tentukan perjalananmu nanti.' : 'Stays that catch your eye. Save the inspiration and plan your next journey when you are ready.'}</p>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-600 sm:mt-6">
            <span className="inline-flex items-center gap-2"><Heart className="size-4 fill-gold/15 text-gold" aria-hidden /><strong className="text-sm text-navy-dark">{wishlistLoaded ? wishlistIds.length : '—'}</strong>{isID ? 'tersimpan' : 'saved stays'}</span>
            <span className="inline-flex items-center gap-2"><MapPin className="size-4 text-gold" aria-hidden /><strong className="text-sm text-navy-dark">{wishlistLoaded ? cities.length : '—'}</strong>{isID ? 'kota pilihan' : 'destinations'}</span>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3 sm:mt-6">
            <Link to="/explore" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-navy-dark px-5 text-[13px] font-semibold text-white transition-colors hover:bg-navy"><Compass className="size-4 text-gold-light" aria-hidden />{isID ? 'Cari inspirasi' : 'Find inspiration'}<ArrowUpRight className="size-4" aria-hidden /></Link>
            {savedHotels.length > 0 && <button type="button" onClick={() => resultsRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full px-2 text-[13px] font-semibold text-navy-dark transition-colors hover:bg-white/60">{isID ? 'Lihat koleksi' : 'View collection'}<ArrowRight className="size-4 text-gold" aria-hidden /></button>}
          </div>
        </div>
        <div className={`relative m-4 ml-0 hidden h-[286px] min-w-0 gap-3 lg:grid ${featured.length > 2 ? 'grid-cols-[1.2fr_0.8fr] grid-rows-2' : featured.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`} data-wishlist-collage>
          {featured.length > 0 ? featured.map((hotel, index) => <button key={hotel.id} type="button" onClick={() => selectHotel(hotel)} aria-label={isID ? `Lihat ${hotel.name}` : `View ${hotel.name}`} className={`group relative min-h-0 min-w-0 cursor-pointer overflow-hidden rounded-[22px] bg-navy-soft text-left focus-visible:outline-offset-[-4px] ${index === 0 && featured.length > 2 ? 'row-span-2' : ''}`}>
            <img src={hotel.image} alt="" onError={applyImageFallback} className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100" />
            <span className="absolute inset-0 bg-gradient-to-t from-[#071c30]/85 via-transparent to-transparent" aria-hidden />
            <span className="absolute inset-x-4 bottom-4 line-clamp-2 font-serif text-[18px] leading-tight text-white">{hotel.name}</span>
            {index === 0 && <span className="absolute left-4 top-4 flex size-10 items-center justify-center rounded-full border border-white/50 bg-white/90 text-gold"><Heart className="size-4 fill-current" aria-hidden /></span>}
          </button>) : <div className="relative overflow-hidden rounded-[22px] bg-navy-soft"><img src="/images/seed/hotels/samudra-belitung.png" alt="" className="absolute inset-0 size-full object-cover" onError={applyImageFallback} /><span className="absolute inset-0 bg-gradient-to-t from-[#071c30]/85 via-transparent to-transparent" aria-hidden /><p className="absolute inset-x-6 bottom-6 font-serif text-[28px] leading-tight text-white">{isID ? 'Temukan jeda berikutnya.' : 'Find your next escape.'}</p></div>}
        </div>
      </div>
    </motion.section>

    <section ref={resultsRef} className="scroll-mt-24 space-y-5" aria-labelledby="wishlist-results-heading" data-wishlist-results>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">{isID ? 'Disimpan untuk suatu hari' : 'Saved for someday'}</p><h2 id="wishlist-results-heading" className="font-serif text-[24px] tracking-tight text-navy-dark sm:text-[31px]">{isID ? 'Koleksi penginapan' : 'Your saved stays'}</h2></div>
        <button type="button" onClick={onRefresh} disabled={!canRefresh} aria-busy={refreshing} className={`${secondaryButton} px-3 sm:px-4`} aria-label={isID ? 'Perbarui wishlist' : 'Refresh wishlist'}><RefreshCw className={`size-4 ${refreshing ? 'animate-spin motion-reduce:animate-none' : ''}`} aria-hidden /><span className="hidden sm:inline">{refreshing ? (isID ? 'Memperbarui…' : 'Refreshing…') : (isID ? 'Perbarui' : 'Refresh')}</span></button>
      </div>
      {(wishlistLoaded && wishlistIds.length > 0 || loading) && <div className={`${panel} p-3 sm:p-4`}>
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <div className="relative min-w-0 flex-1"><label htmlFor="wishlist-search" className="sr-only">{isID ? 'Cari nama penginapan atau kota' : 'Search stay name or city'}</label><Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input id="wishlist-search" type="search" value={query} onChange={event => { setQuery(event.target.value); setPage(0); }} placeholder={isID ? 'Cari penginapan atau kota…' : 'Search stays or cities…'} className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-12 text-base text-navy-dark outline-none placeholder:text-slate-500 focus:border-navy/40 sm:text-sm" />
            {query && <button type="button" onClick={() => { setQuery(''); setPage(0); }} aria-label={isID ? 'Hapus pencarian' : 'Clear search'} className="absolute right-0 top-1/2 flex size-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-xl text-slate-500 hover:text-navy"><X className="size-4" aria-hidden /></button>}
          </div>
          <WishlistSortControl value={sort} onChange={value => { setSort(value); setPage(0); }} isID={isID} />
        </div>
        <div className="wishlist-scroll mt-3 flex max-w-full gap-1.5 overflow-x-auto border-t border-slate-100 pt-3" role="group" aria-label={isID ? 'Filter kota wishlist' : 'Filter wishlist cities'}>
          <button type="button" onClick={() => { setCity('ALL'); setPage(0); }} aria-pressed={selectedCity === 'ALL'} className={`inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full px-3.5 text-[13px] font-semibold transition-colors ${selectedCity === 'ALL' ? 'bg-navy-dark text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{isID ? 'Semua kota' : 'All cities'}<span className={`rounded-full px-1.5 text-[11px] leading-5 ${selectedCity === 'ALL' ? 'bg-white/15' : 'bg-slate-100'}`}>{wishlistLoaded ? savedHotels.length : '—'}</span></button>
          {cities.map(item => <button key={item} type="button" onClick={() => { setCity(item); setPage(0); }} aria-pressed={selectedCity === item} className={`inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full px-3.5 text-[13px] font-semibold transition-colors ${selectedCity === item ? 'bg-navy-dark text-white' : 'text-slate-600 hover:bg-slate-100'}`}><MapPin className="size-3.5" aria-hidden />{item}<span className={`rounded-full px-1.5 text-[11px] leading-5 ${selectedCity === item ? 'bg-white/15' : 'bg-slate-100'}`}>{savedHotels.filter(hotel => hotel.city === item).length}</span></button>)}
        </div>
      </div>}

      {wishlistError && <PageAlert text={wishlistLoaded ? (isID ? 'Koleksi belum dapat diperbarui. Daftar terakhir tetap ditampilkan.' : 'Your collection could not be refreshed. Your last loaded list is still shown.') : (isID ? 'Wishlist belum dapat dimuat. Periksa koneksi lalu coba lagi.' : 'Your wishlist could not be loaded. Check your connection and try again.')} retry={onRefresh} disabled={!canRefresh} isID={isID} />}
      {catalogError && wishlistLoaded && wishlistIds.length > 0 && <PageAlert text={isID ? 'Detail harga dan kamar belum dapat diperbarui. Penginapan tersimpan tetap ditampilkan; coba perbarui kembali.' : 'Room and price details could not be refreshed. Your saved stays are still shown; try refreshing again.'} retry={onRefresh} disabled={!canRefresh} isID={isID} />}
      {wishlistMutationError && !notice?.phase.endsWith('error') && <p role="alert" className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm leading-6 text-rose-700">{isID ? 'Perubahan wishlist belum berhasil. Koleksi dikembalikan ke keadaan sebelumnya; silakan coba lagi.' : 'Your wishlist could not be updated. Your previous collection has been restored; please try again.'}</p>}

      {loading ? <WishlistSkeleton isID={isID} /> : !wishlistLoaded && wishlistError ? null : <>
        {wishlistIds.length > 0 && <p role="status" aria-live="polite" className="px-1 text-xs leading-5 text-slate-500">{filtered.length} {isID ? 'penginapan' : 'stays'}{normalizedQuery ? (isID ? ` cocok dengan “${query.trim()}”` : ` match “${query.trim()}”`) : selectedCity !== 'ALL' ? (isID ? ` di ${selectedCity}` : ` in ${selectedCity}`) : (isID ? ' dalam koleksimu' : ' in your collection')}{wishlistPendingIds.length > 0 && <span className="ml-2">· {isID ? 'Menyimpan perubahan…' : 'Saving changes…'}</span>}</p>}
        {visible.length ? <div className="grid items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3" data-wishlist-grid>{visible.map((hotel, index) => <WishlistHotelCard key={hotel.id} hotel={hotel} language={language} savedAt={wishlistSavedAt[hotel.id]} pending={wishlistPendingIds.includes(hotel.id)} index={index} onRemove={removeHotel} onSelect={selectHotel} />)}</div>
          : wishlistIds.length === 0 ? <EmptyCollection isID={isID} />
            : hasFilter ? <div className={`${panel} px-6 py-12 text-center`} data-wishlist-no-results><Search className="mx-auto mb-4 size-8 text-slate-300" aria-hidden /><h3 className="font-serif text-[26px] text-navy-dark">{isID ? 'Belum ada pilihan yang cocok.' : 'No matching stays yet.'}</h3><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">{isID ? 'Coba nama penginapan atau kota lain, atau lihat seluruh koleksimu.' : 'Try another stay or city, or explore your full collection.'}</p><button type="button" onClick={resetFilters} className={`${secondaryButton} mt-5`}>{isID ? 'Tampilkan semua koleksi' : 'Show full collection'}</button></div> : null}
        {unresolvedIds.length > 0 && <div className={`${panel} p-5 sm:p-6`} data-wishlist-unresolved><h3 className="text-sm font-semibold text-navy-dark">{isID ? 'Sebagian detail belum tersedia' : 'Some details are not available'}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{isID ? 'Perbarui koleksi untuk memuat detail penginapan ini, atau hapus dari simpananmu.' : 'Refresh your collection to load these stays, or remove them from your saved list.'}</p><div className="mt-4 divide-y divide-slate-100">{unresolvedIds.map(id => <div key={id} className="flex items-center justify-between gap-4 py-3"><p className="min-w-0 break-words text-sm text-slate-600">{isID ? 'Penginapan tersimpan' : 'Saved stay'} #{id}</p><button type="button" disabled={wishlistPendingIds.includes(id)} onClick={() => removeHotel({id, name:isID ? `Penginapan #${id}` : `Stay #${id}`})} className={`${secondaryButton} shrink-0`}>{isID ? 'Hapus' : 'Remove'}</button></div>)}</div></div>}
        {filtered.length > PAGE_SIZE && <nav aria-label={isID ? 'Halaman wishlist' : 'Wishlist pages'} className="flex flex-wrap items-center justify-between gap-3 px-1 pt-2"><p className="text-xs text-slate-500">{currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, filtered.length)} {isID ? 'dari' : 'of'} {filtered.length} {isID ? 'penginapan' : 'stays'}</p><div className="flex items-center gap-2"><button type="button" disabled={currentPage === 0} onClick={() => movePage(currentPage - 1)} className={`${secondaryButton} px-3`} aria-label={isID ? 'Halaman wishlist sebelumnya' : 'Previous wishlist page'}><ChevronLeft className="size-4" aria-hidden /></button><span className="px-2 text-xs font-semibold text-navy-dark">{currentPage + 1} / {totalPages}</span><button type="button" disabled={currentPage + 1 === totalPages} onClick={() => movePage(currentPage + 1)} className={`${secondaryButton} px-3`} aria-label={isID ? 'Halaman wishlist berikutnya' : 'Next wishlist page'}><ChevronRight className="size-4" aria-hidden /></button></div></nav>}
      </>}
    </section>

    {notice && <WishlistNotice notice={notice} isID={isID} onRemove={() => removeHotel(notice.hotel)} onRestore={() => { void updateSaved(notice.hotel, true); }} onDismiss={() => { noticeSequence.current++; setNotice(null); }} />}
  </div>;
};

function PageAlert({text,retry,disabled,isID}:{text:string;retry:()=>void;disabled:boolean;isID:boolean}) {
  return <div role="alert" className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4"><AlertCircle className="size-5 shrink-0 text-amber-700" aria-hidden /><p className="min-w-0 flex-1 basis-48 text-sm leading-6 text-amber-900">{text}</p><button type="button" disabled={disabled} onClick={retry} className={secondaryButton}><RefreshCw className="size-4" aria-hidden />{isID ? 'Coba lagi' : 'Try again'}</button></div>;
}

function EmptyCollection({isID}:{isID:boolean}) {
  return <div className={`${panel} relative overflow-hidden px-6 py-12 text-center sm:py-16`} data-wishlist-empty><span className="mx-auto mb-5 flex size-16 items-center justify-center rounded-[22px] border border-gold-light/35 bg-gold-soft/70 text-gold"><Heart className="size-7" aria-hidden /></span><h3 className="font-serif text-[28px] leading-tight tracking-tight text-navy-dark">{isID ? 'Ruang untuk penginapan impianmu.' : 'Room for your dream stays.'}</h3><p className="mx-auto mt-3 max-w-[430px] text-sm leading-6 text-slate-500">{isID ? 'Ketuk ikon hati pada penginapan yang kamu suka. Pilihanmu akan tersimpan di sini, siap untuk perjalanan berikutnya.' : 'Tap the heart on a stay you love. Your favourites will be saved here for your next journey.'}</p><Link to="/explore" className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-navy-dark px-6 text-sm font-semibold text-white transition-colors hover:bg-navy">{isID ? 'Jelajahi penginapan' : 'Explore stays'}<ArrowRight className="size-4" aria-hidden /></Link></div>;
}

function WishlistSkeleton({isID}:{isID:boolean}) {
  return <div role="status" aria-label={isID ? 'Memuat wishlist' : 'Loading wishlist'} aria-busy="true" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" data-wishlist-loading>{[0,1,2].map(index => <div key={index} className={`${panel} overflow-hidden`}><div className="h-[200px] animate-pulse bg-slate-200/70 motion-reduce:animate-none" /><div className="space-y-4 p-5"><div className="h-4 w-24 animate-pulse rounded bg-slate-100 motion-reduce:animate-none" /><div className="h-7 w-3/4 animate-pulse rounded bg-slate-100 motion-reduce:animate-none" /><div className="h-4 w-1/2 animate-pulse rounded bg-slate-100 motion-reduce:animate-none" /><div className="h-12 animate-pulse rounded-xl bg-slate-100 motion-reduce:animate-none" /></div></div>)}</div>;
}

function WishlistNotice({notice,isID,onRemove,onRestore,onDismiss}:{notice:Notice;isID:boolean;onRemove:()=>void;onRestore:()=>void;onDismiss:()=>void}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<HTMLButtonElement>(null);
  const dismissRef = useRef<HTMLButtonElement>(null);
  const busy = notice.phase === 'removing' || notice.phase === 'restoring';
  const failed = notice.phase.endsWith('error');
  useEffect(() => {
    if (!notice.keyboard) return;
    if (document.activeElement !== document.body && !panelRef.current?.contains(document.activeElement)) return;
    if (busy) panelRef.current?.focus({preventScroll:true});
    else (actionRef.current || dismissRef.current)?.focus({preventScroll:true});
  }, [notice.phase, notice.keyboard, busy]);
  const title = {
    removing:isID?'Menghapus dari koleksi…':'Removing from your collection…',
    removed:isID?'Dihapus dari wishlist':'Removed from your wishlist',
    restoring:isID?'Memulihkan pilihanmu…':'Restoring your saved stay…',
    restored:isID?'Kembali ke wishlist':'Restored to your wishlist',
    'remove-error':isID?'Penginapan belum berhasil dihapus':'This stay could not be removed',
    'restore-error':isID?'Penginapan belum berhasil dipulihkan':'This stay could not be restored',
  }[notice.phase];
  return <div ref={panelRef} tabIndex={-1} role={failed?'alert':'status'} aria-live="polite" className="fixed inset-x-4 bottom-4 z-[70] mx-auto flex max-w-[580px] items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_14px_48px_rgba(12,31,59,0.18)] outline-none sm:bottom-6" data-wishlist-notice>
    <span className={`mt-0.5 shrink-0 ${failed?'text-rose-600':'text-gold'}`}>{busy?<Loader2 className="size-5 animate-spin motion-reduce:animate-none" aria-hidden />:failed?<AlertCircle className="size-5" aria-hidden />:notice.phase==='restored'?<Check className="size-5" aria-hidden />:<Heart className="size-5" aria-hidden />}</span>
    <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-navy-dark">{title}</p><p className="mt-1 truncate text-xs leading-5 text-slate-500" title={notice.hotel.name}>{notice.hotel.name}</p>
      {notice.phase==='removed'&&<button ref={actionRef} type="button" onClick={onRestore} className="mt-1 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg pr-3 text-[13px] font-semibold text-gold hover:text-navy"><Undo2 className="size-4" aria-hidden />{isID?'Urungkan':'Undo'}</button>}
      {failed&&<button ref={actionRef} type="button" onClick={notice.phase==='restore-error'?onRestore:onRemove} className="mt-1 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg pr-3 text-[13px] font-semibold text-rose-700 hover:text-navy"><RefreshCw className="size-4" aria-hidden />{isID?'Coba lagi':'Try again'}</button>}
    </div>
    <button ref={dismissRef} type="button" disabled={busy} onClick={onDismiss} aria-label={isID?'Tutup pemberitahuan wishlist':'Dismiss wishlist notice'} className="-mr-1 -mt-1 flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl text-slate-400 hover:bg-slate-50 hover:text-navy disabled:cursor-wait disabled:opacity-40"><X className="size-4" aria-hidden /></button>
  </div>;
}
