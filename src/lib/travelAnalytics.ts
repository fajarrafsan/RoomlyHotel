import type { Booking, Hotel } from '../types';

export type AnalyticsPeriod = 'all' | 'last12' | `year:${number}`;

export interface AnalyticsTrendPoint {
  key: string;
  paidValue: number;
  paidCount: number;
  bookingCount: number;
  completedNights: number;
}

export interface AnalyticsStatus {
  key: 'pending' | 'confirmed' | 'checked-in' | 'completed' | 'cancelled' | 'expired' | 'no-show';
  count: number;
}

export interface AnalyticsDestination {
  key: string;
  name: string;
  count: number;
  nights: number;
  image: string;
  hotelCount: number;
}

export interface TravelAnalytics {
  bookings: Booking[];
  bookingCount: number;
  paidValue: number;
  paidCount: number;
  completedCount: number;
  completedNights: number;
  visitedHotelCount: number;
  averagePaidNightlyValue: number | null;
  trend: AnalyticsTrendPoint[];
  trendUnit: 'month' | 'year';
  statuses: AnalyticsStatus[];
  destinations: AnalyticsDestination[];
  undatedCount: number;
}

interface CalendarDate {
  key: string;
  year: number;
  month: number;
  monthIndex: number;
}

const statusOrder: AnalyticsStatus['key'][] = [
  'pending', 'confirmed', 'checked-in', 'completed', 'cancelled', 'expired', 'no-show',
];

/** A stay date is a calendar value, never a UTC instant. Reject overflow dates. */
function calendarDate(value: string): CalendarDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1 || month < 1 || month > 12 || day < 1) return null;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (day > days[month - 1]) return null;
  return { key: value, year, month, monthIndex: year * 12 + month - 1 };
}

function localToday(now: Date): CalendarDate {
  const safeNow = Number.isFinite(now.getTime()) ? now : new Date();
  const key = `${String(safeNow.getFullYear()).padStart(4, '0')}-${String(safeNow.getMonth() + 1).padStart(2, '0')}-${String(safeNow.getDate()).padStart(2, '0')}`;
  // The application only supplies contemporary local dates.
  return calendarDate(key)!;
}

function monthKey(index: number): string {
  return `${String(Math.floor(index / 12)).padStart(4, '0')}-${String(index % 12 + 1).padStart(2, '0')}`;
}

function validNights(booking: Booking): number {
  return Number.isInteger(booking.nights) && booking.nights >= 0 ? booking.nights : 0;
}

function validAmount(booking: Booking): number | null {
  return Number.isFinite(booking.totalPrice) && booking.totalPrice >= 0 ? booking.totalPrice : null;
}

/** Raw server status takes precedence over the storefront's broader grouping. */
function statusKey(booking: Booking): AnalyticsStatus['key'] {
  switch (booking.sourceStatus) {
    case 'PENDING':
    case 'WAITING_PAYMENT': return 'pending';
    case 'CONFIRMED': return 'confirmed';
    case 'CHECKED_IN': return 'checked-in';
    case 'CHECKED_OUT': return 'completed';
    case 'EXPIRED': return 'expired';
    case 'NO_SHOW': return 'no-show';
    case 'CANCELLED': return booking.paymentStatus === 'expired' ? 'expired' : 'cancelled';
  }
  if (booking.status === 'cancelled' && booking.paymentStatus === 'expired') return 'expired';
  return statusOrder.includes(booking.status) ? booking.status : 'pending';
}

export function getAnalyticsYears(bookings: Booking[], now: Date = new Date()): number[] {
  const years = new Set<number>([localToday(now).year]);
  for (const booking of bookings) {
    const date = calendarDate(booking.checkIn);
    if (date) years.add(date.year);
  }
  return [...years].sort((a, b) => b - a);
}

/**
 * Reservation analytics, rather than a cash ledger. PAID totals are the booking
 * face values; cancellation fees and partial refunds cannot be inferred here.
 * Every period is selected by check-in date, not payment or creation date.
 */
