import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { adminApi, type StaffUserDto, type CreateStaffRequestDto } from '../api/admin';
import { mapBookingToUI } from '../lib/adapters';
import type { AuthUser, Hotel } from '../types';
import type { BookingResponse, RoomInventorySummaryResponse } from '../types/api';

export function useAdminData(user: AuthUser | null, hotels: Hotel[]) {
  const adminId = user?.role === 'ADMIN' ? user.userId : null;
  const requestVersion = useRef(0);
  const [loadedFor, setLoadedFor] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [staffList, setStaffList] = useState<StaffUserDto[]>([]);
  const [staffError, setStaffError] = useState(false);
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [bookingsError, setBookingsError] = useState(false);
  const [inventory, setInventory] = useState<RoomInventorySummaryResponse | null>(null);

  const loadAdminData = useCallback(async () => {
    if (adminId == null) return;
    const version = ++requestVersion.current;
    setRefreshing(true);
    const [staff, reservations, rooms] = await Promise.allSettled([
      adminApi.listStaff(),
      adminApi.listAllBookings(),
      adminApi.inventorySummary(),
    ]);
    if (version !== requestVersion.current) return;

    setStaffList(staff.status === 'fulfilled' ? staff.value : []);
    setStaffError(staff.status === 'rejected');
    setBookings(reservations.status === 'fulfilled' ? reservations.value ?? [] : []);
    setBookingsError(reservations.status === 'rejected');
    setInventory(rooms.status === 'fulfilled' ? rooms.value : null);
    setLoadedFor(adminId);
    setRefreshing(false);
  }, [adminId]);

  useEffect(() => {
    void loadAdminData();
    return () => { requestVersion.current += 1; };
  }, [loadAdminData]);

  const ownsData = loadedFor === adminId && adminId != null;
  const allBookings = useMemo(() => {
    if (!ownsData) return [];
    const hotelLookup = new Map(hotels.map(hotel => [hotel.id, hotel]));
    return bookings.map(booking => {
      const hotel = hotelLookup.get(String(booking.hotelId));
      return mapBookingToUI(booking, {
        hotelImage: hotel?.image,
        hotelLocation: hotel?.location,
        hotelAddress: hotel?.address,
      });
    });
  }, [bookings, hotels, ownsData]);

  const stats = useMemo(() => ({
    totalRevenue: allBookings.reduce((total, booking) =>
      booking.paymentStatus === 'paid' && booking.status !== 'cancelled' ? total + booking.totalPrice : total, 0),
    totalBookings: allBookings.length,
    confirmedCount: allBookings.filter(booking => booking.status === 'confirmed').length,
    checkedInCount: allBookings.filter(booking => booking.status === 'checked-in').length,
    completedCount: allBookings.filter(booking => booking.status === 'completed').length,
  }), [allBookings]);

  const handleCreateStaff = async (payload: CreateStaffRequestDto) => {
    const version = requestVersion.current;
    const newStaff = await adminApi.createStaff(payload);
    if (version === requestVersion.current) setStaffList(previous => [newStaff, ...previous]);
    return newStaff;
  };

  const handleDeactivateStaff = async (staffId: number) => {
    const version = requestVersion.current;
    await adminApi.deactivateStaff(staffId);
    if (version === requestVersion.current) {
      setStaffList(previous => previous.map(staff => staff.id === staffId
        ? { ...staff, active: false, status: 'INACTIVE' }
        : staff));
    }
  };

  const updateBooking = (updated: BookingResponse) => {
    setBookings(previous => previous.map(booking => booking.id === updated.id ? updated : booking));
  };

  const handleConfirmBooking = async (bookingId: string) => {
    const version = requestVersion.current;
    const updated = await adminApi.confirmBooking(Number(bookingId));
    if (version === requestVersion.current) updateBooking(updated);
  };

  const handleCheckOutGuest = async (bookingId: string) => {
    const version = requestVersion.current;
    const updated = await adminApi.checkOut(Number(bookingId));
    if (version === requestVersion.current) {
      updateBooking(updated);
      const rooms = await adminApi.inventorySummary().catch(() => null);
      if (version === requestVersion.current) setInventory(rooms);
    }
    return updated;
  };

  return {
    stats,
    allBookings,
    bookingsError: ownsData && bookingsError,
    staffList: ownsData ? staffList : [],
    staffError: ownsData && staffError,
    inventory: ownsData ? inventory : null,
    initialLoading: !ownsData,
    loading: refreshing || !ownsData,
    loadAdminData,
    handleCreateStaff,
    handleDeactivateStaff,
    handleConfirmBooking,
    handleCheckOutGuest,
  };
}
