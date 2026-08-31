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
  housekeeping: '/staff/housekeeping',
  invoices: '/admin/invoices',
  payments: '/admin/payments',
  reviews: '/admin/reviews',
  hotels: '/admin/hotels',
  masterData: '/admin/master-data',
  notifications: '/admin/notifications',
} as const;

export const OPERATIONS_ROLES = ['ADMIN', 'RECEPTIONIST', 'HOUSEKEEPING', 'MAINTENANCE'] as const;

export function isOperationsRole(role?: string): boolean {
  return !!role && OPERATIONS_ROLES.includes(role as (typeof OPERATIONS_ROLES)[number]);
}

/** Send every signed-in role to the first screen it can actually operate. */
export function roleLandingPath(role?: string): string {
  switch (role) {
    case 'ADMIN':
      return ADMIN_PATHS.dashboard;
    case 'RECEPTIONIST':
      return ADMIN_PATHS.checkIn;
    case 'HOUSEKEEPING':
    case 'MAINTENANCE':
      return ADMIN_PATHS.housekeeping;
    default:
      return VIEW_PATHS.overview;
  }
}

/**
 * Routes that only make sense for a signed-in customer (browsing, wishlist,
 * personal bookings). Operational staff are redirected to their role workspace.
 */
export const CUSTOMER_ONLY_PATHS = [
  VIEW_PATHS.overview,
  VIEW_PATHS.explore,
  VIEW_PATHS['my-bookings'],
  VIEW_PATHS.wishlist,
  VIEW_PATHS.analytics,
];

export function isCustomerOnlyPath(pathname: string): boolean {
  return CUSTOMER_ONLY_PATHS.includes(pathname)
    || pathname.startsWith('/hotel/')
    || pathname.startsWith('/booking/');
}
