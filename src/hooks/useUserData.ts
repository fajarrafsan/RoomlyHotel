import { useCallback, useEffect, useRef, useState } from 'react';
import { bookingApi } from '../api/bookings';
import { notificationApi } from '../api/notifications';
import { wishlistApi } from '../api/wishlist';
import { ApiError } from '../lib/http';
import { mapBookingToUI, mapHotelToUI, mapNotificationToUI } from '../lib/adapters';
import { AuthUser, Booking, Hotel, Notification } from '../types';

interface WishlistState {
  owner: AuthUser | null;
  ids: string[];
  savedAt: Record<string, string>;
  hotels: Record<string, Hotel>;
  loaded: boolean;
  refreshing: boolean;
  error: boolean;
  mutationError: boolean;
  pendingIds: string[];
}

interface WishlistMutation {
  token: symbol;
  saved: boolean | null;
  savedAt?: string;
  before: boolean;
  beforeSavedAt?: string;
  hotel?: Hotel;
  beforeHotel?: Hotel;
  beforeKnown: boolean;
  committed: boolean;
}

const emptyWishlist = (owner: AuthUser | null): WishlistState => ({
  owner, ids: [], savedAt: {}, hotels: {}, loaded: false, refreshing: !!owner,
  error: false, mutationError: false, pendingIds: [],
});

const wishlistTimestamp = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() && Number.isFinite(Date.parse(value)) ? value : undefined;

