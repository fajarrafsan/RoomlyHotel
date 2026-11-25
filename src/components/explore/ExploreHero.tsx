import React, { useEffect, useId, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowRight, MapPin, Search, X } from 'lucide-react';
import { CityDestinationOption, CityDestinationPicker } from '../home/CityDestinationPicker';
import { applyImageFallback } from '../../lib/imageFallback';
import { easeSmooth } from '../../lib/motion';

export interface ExploreHeroSpotlight {
  city: string;
  province?: string;
  count: number;
  image: string;
  hotelName: string;
}

interface ExploreHeroProps {
  isID: boolean;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  selectedCity: string;
  onSelectCity: (city: string) => void;
  cities: CityDestinationOption[];
  quickCities: string[];
  stats: { value: string; label: string }[];
  spotlight: ExploreHeroSpotlight | null;
}

const COLLECTION_PHOTO = '/images/seed/hotels/oberoi-lombok.jpg';

/** Swaps the hero only once the next photo is decoded, so the fade never reveals a blank band. */
function useReadyPhoto(target: string) {
  const [ready, setReady] = useState(target);
  useEffect(() => {
    if (target === ready) return;
    let active = true;
    const image = new Image();
    image.onload = () => { if (active) setReady(target); };
    image.src = target;
    return () => { active = false; };
  }, [target, ready]);
  return ready;
}

