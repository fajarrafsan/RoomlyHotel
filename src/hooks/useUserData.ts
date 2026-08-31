import { useCallback, useEffect, useState } from 'react';
import { bookingApi } from '../api/bookings';
import { notificationApi } from '../api/notifications';
import { wishlistApi } from '../api/wishlist';
import { mapBookingToUI, mapNotificationToUI } from '../lib/adapters';
import { AuthUser, Booking, Hotel, Notification } from '../types';

export function useUserData(
  user: AuthUser | null,
  hotelsRef: React.RefObject<Hotel[] | null>,
  onRequireAuth: (action: () => void) => void
) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);

  const refreshBookings = useCallback(async () => {
    if (!user) {
      setBookings([]);
      return;
    }

    try {
      const list = await bookingApi.myBookings();
      const lookup = new Map<string, Hotel>(hotelsRef.current?.map((hotel): [string, Hotel] => [hotel.id, hotel]) ?? []);
      setBookings(
        list.map((booking) => {
          const hotel = lookup.get(String(booking.hotelId));
          return mapBookingToUI(booking, {
            hotelImage: hotel?.image,
            hotelLocation: hotel?.location,
            hotelAddress: hotel?.address,
          });
        })
      );
    } catch (err) {
      // Keep the last known booking state on a transient service failure.
      console.error('Failed to load bookings', err);
    }
  }, [hotelsRef, user]);

  const refreshNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      return;
    }

    try {
      const page = await notificationApi.list(0, 50);
      setNotifications(page?.content ? page.content.map(mapNotificationToUI) : []);
    } catch (err) {
      // Keep the last successfully loaded list instead of pretending there are
      // no notifications while the service is temporarily unavailable.
      console.warn('Notifications endpoint unavailable', err);
    }
  }, [user]);

  // Load bookings + notifications + wishlist whenever auth state changes.
  useEffect(() => {
    if (!user) {
      setBookings([]);
      setNotifications([]);
      setWishlistIds([]);
      return;
    }
    wishlistApi
      .list()
      .then((items) => setWishlistIds(items.map((item) => String(item.hotelId))))
      .catch((err) => console.error('Failed to load wishlist', err));

  }, [user]);

  // Booking/payment state is updated asynchronously between services. Refresh
  // it on sign-in and periodically so My Bookings never requires a hard reload.
  useEffect(() => {
    if (!user) return;
    refreshBookings();
    const intervalId = window.setInterval(refreshBookings, 30_000);
    return () => window.clearInterval(intervalId);
  }, [user, refreshBookings]);

  // The backend exposes REST polling (no WebSocket/SSE). Refresh periodically
  // so async booking/payment/invoice notifications appear without re-login.
  useEffect(() => {
    if (!user) return;
    refreshNotifications();
    const intervalId = window.setInterval(refreshNotifications, 30_000);
    return () => window.clearInterval(intervalId);
  }, [user, refreshNotifications]);

  // Toggle Wishlist — requires auth (Roomly's /api/wishlists/** is authenticated-only).
  const handleToggleWishlist = (hotelId: string) => {
    onRequireAuth(() => {
      const wasWishlisted = wishlistIds.includes(hotelId);
      setWishlistIds((prev) =>
        wasWishlisted ? prev.filter((id) => id !== hotelId) : [...prev, hotelId]
      );
      const request = wasWishlisted ? wishlistApi.remove(Number(hotelId)) : wishlistApi.add(Number(hotelId));
      request.catch((err) => {
        console.error('Failed to update wishlist', err);
        setWishlistIds((prev) =>
          wasWishlisted ? [...prev, hotelId] : prev.filter((id) => id !== hotelId)
        );
      });
    });
  };

  // Mark all notifications read
  const handleMarkNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    if (user) {
      notificationApi.markAllRead().catch((err) => console.error('Failed to mark notifications read', err));
    }
  };

  // Mark a single notification read (e.g. when the user opens it) — reverts
  // the optimistic update locally if the backend call fails.
  const handleMarkNotificationRead = (notificationId: string) => {
    let wasUnread = false;
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.id !== notificationId) return n;
        wasUnread = n.unread;
        return { ...n, unread: false };
      })
    );
    if (!wasUnread) return;
    const numericId = Number(notificationId);
    if (!Number.isInteger(numericId) || numericId <= 0) return;
    notificationApi.markRead(numericId).catch((err) => {
      console.error('Failed to mark notification read', err);
      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, unread: true } : n)));
    });
  };

  // Cancel Booking
  const handleCancelBooking = async (bookingId: string, reason?: string) => {
    const cancellation = await bookingApi.cancel(Number(bookingId), reason);
    await refreshBookings();
    return cancellation;
  };

  const activeBookingsCount = bookings.filter((b) => b.status === 'confirmed' || b.status === 'checked-in').length;

  return {
    bookings,
    setBookings,
    refreshBookings,
    notifications,
    refreshNotifications,
    wishlistIds,
    handleToggleWishlist,
    handleMarkNotificationsRead,
    handleMarkNotificationRead,
    handleCancelBooking,
    activeBookingsCount,
  };
}