export function useUserData(
  user: AuthUser | null,
  hotelsRef: React.RefObject<Hotel[] | null>,
  onRequireAuth: (action: () => void) => void,
) {
  const [bookings, setBookingsState] = useState<Booking[]>([]);
  const [bookingLoadState, setBookingLoadState] = useState({
    owner: user,
    loaded: false,
    refreshing: !!user,
    error: false,
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [wishlistState, setWishlistState] = useState<WishlistState>(() => emptyWishlist(user));
  const wishlistStateRef = useRef(wishlistState);
  const [cacheOwner, setCacheOwner] = useState(user);
  const currentUser = useRef(user);
  currentUser.current = user;
  const mounted = useRef(false);
  const bookingsRequest = useRef(0);
  const notificationsRequest = useRef(0);
  const wishlistRequest = useRef(0);
  const wishlistUpdates = useRef(new Map<string, symbol>());
  const wishlistOverrides = useRef(new Map<string, WishlistMutation>());

  // The first render after logout/account switching must not expose the old
  // account while the clearing effect is still waiting to run.
  const ownsCache = !!user && cacheOwner === user;
  const sessionBookings = ownsCache ? bookings : [];
  const ownsBookingLoadState = !!user && bookingLoadState.owner === user;
  const bookingsLoaded = ownsBookingLoadState && bookingLoadState.loaded;
  // A new identity starts its own initial load immediately, before effects run.
  // Loading/errors from the previous account never carry into this render.
  const bookingsRefreshing = !!user && (!ownsBookingLoadState || bookingLoadState.refreshing);
  const bookingsLoading = !!user && !bookingsLoaded && bookingsRefreshing;
  const bookingsError = ownsBookingLoadState && bookingLoadState.error;
  const sessionNotifications = ownsCache ? notifications : [];
  const ownsWishlistState = !!user && wishlistState.owner === user;
  const sessionWishlistIds = ownsWishlistState ? wishlistState.ids : [];
  const wishlistLoaded = ownsWishlistState && wishlistState.loaded;
  const wishlistRefreshing = !!user && (!ownsWishlistState || wishlistState.refreshing);
  const wishlistLoading = !!user && !wishlistLoaded && wishlistRefreshing;
  const wishlistError = ownsWishlistState && wishlistState.error;
  const wishlistMutationError = ownsWishlistState && wishlistState.mutationError;
  const wishlistPendingIds = ownsWishlistState ? wishlistState.pendingIds : [];
  const wishlistSavedAt = ownsWishlistState ? wishlistState.savedAt : {};
  const wishlistHotels = ownsWishlistState
    ? wishlistState.ids.map(id => wishlistState.hotels[id]).filter((hotel): hotel is Hotel => !!hotel)
    : [];
  const notificationsRef = useRef(sessionNotifications);
  notificationsRef.current = sessionNotifications;

  const publishWishlist = useCallback((account: AuthUser | null, update: (previous: WishlistState) => WishlistState) => {
    if (!mounted.current || currentUser.current !== account) return;
    const previous = wishlistStateRef.current.owner === account ? wishlistStateRef.current : emptyWishlist(account);
    const next = update(previous);
    wishlistStateRef.current = next;
    setWishlistState(next);
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      bookingsRequest.current += 1;
      notificationsRequest.current += 1;
      wishlistRequest.current += 1;
      wishlistUpdates.current.clear();
      wishlistOverrides.current.clear();
    };
  }, []);

  const refreshBookings = useCallback(async () => {
    const account = user;
    if (!account || currentUser.current !== account || !mounted.current) return;
    const request = ++bookingsRequest.current;
    const isCurrent = () => mounted.current && currentUser.current === account && bookingsRequest.current === request;
    setBookingLoadState(previous => isCurrent()
      ? { owner: account, loaded: previous.owner === account && previous.loaded, refreshing: true, error: false }
      : previous);
    try {
      const list = await bookingApi.myBookings();
      if (!isCurrent()) return;
      const lookup = new Map<string, Hotel>(hotelsRef.current?.map((hotel): [string, Hotel] => [hotel.id, hotel]) ?? []);
      setBookingsState(list.map(booking => {
        const hotel = lookup.get(String(booking.hotelId));
        return mapBookingToUI(booking, { hotelImage: hotel?.image, hotelLocation: hotel?.location, hotelAddress: hotel?.address });
      }));
      setBookingLoadState(previous => isCurrent()
        ? { owner: account, loaded: true, refreshing: true, error: false }
        : previous);
    } catch (err) {
      // Retain this account's last known state on a transient service failure.
      if (isCurrent()) {
        console.error('Failed to load bookings', err);
        setBookingLoadState(previous => isCurrent() ? { ...previous, error: true } : previous);
      }
    } finally {
      setBookingLoadState(previous => isCurrent() ? { ...previous, refreshing: false } : previous);
    }
  }, [hotelsRef, user]);

  const refreshNotifications = useCallback(async () => {
    const account = user;
    if (!account || currentUser.current !== account || !mounted.current) return;
    const request = ++notificationsRequest.current;
    const isCurrent = () => mounted.current && currentUser.current === account && notificationsRequest.current === request;
    try {
      const page = await notificationApi.list(0, 50);
      if (!isCurrent()) return;
      const next = page?.content ? page.content.map(mapNotificationToUI) : [];
      notificationsRef.current = next;
      setNotifications(next);
    } catch (err) {
      if (isCurrent()) console.warn('Notifications endpoint unavailable', err);
    }
  }, [user]);

  const refreshWishlist = useCallback(async () => {
    const account = user;
    // A new fetch must not race an outstanding change. An already-running fetch
    // merges changes made after it started through the per-hotel journal below.
    if (!account || currentUser.current !== account || !mounted.current || wishlistUpdates.current.size > 0) return;
    const request = ++wishlistRequest.current;
    const isCurrent = () => mounted.current && currentUser.current === account && wishlistRequest.current === request;
    wishlistOverrides.current.clear();
    publishWishlist(account, previous => ({ ...previous, refreshing: true, error: false, mutationError: false }));
    try {
      const items = await wishlistApi.list();
      if (!isCurrent()) return;
      if (!Array.isArray(items)) throw new Error('Invalid wishlist response');
      const ids = [...new Set(items.map(item => String(item.hotelId)))];
      const savedAt: Record<string, string> = {};
      const hotels: Record<string, Hotel> = {};
      for (const item of items) {
        const timestamp = wishlistTimestamp(item.createdAt);
        if (timestamp) savedAt[String(item.hotelId)] = timestamp;
        if (item.hotel) hotels[String(item.hotelId)] = mapHotelToUI(item.hotel);
      }
      for (const [id, operation] of wishlistOverrides.current) {
        // Initial loading may not have known whether an item existed before a
        // click. The fetched snapshot provides the rollback baseline for it.
        if (!operation.beforeKnown) {
          operation.beforeKnown = true;
          operation.before = ids.includes(id);
          operation.beforeSavedAt = savedAt[id];
          operation.beforeHotel = hotels[id];
        }
        if (operation.saved === null) continue;
        if (operation.saved) {
          if (!ids.includes(id)) ids.push(id);
          if (operation.savedAt) savedAt[id] = operation.savedAt;
          if (operation.hotel) hotels[id] = operation.hotel;
        } else {
          const index = ids.indexOf(id);
          if (index >= 0) ids.splice(index, 1);
          delete savedAt[id];
          delete hotels[id];
        }
      }
      publishWishlist(account, previous => ({ ...previous, ids, savedAt, hotels, loaded: true, error: false }));
    } catch (error) {
      if (isCurrent()) {
        console.error('Failed to load wishlist', error);
        publishWishlist(account, previous => ({ ...previous, error: true }));
      }
    } finally {
      if (isCurrent()) publishWishlist(account, previous => ({ ...previous, refreshing: false }));
    }
  }, [publishWishlist, user]);

  useEffect(() => {
    bookingsRequest.current += 1;
    notificationsRequest.current += 1;
    wishlistRequest.current += 1;
    wishlistUpdates.current.clear();
    wishlistOverrides.current.clear();
    setCacheOwner(user);
    setBookingsState([]);
    setBookingLoadState({ owner: user, loaded: false, refreshing: !!user, error: false });
    setNotifications([]);
    const nextWishlist = emptyWishlist(user);
    wishlistStateRef.current = nextWishlist;
    setWishlistState(nextWishlist);
    notificationsRef.current = [];
  }, [user]);

  useEffect(() => {
    if (user) void refreshWishlist();
  }, [user, refreshWishlist]);

  // Polling is tied to the exact login identity; late responses from a previous
  // identity are discarded even when the same account signs back in later.
  useEffect(() => {
    if (!user) return;
    refreshBookings();
    const intervalId = window.setInterval(refreshBookings, 30_000);
    return () => window.clearInterval(intervalId);
  }, [user, refreshBookings]);

  useEffect(() => {
    if (!user) return;
    refreshNotifications();
    const intervalId = window.setInterval(refreshNotifications, 30_000);
    return () => window.clearInterval(intervalId);
  }, [user, refreshNotifications]);

  const setWishlistSaved = useCallback(async (hotelId: string, saved: boolean): Promise<boolean> => {
    const account = user;
    if (!account || currentUser.current !== account || !mounted.current || !/^[1-9]\d*$/.test(hotelId)
      || !Number.isSafeInteger(Number(hotelId)) || Number(hotelId) <= 0 || wishlistUpdates.current.has(hotelId)) return false;
    const previous = wishlistStateRef.current.owner === account ? wishlistStateRef.current : emptyWishlist(account);
    const before = previous.ids.includes(hotelId);
    if (previous.loaded && before === saved) return true;
    const token = Symbol(hotelId);
    const priorOperation = wishlistOverrides.current.get(hotelId);
    const operation: WishlistMutation = {
      token, saved, before, beforeSavedAt: previous.savedAt[hotelId], beforeHotel: previous.hotels[hotelId],
      beforeKnown: previous.loaded || priorOperation?.committed === true,
      committed: false,
    };
    wishlistUpdates.current.set(hotelId, token);
    wishlistOverrides.current.set(hotelId, operation);
    const isCurrent = () => mounted.current && currentUser.current === account && wishlistUpdates.current.get(hotelId) === token;
    publishWishlist(account, state => {
      const savedAt = { ...state.savedAt };
      const hotels = { ...state.hotels };
      if (!saved) { delete savedAt[hotelId]; delete hotels[hotelId]; }
      return { ...state, ids: saved ? [...new Set([...state.ids, hotelId])] : state.ids.filter(id => id !== hotelId), savedAt, hotels,
        mutationError: false, pendingIds: [...wishlistUpdates.current.keys()] };
    });
    try {
      if (saved) {
        const item = await wishlistApi.add(Number(hotelId));
        if (!isCurrent()) return false;
        operation.savedAt = wishlistTimestamp(item.createdAt);
        if (item.hotel) operation.hotel = mapHotelToUI(item.hotel);
      } else {
        try { await wishlistApi.remove(Number(hotelId)); }
        catch (error) {
          // Another tab may already have removed this row. Confirm the desired
          // state instead of resurrecting a stale item after a normal 404.
          if (!(error instanceof ApiError) || error.status !== 404 || !isCurrent()) throw error;
          const status = await wishlistApi.status(Number(hotelId));
          if (status.wishlisted !== false || status.hotelId !== Number(hotelId)) throw error;
        }
        if (!isCurrent()) return false;
      }
      operation.committed = true;
      publishWishlist(account, state => {
        const savedAt = { ...state.savedAt };
        const hotels = { ...state.hotels };
        if (saved && operation.savedAt) savedAt[hotelId] = operation.savedAt;
        else if (!saved) delete savedAt[hotelId];
        if (saved && operation.hotel) hotels[hotelId] = operation.hotel;
        else if (!saved) delete hotels[hotelId];
        return { ...state, savedAt, hotels };
      });
      return true;
    } catch (error) {
      if (!isCurrent()) return false;
      console.error('Failed to update wishlist', error);
      operation.saved = operation.beforeKnown ? operation.before : null;
      operation.savedAt = operation.beforeSavedAt;
      operation.hotel = operation.beforeHotel;
      operation.committed = operation.beforeKnown;
      publishWishlist(account, state => {
        const savedAt = { ...state.savedAt };
        const hotels = { ...state.hotels };
        if (operation.beforeSavedAt) savedAt[hotelId] = operation.beforeSavedAt;
        else delete savedAt[hotelId];
        if (operation.beforeHotel) hotels[hotelId] = operation.beforeHotel;
        else delete hotels[hotelId];
        return { ...state, ids: operation.before ? [...new Set([...state.ids, hotelId])] : state.ids.filter(id => id !== hotelId), savedAt, hotels, mutationError: true };
      });
      return false;
    } finally {
      if (isCurrent()) {
        wishlistUpdates.current.delete(hotelId);
        publishWishlist(account, state => ({ ...state, pendingIds: [...wishlistUpdates.current.keys()] }));
      }
    }
  }, [publishWishlist, user]);

  const handleToggleWishlist = (hotelId: string) => {
    onRequireAuth(() => {
      if (!user || currentUser.current !== user) return;
      void setWishlistSaved(hotelId, !wishlistStateRef.current.ids.includes(hotelId));
    });
  };

  const handleMarkNotificationsRead = () => {
    const account = user;
    if (!account || currentUser.current !== account || !mounted.current) return;
    const unreadIds = new Set(notificationsRef.current.filter(item => item.unread).map(item => item.id));
    if (!unreadIds.size) return;
    const operation = ++notificationsRequest.current;
    const next = notificationsRef.current.map(item => ({ ...item, unread: false }));
    notificationsRef.current = next;
    setNotifications(next);
    notificationApi.markAllRead().catch(err => {
      if (!mounted.current || currentUser.current !== account || notificationsRequest.current !== operation) return;
      console.error('Failed to mark notifications read', err);
      const reverted = notificationsRef.current.map(item => unreadIds.has(item.id) ? { ...item, unread: true } : item);
      notificationsRef.current = reverted;
      setNotifications(reverted);
    });
  };

  const handleMarkNotificationRead = (notificationId: string) => {
    const account = user;
    if (!account || currentUser.current !== account || !mounted.current) return;
    const numericId = Number(notificationId);
    if (!Number.isInteger(numericId) || numericId <= 0 || !notificationsRef.current.some(item => item.id === notificationId && item.unread)) return;
    const operation = ++notificationsRequest.current;
    const next = notificationsRef.current.map(item => item.id === notificationId ? { ...item, unread: false } : item);
    notificationsRef.current = next;
    setNotifications(next);
    notificationApi.markRead(numericId).catch(err => {
      if (!mounted.current || currentUser.current !== account || notificationsRequest.current !== operation) return;
      console.error('Failed to mark notification read', err);
      const reverted = notificationsRef.current.map(item => item.id === notificationId ? { ...item, unread: true } : item);
      notificationsRef.current = reverted;
      setNotifications(reverted);
    });
  };

  const handleCancelBooking = async (bookingId: string, reason?: string) => {
    const account = user;
    if (!account || currentUser.current !== account || !mounted.current) throw new Error('Sign in to manage bookings.');
    const cancellation = await bookingApi.cancel(Number(bookingId), reason);
    if (mounted.current && currentUser.current === account) await refreshBookings();
    return cancellation;
  };

  // Checkout callbacks may finish after a logout. Bind this public setter to
  // the login identity that received it, rather than exposing the raw cache.
  const setBookings = useCallback<React.Dispatch<React.SetStateAction<Booking[]>>>((update) => {
    const account = user;
    if (!account || currentUser.current !== account || !mounted.current) return;
    bookingsRequest.current += 1;
    // A confirmed checkout result replaces any pending load and owns its state;
    // the invalidated request's finalizer must not leave the page loading.
    setBookingLoadState(previous => mounted.current && currentUser.current === account
      ? { owner: account, loaded: true, refreshing: false, error: false }
      : previous);
    setBookingsState(previous => {
      if (!mounted.current || currentUser.current !== account) return previous;
      return typeof update === 'function' ? update(previous) : update;
    });
  }, [user]);

  const activeBookingsCount = sessionBookings.filter(booking => booking.status === 'confirmed' || booking.status === 'checked-in').length;

  return {
    bookings: sessionBookings,
    bookingsLoading,
    bookingsRefreshing,
    bookingsError,
    bookingsLoaded,
    setBookings,
    refreshBookings,
    notifications: sessionNotifications,
    refreshNotifications,
    wishlistIds: sessionWishlistIds,
    wishlistLoading,
    wishlistRefreshing,
    wishlistLoaded,
    wishlistError,
    wishlistPendingIds,
    wishlistMutationError,
    wishlistSavedAt,
    wishlistHotels,
    refreshWishlist,
    setWishlistSaved,
    handleToggleWishlist,
    handleMarkNotificationsRead,
    handleMarkNotificationRead,
    handleCancelBooking,
    activeBookingsCount,
  };
}
