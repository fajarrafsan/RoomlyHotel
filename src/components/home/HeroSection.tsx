import React, { useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowRight, ArrowUpRight, MapPin, Search } from 'lucide-react';
import { Language, DashboardView, Hotel } from '../../types';
import { easeOutSoft } from './animations';
import { applyImageFallback } from '../../lib/imageFallback';
import { VIEW_PATHS } from '../../lib/routes';
import { CityDestinationOption, CityDestinationPicker } from './CityDestinationPicker';
import { PropertyFilter, PropertyTypePicker } from './PropertyTypePicker';

interface HeroSectionProps {
  language: Language;
  hotels: Hotel[];
  quickCities: string[];
  searchCity: string;
  onSearchCityChange: (city: string) => void;
  onNavigateTo: (view: DashboardView) => void;
}

const scenes = [
  { place: 'Mandalika, Lombok', name: 'Mandalika Sagara Villas', image: '/images/seed/hotels/mandalika-sagara.png', id: 'Vila privat di perbukitan Mandalika menghadap teluk dan laut biru', en: 'Private hillside villas in Mandalika overlooking a turquoise bay' },
  { place: 'Belitung', name: 'Samudra Belitung Resort', image: '/images/seed/hotels/samudra-belitung.png', id: 'Resor tropis di pantai Belitung dengan pasir putih dan bebatuan granit', en: 'A tropical Belitung resort with white sand and granite rocks' },
  { place: 'Bandung', name: 'Arunika Bandung', image: '/images/seed/hotels/arunika-bandung.png', id: 'Penginapan di Bandung dikelilingi pepohonan dan perbukitan hijau', en: 'A Bandung retreat surrounded by trees and green hills' },
];

