import {
  LayoutDashboard, Compass, CalendarDays, Heart, BarChart3,
  UserCheck, FileText, CreditCard, Star, Building2, Database, Bell,
  type LucideIcon
} from 'lucide-react';
import { ADMIN_PATHS, VIEW_PATHS } from '../../lib/routes';

export interface HeaderNavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  badge: string | number | null;
  badgeColor?: string;
}

export interface NavItemsOptions {
  isID: boolean;
  activeBookingsCount: number;
  wishlistCount: number;
  /** Auth role from Roomly's JWT. ADMIN gets the console nav, everyone else the guest nav. */
  role?: string;
}

/**
 * The admin console nav. Every entry is backed by a real /api/admin/** endpoint
 * group in Roomly, so nothing here links to a screen without a backend behind it.
 */
function getAdminNavItems(isID: boolean): HeaderNavItem[] {
  return [
    { path: ADMIN_PATHS.dashboard, label: isID ? 'Dasbor' : 'Dashboard', icon: LayoutDashboard, badge: null },
    { path: ADMIN_PATHS.checkIn, label: 'Check-In', icon: UserCheck, badge: null },
    { path: ADMIN_PATHS.invoices, label: isID ? 'Invoice' : 'Invoices', icon: FileText, badge: null },
    { path: ADMIN_PATHS.payments, label: isID ? 'Pembayaran' : 'Payments', icon: CreditCard, badge: null },
    { path: ADMIN_PATHS.reviews, label: isID ? 'Ulasan' : 'Reviews', icon: Star, badge: null },
    { path: ADMIN_PATHS.hotels, label: isID ? 'Properti' : 'Properties', icon: Building2, badge: null },
    { path: ADMIN_PATHS.masterData, label: isID ? 'Master' : 'Master', icon: Database, badge: null },
    { path: ADMIN_PATHS.notifications, label: isID ? 'Notifikasi' : 'Notifications', icon: Bell, badge: null },
  ];
}

function getGuestNavItems(
  isID: boolean,
  activeBookingsCount: number,
  wishlistCount: number
): HeaderNavItem[] {
  return [
    { path: VIEW_PATHS.overview, label: isID ? 'Beranda' : 'Home', icon: LayoutDashboard, badge: null },
    { path: VIEW_PATHS.explore, label: isID ? 'Jelajahi' : 'Explore', icon: Compass, badge: null },
    {
      path: VIEW_PATHS['my-bookings'],
      label: isID ? 'Pesanan' : 'Bookings',
      icon: CalendarDays,
      badge: activeBookingsCount > 0 ? activeBookingsCount : null,
      badgeColor: 'bg-amber-500 text-white'
    },
    {
      path: VIEW_PATHS.wishlist,
      label: isID ? 'Simpan' : 'Saved',
      icon: Heart,
      badge: wishlistCount > 0 ? wishlistCount : null,
      badgeColor: 'bg-rose-500 text-white'
    },
    {
      path: VIEW_PATHS.analytics,
      label: isID ? 'Statistik' : 'Analytics',
      icon: BarChart3,
      badge: null
    }
  ];
}

export function getNavItems({ isID, activeBookingsCount, wishlistCount, role }: NavItemsOptions): HeaderNavItem[] {
  return role === 'ADMIN'
    ? getAdminNavItems(isID)
    : getGuestNavItems(isID, activeBookingsCount, wishlistCount);
}
