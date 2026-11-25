export type DashboardView = 'overview' | 'explore' | 'my-bookings' | 'wishlist' | 'analytics' | 'settings' | 'admin';
export type Language = 'ID' | 'EN';

/** A facility assigned to a hotel, from hotel-service's facility catalog. */
export interface HotelFacility {
  id: string;
  name: string;
  icon?: string;
  /** GENERAL | INTERNET | FOOD | FITNESS | WELLNESS | RECREATION | BUSINESS |
   *  TRANSPORTATION | ACCESSIBILITY | FAMILY | SECURITY | DINING */
  category: string;
  description?: string;
}

/** One policy line of a room (room-service RoomPolicyResponse). */
export interface RoomPolicy {
  id: string;
  /** CHECK_IN | CHECK_OUT | BREAKFAST | EXTRA_BED | REFUND | SMOKING | PET | CHILD | GENERAL */
  policyType: string;
  title: string;
  description?: string;
  isRefundable?: boolean;
  freeCancelDays?: number;
  /** NONE | PERCENT | FULL | FIRST_NIGHT */
  feeType?: string;
  feeValue?: number;
}

export interface RoomPolicyGroup {
  policyType: string;
  items: RoomPolicy[];
}

export interface RoomType {
  id: string;
  name: string;
  size: string; // e.g., "35 m²"
  bedType: string; // e.g., "1 King Bed"
  maxOccupancy: number;
  pricePerNight: number;
  originalPrice?: number;
  discountPercentage?: number;
  image: string;
  features: string[];
  // Roomly only exposes real inventory via a per-day availability call; undefined
  // means "not checked yet" rather than "sold out", so callers must guard for it.
  availableRooms?: number;

  // --- extra detail straight from room-service, shown in the detail modal ---
  description?: string;
  viewType?: string;
  capacityAdult?: number;
  capacityChild?: number;
  /** Every image of this room, not just the primary one. */
  images?: string[];
  policies?: RoomPolicyGroup[];
  totalInventory?: number;
  /** AVAILABLE | LIMITED | SOLD_OUT | MAINTENANCE | CLOSED */
  availabilityStatus?: string;
}

export interface Review {
  id: string;
  userName: string;
  userAvatar: string;
  rating: number;
  date: string;
  comment: string;
  title?: string;
  isVerifiedStay?: boolean;
  helpfulCount?: number;
}

/** Real per-star counts from review-service's rating-summary endpoint. */
export interface RatingBreakdown {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

export interface Hotel {
  id: string;
  name: string;
  tagline: string;
  location: string;
  city: string;
  address: string;
  coordinates: { lat: number; lng: number };
  rating: number;
  reviewsCount: number;
  pricePerNight: number;
  originalPrice?: number;
  stars: number; // 3, 4, or 5
  category: 'Hotel' | 'Villa' | 'Apartment' | 'Resort' | 'Boutique' | 'Business' | 'Luxury';
  image: string;
  gallery: string[];
  /** Flat facility names — kept for compact card views. */
  amenities: string[];
  description: string;
  rooms: RoomType[];
  reviews: Review[];
  featured?: boolean;
  discountPercentage?: number;

  // --- extra detail straight from hotel-service, shown in the detail modal ---
  phone?: string;
  email?: string;
  website?: string;
  /** "15:00:00" — the property's own check-in / check-out times. */
  checkInTime?: string;
  checkOutTime?: string;
  country?: string;
  province?: string;
  district?: string;
  postalCode?: string;
  /** Full facility objects (name + category + icon + description). */
  facilities?: HotelFacility[];
  /** Real per-star review counts; undefined until the detail view loads them. */
  ratingBreakdown?: RatingBreakdown;
}

export interface Booking {
  id: string;
  bookingCode: string;
  hotelId: string;
  roomId?: string;
  hotelName: string;
  hotelImage: string;
  hotelLocation: string;
  hotelAddress: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  checkInTime?: string | null;
  checkOutTime?: string | null;
  nights: number;
  guests: { adults: number; children: number };
  roomType: string;
  roomSize: string;
  bedType: string;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'checked-in' | 'completed' | 'cancelled';
  /** Preserve the server status for accurate guest-facing labels and actions. */
  sourceStatus?: import('./api/booking').BookingStatus;
  holdExpiresAt?: string | null;
  paymentStatus: 'unpaid' | 'pending' | 'paid' | 'failed' | 'expired' | 'cancelled' | 'refunded';
  paymentMethod: string;
  bookedAt: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  specialRequests?: string;
  hasBreakfast: boolean;
  hasAirportShuttle: boolean;
}

export interface FilterState {
  searchCity: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  minPrice: number;
  maxPrice: number;
  stars: number[];
  category: string[];
  amenities: string[];
  minRating: number;
  sortBy: 'recommended' | 'price-asc' | 'price-desc' | 'rating';
}

export interface AuthUser {
  userId: number;
  fullName: string;
  email: string;
  role: string;
  hotelId: number | null;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  type: 'booking' | 'promo' | 'system';
  notificationType: string;
  referenceType: string | null;
}
