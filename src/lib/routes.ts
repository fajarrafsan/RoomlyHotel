import { DashboardView } from '../types';

/**
 * One URL per dashboard menu. Child components still navigate by DashboardView id
 * (e.g. onNavigateTo('explore')), so this map is the single place that translates
 * a menu id into the route it lives at.
 */
export const VIEW_PATHS: Record<DashboardView, string> = {
  overview: '/',
  explore: '/explore',
  'my-bookings': '/bookings',
  wishlist: '/wishlist',
  analytics: '/analytics',
  settings: '/settings',
  admin: '/admin',
};

export function viewToPath(view: DashboardView): string {
  return VIEW_PATHS[view] ?? '/';
}

/**
 * Admin-console routes. These are deliberately kept out of VIEW_PATHS: they are
 * not customer dashboard views, they map 1:1 onto Roomly's /api/admin/** surface
 * (booking-service, payment-service, invoice-service, review-service, hotel-service).
 */
export const ADMIN_PATHS = {
  dashboard: '/admin',
  checkIn: '/staff/check-in',
  invoices: '/admin/invoices',
  payments: '/admin/payments',
  reviews: '/admin/reviews',
  hotels: '/admin/hotels',
  masterData: '/admin/master-data',
  notifications: '/admin/notifications',
} as const;

/**
 * Routes that only make sense for a signed-in customer (browsing, wishlist,
 * personal bookings). An ADMIN session is redirected off these onto the console.
 */
export const CUSTOMER_ONLY_PATHS = [
  VIEW_PATHS.overview,
  VIEW_PATHS.explore,
  VIEW_PATHS['my-bookings'],
  VIEW_PATHS.wishlist,
  VIEW_PATHS.analytics,
];
