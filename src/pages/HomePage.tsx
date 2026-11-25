import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { BedDouble, Building2, Compass, MapPin } from 'lucide-react';
import { Booking, Hotel, Language, DashboardView } from '../types';
import { HeroSection } from '../components/home/HeroSection';
import { ActiveBookingBanner } from '../components/home/ActiveBookingBanner';
import { PopularDestinations } from '../components/home/PopularDestinations';
import { RecommendedHotels } from '../components/hotels/RecommendedHotels';
import { WhyChooseUsSection } from '../components/home/WhyChooseUsSection';
import { StayInspirationBanner } from '../components/home/StayInspirationBanner';
import { easeOutSoft } from '../components/home/animations';

interface HomePageProps {
  bookings: Booking[];
  hotels: Hotel[];
  wishlistCount: number;
  onOpenInvoice: (booking: Booking) => void;
  onSelectHotel: (hotel: Hotel) => void;
  onNavigateTo: (view: DashboardView) => void;
  language: Language;
  searchCity: string;
  onSearchCityChange: (city: string) => void;
  wishlistIds?: string[];
  onToggleWishlist?: (hotelId: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  bookings,
  hotels,
  onOpenInvoice,
  onSelectHotel,
  onNavigateTo,
  language,
  searchCity,
  onSearchCityChange,
  wishlistIds = [],
  onToggleWishlist = () => {},
}) => {
  const isID = language === 'ID';
  const reduceMotion = useReducedMotion();

  const upcomingBooking = bookings.find((b) => b.status === 'confirmed');
  const recommendedHotels = [...hotels]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 8);

  const destinationThemes: Record<string, { id: string; en: string; image?: string }> = {
    badung: { id: 'Pantai & matahari Bali', en: 'Bali sunshine & coastal escapes' },
    'jakarta pusat': { id: 'Jeda nyaman di tengah kota', en: 'A quiet pause in the city', image: '/images/destinations/jakarta.jpg' },
    bandung: { id: 'Udara sejuk, suasana baru', en: 'Cool air, a fresh perspective' },
    yogyakarta: { id: 'Budaya hangat, cerita baru', en: 'Warm culture, new stories' },
    'lombok tengah': { id: 'Pasir putih & laut biru', en: 'White sands & blue seas' },
    belitung: { id: 'Liburan tenang di tepi laut', en: 'Slow days by the sea' },
  };
  const destinationOrder = Object.keys(destinationThemes);
  const destinationsByCity = new Map<string, { city: string; title: string; image: string; count: number }>();

  // Use real catalog cities so every destination opens a matching Explore result.
  for (const hotel of hotels) {
    const city = hotel.city.trim();
    if (!city) continue;
    const key = city.toLowerCase();
    const destination = destinationsByCity.get(key);
    if (destination) {
      destination.count += 1;
      continue;
    }
    const theme = destinationThemes[key];
    destinationsByCity.set(key, {
      city,
      title: theme ? (isID ? theme.id : theme.en) : (hotel.province || (isID ? 'Temukan tempat favorit baru' : 'Find your next favourite stay')),
      image: theme?.image || hotel.image,
      count: 1,
    });
  }

  const popularDestinations = [...destinationsByCity.entries()]
    .sort(([a], [b]) => {
      const aRank = destinationOrder.indexOf(a);
      const bRank = destinationOrder.indexOf(b);
      return (aRank < 0 ? destinationOrder.length : aRank) - (bRank < 0 ? destinationOrder.length : bRank)
        || a.localeCompare(b);
    })
    .slice(0, 6)
    .map(([, destination]) => destination);

  const formatCatalogCount = (count: number) => hotels.length && count
    ? count.toLocaleString(isID ? 'id-ID' : 'en-US')
    : '—';
  const provinceCount = new Set(hotels.map((hotel) => hotel.province?.trim().toLowerCase()).filter(Boolean)).size;
  const roomTypeCount = hotels.reduce((total, hotel) => total + hotel.rooms.length, 0);
  const stats = [
    { value: formatCatalogCount(hotels.length), label: isID ? 'Penginapan pilihan' : 'Places to stay', icon: Building2 },
    { value: formatCatalogCount(destinationsByCity.size), label: isID ? 'Kota tujuan' : 'Destination cities', icon: MapPin },
    { value: formatCatalogCount(roomTypeCount), label: isID ? 'Tipe kamar' : 'Room types', icon: BedDouble },
    { value: formatCatalogCount(provinceCount), label: isID ? 'Provinsi Indonesia' : 'Indonesian provinces', icon: Compass },
  ];

  return (
    <div className="home-luxury pb-24 text-slate-800">
      <HeroSection
        language={language}
        hotels={hotels}
        quickCities={popularDestinations.map((destination) => destination.city).slice(0, 4)}
        searchCity={searchCity}
        onSearchCityChange={onSearchCityChange}
        onNavigateTo={onNavigateTo}
      />

      <div className="mx-auto mt-8 max-w-[1360px] px-4 sm:mt-10 sm:px-8 lg:px-12">
        <motion.dl
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: easeOutSoft }}
          className="grid grid-cols-2 overflow-hidden rounded-[24px] border border-[#e8e1d5] bg-[#fffdf9] md:grid-cols-4"
          aria-label={isID ? 'Pilihan dalam katalog Roomly' : 'The Roomly catalog'}
          data-home-catalog-summary
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
            <div
              key={stat.label}
              className={`flex min-w-0 flex-col items-center justify-center border-[#e8e1d5] px-3 py-5 text-center sm:px-5 sm:py-6 ${index < 2 ? 'border-b md:border-b-0' : ''} ${index % 2 === 0 ? 'border-r' : ''} ${index === 1 ? 'md:border-r' : ''}`}
            >
              <dt className="order-2 mt-1 text-[13px] leading-5 text-slate-600 sm:text-sm">{stat.label}</dt>
              <dd className="order-1 inline-flex items-center justify-center gap-3 font-serif text-[32px] leading-tight tracking-tight text-navy-dark sm:text-[36px]">
                <Icon className="hidden size-5 shrink-0 text-gold min-[400px]:block" strokeWidth={1.5} aria-hidden />
                {stat.value}
              </dd>
            </div>
            );
          })}
        </motion.dl>
      </div>

      <div className="max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 2xl:px-16 space-y-20 sm:space-y-24 mt-16 sm:mt-20">
        {upcomingBooking && (
          <ActiveBookingBanner
            booking={upcomingBooking}
            isID={isID}
            onOpenInvoice={onOpenInvoice}
          />
        )}

        <PopularDestinations
          destinations={popularDestinations}
          isID={isID}
          onNavigateTo={onNavigateTo}
          onSearchCityChange={onSearchCityChange}
        />

        <RecommendedHotels
          hotels={recommendedHotels}
          isID={isID}
          onNavigateTo={(view) => {
            onSearchCityChange('');
            onNavigateTo(view);
          }}
          onSelectHotel={onSelectHotel}
          onToggleWishlist={onToggleWishlist}
          wishlistedIds={wishlistIds}
          language={language}
        />

        <WhyChooseUsSection isID={isID} />

        <StayInspirationBanner isID={isID} onNavigateTo={onNavigateTo} />
      </div>
    </div>
  );
};
