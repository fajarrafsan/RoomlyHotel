import React from 'react';
import { Booking, Hotel, Language, DashboardView } from '../types';
import { HeroSection } from '../components/home/HeroSection';
import { ActiveBookingBanner } from '../components/home/ActiveBookingBanner';
import { PopularDestinations } from '../components/home/PopularDestinations';
import { RecommendedHotels } from '../components/hotels/RecommendedHotels';
import { WhyChooseUsSection } from '../components/home/WhyChooseUsSection';
import { NewsletterCTA } from '../components/home/NewsletterCTA';

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
  /* opsional â€” untuk RecommendedHotels premium */
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

  const upcomingBooking = bookings.find((b) => b.status === 'confirmed');
  const wishlistedHotels = [...hotels]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 8);

  // Count hotels by substring match against the real city data, e.g. the
  // "Jakarta" card counts "Jakarta Pusat", "Jakarta Selatan", etc. — matches
  // the same substring logic useHotelFilters uses when the card is clicked,
  // so the number shown here is never inconsistent with what clicking it reveals.
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

  return (
    <div className="space-y-20 pb-20 text-slate-800">
      {/* ===== HERO SECTION ===== */}
      <HeroSection
        language={language}
        searchCity={searchCity}
        onSearchCityChange={onSearchCityChange}
        onNavigateTo={onNavigateTo}
      />

      {/* ===== MAIN CONTENT ===== */}
      <div className="max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 2xl:px-16 space-y-24">
        {/* Active Booking Banner */}
        {upcomingBooking && (
          <ActiveBookingBanner
            booking={upcomingBooking}
            isID={isID}
            onOpenInvoice={onOpenInvoice}
          />
        )}

        {/* Popular Destinations */}
        <PopularDestinations
          destinations={popularDestinations}
          isID={isID}
          onNavigateTo={onNavigateTo}
          onSearchCityChange={onSearchCityChange}
        />

        {/* Recommended Hotels */}
        <RecommendedHotels
          hotels={wishlistedHotels}
          isID={isID}
          onNavigateTo={onNavigateTo}
          onSelectHotel={onSelectHotel}
          onToggleWishlist={onToggleWishlist}
          wishlistedIds={wishlistIds}
          language={language}
        />

        {/* Why Choose Us */}
        <WhyChooseUsSection isID={isID} />

        {/* Newsletter / CTA Section */}
        <NewsletterCTA isID={isID} onNavigateTo={onNavigateTo} />
      </div>
    </div>
  );
};