export const HeroSection: React.FC<HeroSectionProps> = ({
  language, hotels, quickCities, searchCity, onSearchCityChange, onNavigateTo,
}) => {
  const isID = language === 'ID';
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const inputId = useId();
  const typeId = useId();
  const [propertyType, setPropertyType] = useState<PropertyFilter>('ALL');
  const [destination, setDestination] = useState(searchCity);
  const [activePicker, setActivePicker] = useState<'city' | 'type' | null>(null);
  const [sceneIndex, setSceneIndex] = useState(0);
  const scene = scenes[sceneIndex];
  const cityGroups = new Map<string, CityDestinationOption>();
  for (const hotel of hotels) {
    const city = hotel.city.trim();
    if (!city) continue;
    const key = city.toLowerCase();
    const existing = cityGroups.get(key);
    if (existing) existing.count += 1;
    else cityGroups.set(key, { city, province: hotel.province, count: 1 });
  }
  const cities = [...cityGroups.values()].sort((a, b) => a.city.localeCompare(b.city));

  const search = (city = destination) => {
    setActivePicker(null);
    onSearchCityChange(city.trim());
    if (propertyType === 'ALL') {
      onNavigateTo('explore');
    } else {
      navigate({ pathname: VIEW_PATHS.explore, search: new URLSearchParams({ propertyType }).toString() });
    }
  };

  return (
    <section className="cinematic-hero relative -mx-4 -mt-6 sm:-mx-6 lg:-mx-8" aria-labelledby="home-hero-heading" data-home-hero>
      <div className="relative isolate h-[520px] overflow-hidden rounded-b-[28px] bg-[#10243a] sm:h-[560px] sm:rounded-b-[36px] lg:h-[590px] xl:h-[610px]">
        <figure className="absolute inset-0 m-0" data-hero-photo>
          <AnimatePresence initial={false}>
            <motion.img
              key={scene.image}
              src={scene.image}
              alt={isID ? scene.id : scene.en}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.4 }}
              loading="eager"
              fetchPriority={sceneIndex === 0 ? 'high' : 'auto'}
              decoding="async"
              onError={applyImageFallback}
              className="absolute inset-0 h-full w-full object-cover object-[58%_45%] sm:object-[center_45%]"
            />
          </AnimatePresence>
          <div className="pointer-events-none absolute inset-0 bg-[#091a30]/30" aria-hidden />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#091a30]/30 via-transparent to-[#091a30]/75" aria-hidden />
          <figcaption className="absolute inset-x-5 bottom-[88px] flex items-end justify-between gap-4 text-white sm:inset-x-9 sm:bottom-[100px] lg:inset-x-14 lg:bottom-[108px]">
            <div className="min-w-0">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-white/90 sm:text-sm"><MapPin className="size-3.5 shrink-0 text-gold-light" aria-hidden />{scene.place}</p>
              <p className="hidden text-[11px] text-white/65 sm:block">{scene.name}</p>
            </div>
            <div className="flex shrink-0 gap-1" role="group" aria-label={isID ? 'Pilihan foto destinasi' : 'Destination photos'}>
              {scenes.map((item, index) => (
                <button
                  key={item.place}
                  type="button"
                  aria-label={`${isID ? 'Tampilkan' : 'Show'} ${item.place}`}
                  aria-pressed={sceneIndex === index}
                  onClick={() => setSceneIndex(index)}
                  className={`flex min-h-11 w-10 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg text-[11px] font-semibold transition-colors duration-200 sm:w-12 ${sceneIndex === index ? 'text-gold-light' : 'text-white/65 hover:bg-white/10 hover:text-white'}`}
                >
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <span className={`h-[2px] w-6 rounded-full ${sceneIndex === index ? 'bg-gold-light' : 'bg-white/25'}`} aria-hidden />
                </button>
              ))}
            </div>
          </figcaption>
        </figure>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: easeOutSoft }}
          className="relative mx-auto max-w-[1000px] px-5 pt-12 text-center text-white sm:px-8 sm:pt-14 lg:pt-16"
        >
          <p className="mb-5 flex items-center justify-center gap-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-light sm:mb-6 sm:text-[11px]">
            <span className="hidden h-px w-8 bg-gold-light/60 min-[360px]:block" aria-hidden />
            {isID ? 'Sebuah tempat. Seribu cerita.' : 'One place. A thousand stories.'}
            <span className="hidden h-px w-8 bg-gold-light/60 min-[360px]:block" aria-hidden />
          </p>
          <h1 id="home-hero-heading" className="font-serif text-[34px] leading-[1.09] tracking-[-0.04em] min-[360px]:text-[41px] sm:text-[59px] lg:text-[72px] xl:text-[80px]" style={{ textShadow: '0 2px 24px rgba(0,0,0,0.12)' }}>
            {isID
              ? <>Temukan tempat.<br /><span className="italic text-gold-light">Ciptakan kenangan.</span></>
              : <>Find your escape.<br /><span className="italic text-gold-light">Make it memorable.</span></>}
          </h1>
          <p className="mx-auto mt-5 max-w-[540px] text-[14px] leading-6 text-white/85 sm:mt-6 sm:text-[16px] sm:leading-7">
            {isID
              ? 'Dari pesisir yang tenang hingga ritme kota. Temukan penginapan yang terasa pas untuk perjalananmu.'
              : 'From quiet coastlines to the rhythm of the city. Discover a stay that feels just right for your journey.'}
          </p>
          {quickCities.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 sm:mt-6 sm:gap-2.5">
              <span className="mr-1 hidden text-xs text-white/65 sm:block">{isID ? 'Jelajahi' : 'Explore'}</span>
              {quickCities.slice(0, 3).map(city => (
                <button key={city} type="button" onClick={() => search(city)} className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border border-white/25 bg-white/5 px-3 py-2 text-[11px] font-medium text-white backdrop-blur-sm transition-colors duration-200 hover:border-gold-light/70 hover:bg-white/15 sm:px-4 sm:text-xs">
                  {city}<ArrowUpRight className="size-3" aria-hidden />
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <div className="relative z-10 mx-auto -mt-14 max-w-[1280px] px-4 sm:-mt-16 sm:px-8 lg:px-10">
        <form
          onSubmit={event => { event.preventDefault(); search(); }}
          className="rounded-[22px] border border-[#e7e5df] bg-white p-5 shadow-[0_16px_48px_rgba(12,31,59,0.12)] sm:rounded-[26px] sm:px-7 sm:py-5 lg:px-8"
          aria-label={isID ? 'Cari penginapan' : 'Find a stay'}
        >
          <div className="mb-4 flex items-center justify-between gap-4 border-b border-slate-100 pb-3.5">
            <p className="flex items-center gap-2.5 text-[13px] font-semibold text-navy-dark"><span className="h-4 w-[3px] rounded-full bg-gold-light" aria-hidden />{isID ? 'Perjalanan istimewamu dimulai di sini' : 'Your next escape begins here'}</p>
            <span className="hidden text-xs text-slate-500 lg:block">{isID ? 'Hotel, vila, dan apartemen pilihan' : 'Hotels, villas, and apartments'}</span>
          </div>
          <div className="grid items-center gap-4 md:grid-cols-[1.15fr_0.95fr_auto] md:gap-6">
            <div className="min-w-0 md:border-r md:border-slate-100 md:pr-6">
              <label id={`${inputId}-label`} htmlFor={inputId} className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-500">{isID ? 'Kota tujuan' : 'Your destination'}</label>
              <CityDestinationPicker
                id={inputId}
                isID={isID}
                value={destination}
                onChange={setDestination}
                cities={cities}
                open={activePicker === 'city'}
                onOpenChange={open => setActivePicker(current => open ? 'city' : current === 'city' ? null : current)}
              />
            </div>
            <div className="min-w-0 border-t border-slate-100 pt-3 md:border-r md:border-t-0 md:pr-6 md:pt-0">
              <label id={`${typeId}-label`} htmlFor={typeId} className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-500">{isID ? 'Jenis penginapan' : 'Property type'}</label>
              <PropertyTypePicker
                id={typeId}
                isID={isID}
                value={propertyType}
                onChange={setPropertyType}
                open={activePicker === 'type'}
                onOpenChange={open => setActivePicker(current => open ? 'type' : current === 'type' ? null : current)}
              />
            </div>
            <button type="submit" className="group flex min-h-14 cursor-pointer items-center justify-center gap-3 rounded-xl bg-gold px-6 py-4 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(161,98,7,0.15)] transition-colors duration-200 hover:bg-gold-dark active:bg-gold-dark lg:px-7">
              <Search className="size-[18px]" aria-hidden />{isID ? 'Cari penginapan' : 'Find a stay'}<ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transform-none" aria-hidden />
            </button>
          </div>
          <p className="mt-3 text-[11px] leading-5 text-slate-500">{isID ? 'Tanggal dan jumlah tamu dapat diatur saat memilih kamar.' : 'Choose your dates and guests when selecting a room.'}</p>
        </form>
      </div>
    </section>
  );
};