export function buildTravelAnalytics(
  bookings: Booking[], hotels: Hotel[], period: AnalyticsPeriod, now: Date = new Date(),
): TravelAnalytics {
  const today = localToday(now);
  const yearMatch = /^year:(\d{1,4})$/.exec(period);
  const selectedYear = yearMatch ? Number(yearMatch[1]) : null;
  const year = selectedYear && selectedYear <= 9999 ? selectedYear : null;
  const dated = bookings.map(booking => ({ booking, date: calendarDate(booking.checkIn) }));
  const undatedCount = dated.filter(item => !item.date).length;
  const last12Start = today.monthIndex - 11;
  const selected = dated.filter(({ date }) => {
    if (year !== null) return date?.year === year;
    if (period === 'last12') return !!date && date.monthIndex >= last12Start && date.key <= today.key;
    return true;
  });

  const statusCounts = new Map(statusOrder.map(key => [key, 0]));
  const visitedHotels = new Set<string>();
  const hotelLookup = new Map(hotels.map(hotel => [hotel.id, hotel]));
  const destinationMap = new Map<string, AnalyticsDestination & { hotels: Set<string> }>();
  let paidValue = 0;
  let paidCount = 0;
  let completedCount = 0;
  let completedNights = 0;
  let averageValue = 0;
  let averageNights = 0;

  let firstMonth: number | null = null;
  let lastMonth: number | null = null;
  for (const { date } of selected) {
    if (!date) continue;
    firstMonth = firstMonth === null ? date.monthIndex : Math.min(firstMonth, date.monthIndex);
    lastMonth = lastMonth === null ? date.monthIndex : Math.max(lastMonth, date.monthIndex);
  }
  const trendUnit: TravelAnalytics['trendUnit'] = year === null && period !== 'last12' && firstMonth !== null && lastMonth !== null && lastMonth - firstMonth >= 24 ? 'year' : 'month';
  const trendMap = new Map<string, AnalyticsTrendPoint>();
  const addBucket = (key: string) => {
    if (!trendMap.has(key)) trendMap.set(key, { key, paidValue: 0, paidCount: 0, bookingCount: 0, completedNights: 0 });
  };

  if (year !== null) {
    for (let month = 0; month < 12; month++) addBucket(monthKey(year * 12 + month));
  } else if (period === 'last12') {
    for (let index = last12Start; index <= today.monthIndex; index++) addBucket(monthKey(index));
  } else if (trendUnit === 'month' && firstMonth !== null && lastMonth !== null) {
    for (let index = firstMonth; index <= lastMonth; index++) addBucket(monthKey(index));
  }

  for (const { booking, date } of selected) {
    const status = statusKey(booking);
    const nights = validNights(booking);
    const amount = validAmount(booking);
    const paid = booking.paymentStatus === 'paid';
    statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
    if (paid) {
      paidCount++;
      if (amount !== null) {
        paidValue += amount;
        // Use comparable entries for the per-night average; a missing night
        // count must not inflate it by contributing only to the numerator.
        if (nights > 0) { averageValue += amount; averageNights += nights; }
      }
    }

    if (status === 'completed') {
      completedCount++;
      completedNights += nights;
      if (booking.hotelId) visitedHotels.add(booking.hotelId);
      const hotel = hotelLookup.get(booking.hotelId);
      const city = hotel?.city.trim();
      const location = booking.hotelLocation.trim();
      const key = city ? `city:${city.toLocaleLowerCase()}`
        : location ? `location:${location.toLocaleLowerCase()}` : `hotel:${booking.hotelId || booking.id}`;
      const name = city || location || hotel?.name || booking.hotelName || `Hotel #${booking.hotelId}`;
      let destination = destinationMap.get(key);
      if (!destination) {
        destination = { key, name, count: 0, nights: 0, image: hotel?.image || booking.hotelImage || '', hotelCount: 0, hotels: new Set() };
        destinationMap.set(key, destination);
      }
      destination.count++;
      destination.nights += nights;
      if (booking.hotelId) destination.hotels.add(booking.hotelId);
    }

    if (date) {
      const key = trendUnit === 'year' ? String(date.year).padStart(4, '0') : date.key.slice(0, 7);
      addBucket(key);
      const point = trendMap.get(key)!;
      point.bookingCount++;
      if (paid) {
        point.paidCount++;
        if (amount !== null) point.paidValue += amount;
      }
      if (status === 'completed') point.completedNights += nights;
    }
  }

  return {
    bookings: selected.map(item => item.booking),
    bookingCount: selected.length,
    paidValue,
    paidCount,
    completedCount,
    completedNights,
    visitedHotelCount: visitedHotels.size,
    averagePaidNightlyValue: averageNights > 0 ? averageValue / averageNights : null,
    trend: [...trendMap.values()].sort((a, b) => a.key.localeCompare(b.key)),
    trendUnit,
    statuses: statusOrder.map(key => ({ key, count: statusCounts.get(key) || 0 })),
    destinations: [...destinationMap.values()].map(({ hotels: destinationHotels, ...destination }) => ({ ...destination, hotelCount: destinationHotels.size }))
      .sort((a, b) => b.count - a.count || b.nights - a.nights || a.name.localeCompare(b.name)),
    undatedCount,
  };
}
