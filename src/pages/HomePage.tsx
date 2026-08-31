import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Booking, Hotel, Language, DashboardView } from '../types';
import { HeroSection } from '../components/home/HeroSection';
import { ActiveBookingBanner } from '../components/home/ActiveBookingBanner';
import { PopularDestinations } from '../components/home/PopularDestinations';
import { RecommendedHotels } from '../components/hotels/RecommendedHotels';
import { WhyChooseUsSection } from '../components/home/WhyChooseUsSection';
import { NewsletterCTA } from '../components/home/NewsletterCTA';
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
  const wishlistedHotels = [...hotels]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 8);

  const countByCity = (label: string) =>
    hotels.filter((h) => h.city.toLowerCase().includes(label.toLowerCase())).length;

  const popularDestinations = [
    { city: 'Bali', title: 'Bali & Lombok', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=85', count: countByCity('Bali') },
    { city: 'Jakarta', title: 'Jakarta Capital', image: 'https://images.unsplash.com/photo-1555899434-94d1368aa7af?auto=format&fit=crop&w=800&q=85', count: countByCity('Jakarta') },
    { city: 'Bandung', title: 'Bandung Highlands', image: 'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?auto=format&fit=crop&w=800&q=85', count: countByCity('Bandung') },
    { city: 'Tokyo', title: 'Tokyo & Japan', image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=85', count: countByCity('Tokyo') },
    { city: 'Yogyakarta', title: 'Yogyakarta Heritage', image: 'https://images.unsplash.com/photo-1596402184320-417e7178b2cd?auto=format&fit=crop&w=800&q=85', count: countByCity('Yogyakarta') },
    { city: 'Singapore', title: 'Singapore City', image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=800&q=85', count: countByCity('Singapore') }
  ];

  const stats = [
    { value: '2.4k+', label: isID ? 'Properti kurasi' : 'Curated stays' },
    { value: '4.9', label: isID ? 'Rating tamu' : 'Guest rating' },
    { value: '24/7', label: isID ? 'Concierge' : 'Concierge' },
    { value: '30%', label: isID ? 'Hemat member' : 'Member savings' },
  ];

  return (
    <div className="home-luxury pb-24 text-slate-800">
      <HeroSection
        language={language}
        searchCity={searchCity}
        onSearchCityChange={onSearchCityChange}
        onNavigateTo={onNavigateTo}
      />

      <div className="relative z-10 -mt-8 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.12, ease: easeOutSoft }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl bg-white border border-[#E9EEF5] px-5 py-6 text-center shadow-[0_12px_40px_rgba(30,58,138,0.08)]"
            >
              <p className="font-serif text-2xl sm:text-3xl text-[#1E3A8A] tracking-tight">{stat.value}</p>
              <p className="mt-1.5 text-xs sm:text-[13px] text-slate-600 font-medium">{stat.label}</p>
            </div>
          ))}
        </motion.div>
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
          hotels={wishlistedHotels}
          isID={isID}
          onNavigateTo={onNavigateTo}
          onSelectHotel={onSelectHotel}
          onToggleWishlist={onToggleWishlist}
          wishlistedIds={wishlistIds}
          language={language}
        />

        <WhyChooseUsSection isID={isID} />

        <NewsletterCTA isID={isID} onNavigateTo={onNavigateTo} />
      </div>
    </div>
  );
};