export const ExploreHero: React.FC<ExploreHeroProps> = ({ isID, searchQuery, onSearchQueryChange, selectedCity, onSelectCity, cities, quickCities, stats, spotlight }) => {
  const reduceMotion = useReducedMotion();
  const searchId = useId();
  const cityId = useId();
  const [cityOpen, setCityOpen] = useState(false);
  const photo = useReadyPhoto(spotlight?.image ?? COLLECTION_PHOTO);
  const activeCity = selectedCity.trim().toLocaleLowerCase();
  const caption = spotlight ? `${spotlight.hotelName}, ${spotlight.city}` : (isID ? 'Inspirasi: Lombok, Nusa Tenggara Barat' : 'Inspiration: Lombok, West Nusa Tenggara');
  const spotlightSummary = spotlight && (isID
    ? `${spotlight.count} penginapan pilihan di ${spotlight.province || 'Indonesia'}.`
    : `${spotlight.count} curated ${spotlight.count === 1 ? 'stay' : 'stays'} in ${spotlight.province || 'Indonesia'}.`);

  return (
    <section aria-labelledby="explore-heading" data-explore-hero>
      <div className="relative isolate overflow-hidden rounded-b-[28px] bg-[#0f2340] sm:rounded-b-[36px]" data-explore-hero-band>
        <AnimatePresence initial={false}>
          <motion.img
            key={photo}
            src={photo}
            alt=""
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.5, ease: easeSmooth }}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            onError={applyImageFallback}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: photo === COLLECTION_PHOTO ? 'center 54%' : 'center 45%' }}
          />
        </AnimatePresence>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#08182e]/90 via-[#08182e]/55 to-[#08182e]/10" aria-hidden />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#08182e]/60 via-transparent to-[#08182e]/10" aria-hidden />

        <div className="relative mx-auto flex max-w-[1480px] items-end justify-between gap-10 px-5 pb-[84px] pt-7 sm:px-8 sm:pb-[88px] sm:pt-9 lg:px-12 lg:pb-[92px] lg:pt-10 lg:short:pb-[84px] lg:short:pt-6">
          <div className="min-w-0 max-w-[680px] flex-1">
            <motion.div key={spotlight?.city ?? 'collection'} initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.3, ease: easeSmooth }}>
              <p className="mb-3 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.19em] text-gold-light">
                <span className="h-px w-7 bg-gold-light/60" aria-hidden />
                {spotlight ? (isID ? 'Destinasi pilihanmu' : 'Your destination') : (isID ? 'Jelajahi Roomly' : 'Explore Roomly')}
              </p>
              <h1 id="explore-heading" className="font-serif text-[33px] leading-[1.13] tracking-[-0.035em] text-white sm:text-[40px] lg:text-[46px]" style={{ textShadow: '0 2px 24px rgba(0,0,0,0.18)' }}>
                {spotlight
                  ? <>{isID ? 'Menginap di' : 'Stay in'}<br /><span className="italic text-gold-light">{spotlight.city}</span></>
                  : isID
                    ? <>Temukan suasana<br /><span className="italic text-gold-light">untuk perjalananmu.</span></>
                    : <>Find your place.<br /><span className="italic text-gold-light">Make a new memory.</span></>}
              </h1>
              <p className="mt-3 max-w-[480px] text-sm leading-6 text-white/85 max-sm:hidden sm:text-[15px] lg:short:hidden">
                {spotlightSummary ?? (isID ? 'Hotel, vila, dan apartemen untuk jeda singkat hingga cerita panjang.' : 'Hotels, villas, and apartments for little escapes and longer stories.')}
              </p>
            </motion.div>

            {quickCities.length > 0 && (
              <div className="explore-no-scrollbar -mx-5 mt-4 flex items-center gap-2 overflow-x-auto px-5 sm:-mx-8 sm:px-8 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0" role="group" aria-label={isID ? 'Pilihan destinasi' : 'Destination shortcuts'} data-explore-quick-cities>
                <span className="hidden shrink-0 pr-1 text-[13px] text-white/75 sm:block">{isID ? 'Destinasi' : 'Destinations'}</span>
                {quickCities.map(city => {
                  const active = city.toLocaleLowerCase() === activeCity;
                  return (
                    <button key={city} type="button" aria-pressed={active} onClick={() => onSelectCity(active ? '' : city)} className={`inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium backdrop-blur-sm transition-colors duration-200 ${active ? 'border-gold-light bg-gold-light text-navy-dark' : 'border-white/30 bg-white/10 text-white hover:border-gold-light/70 hover:bg-white/20'}`}>
                      {city}{active && <X className="size-3.5" aria-hidden />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="hidden shrink-0 lg:block" data-explore-hero-stats>
            <dl className="flex divide-x divide-white/15 rounded-2xl border border-white/20 bg-[#0b2039]/50 py-4 backdrop-blur-md">
              {stats.map(stat => (
                <div key={stat.label} className="flex flex-col-reverse gap-1.5 px-6">
                  <dt className="text-xs text-white/80">{stat.label}</dt>
                  <dd className="whitespace-nowrap font-serif text-[27px] leading-none text-white">{stat.value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 flex items-center justify-end gap-1.5 text-xs text-white/85" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.45)' }}>
              <MapPin className="size-3.5 shrink-0 text-gold-light" aria-hidden />{caption}
            </p>
          </div>
        </div>
      </div>

      <form
        className="relative z-10 mx-4 -mt-[60px] rounded-[22px] border border-[#e7e5df] bg-white p-3 shadow-[0_16px_48px_rgba(12,31,59,0.12)] sm:mx-8 sm:-mt-[58px] sm:rounded-[26px] sm:p-4 lg:mx-auto lg:-mt-[64px] lg:w-[calc(100%_-_6rem)] lg:max-w-[1384px] lg:px-7 lg:py-[18px]"
        onSubmit={event => {
          event.preventDefault();
          setCityOpen(false);
          document.getElementById('explore-results-heading')?.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' });
        }}
        aria-label={isID ? 'Cari penginapan' : 'Search stays'}
      >
        <div className="grid items-end gap-1.5 md:grid-cols-[1.15fr_1fr_auto] md:gap-5">
          <div className="min-w-0 md:border-r md:border-slate-100 md:pr-5">
            <label htmlFor={searchId} className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 max-md:sr-only">{isID ? 'Cari hotel atau destinasi' : 'Search hotel or destination'}</label>
            <div className="relative rounded-xl border border-transparent transition-colors duration-200 focus-within:border-gold/40 focus-within:bg-[#fffaf1] focus-within:ring-2 focus-within:ring-gold/10">
              <Search className="pointer-events-none absolute left-2 top-1/2 size-[18px] -translate-y-1/2 text-gold" aria-hidden />
              <input id={searchId} type="search" value={searchQuery} onChange={event => onSearchQueryChange(event.target.value)} placeholder={isID ? 'Nama hotel, kota, atau provinsi' : 'Hotel name, city, or province'} maxLength={150} style={{ outline: 'none' }} className="min-h-12 w-full min-w-0 rounded-xl bg-transparent py-2.5 pl-9 pr-10 text-base font-semibold text-navy-dark placeholder:font-normal placeholder:text-slate-500" />
              {searchQuery && <button type="button" onClick={() => onSearchQueryChange('')} aria-label={isID ? 'Hapus pencarian' : 'Clear search'} className="absolute right-0 top-1/2 flex size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-slate-500 hover:text-navy-dark"><X className="size-4" aria-hidden /></button>}
            </div>
          </div>
          <div className="min-w-0 border-t border-slate-100 pt-1.5 md:border-r md:border-t-0 md:pr-5 md:pt-0">
            <label id={`${cityId}-label`} htmlFor={cityId} className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 max-md:sr-only">{isID ? 'Kota atau provinsi' : 'City or province'}</label>
            <CityDestinationPicker id={cityId} isID={isID} value={selectedCity} onChange={onSelectCity} cities={cities} open={cityOpen} onOpenChange={setCityOpen} />
          </div>
          <button type="submit" className="group mt-1.5 flex min-h-12 cursor-pointer items-center justify-center gap-3 rounded-xl bg-gold px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(161,98,7,0.15)] transition-colors duration-200 hover:bg-gold-dark md:mt-0 md:min-h-14 md:max-lg:px-4 lg:px-7">
            <Search className="hidden size-5 md:max-lg:block" aria-hidden />
            <span className="md:max-lg:sr-only">{isID ? 'Temukan penginapan' : 'Find your stay'}</span>
            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transform-none md:max-lg:hidden" aria-hidden />
          </button>
        </div>
      </form>
    </section>
  );
};
