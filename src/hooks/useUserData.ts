import { useEffect, useState } from 'react';
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

    bookingApi
      .myBookings()
      .then((list) => {
        const lookup = new Map<string, Hotel>(hotelsRef.current?.map((h): [string, Hotel] => [h.id, h]) ?? []);
        setBookings(
          list.map((b) => {
            const h = lookup.get(String(b.hotelId));
            return mapBookingToUI(b, {
              hotelImage: h?.image,
              hotelLocation: h?.location,
              hotelAddress: h?.address,
            });
          })
        );
      })
      .catch((err) => console.error('Failed to load bookings', err));

    notificationApi
      .list(0, 30)
      .then((page) => setNotifications(page?.content ? page.content.map(mapNotificationToUI) : []))
      .catch((err) => {
        console.warn('Notifications endpoint unavailable', err);
        setNotifications([]);
      });
  }, [user]);

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
    notificationApi.markRead(Number(notificationId)).catch((err) => {
      console.error('Failed to mark notification read', err);
      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, unread: true } : n)));
    });
  };

  // Cancel Booking
  const handleCancelBooking = async (bookingId: string) => {
    const previous = bookings;
    setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' } : b)));
    try {
      await bookingApi.cancel(Number(bookingId));
    } catch (err) {
      console.error('Failed to cancel booking', err);
      setBookings(previous);
    }
  };

  const activeBookingsCount = bookings.filter((b) => b.status === 'confirmed' || b.status === 'checked-in').length;

  return {
    bookings,
    setBookings,
    notifications,
    setNotifications,
    wishlistIds,
    handleToggleWishlist,
    handleMarkNotificationsRead,
    handleMarkNotificationRead,
    handleCancelBooking,
    activeBookingsCount,
  };
}
