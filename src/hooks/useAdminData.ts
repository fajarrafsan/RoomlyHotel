import { useState, useEffect, useMemo } from 'react';
import { adminApi, StaffUserDto, CreateStaffRequestDto } from '../api/admin';
import { mapBookingToUI } from '../lib/adapters';
import { AuthUser, Booking, Hotel } from '../types';
import { RoomInventorySummaryResponse } from '../types/api/room';

export function useAdminData(user: AuthUser | null, hotels: Hotel[]) {
  const isAdmin = user?.role === 'ADMIN';

  const [staffList, setStaffList] = useState<StaffUserDto[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);

  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);

  // Real physical-unit counts, the single source of truth for capacity KPIs.
  const [inventory, setInventory] = useState<RoomInventorySummaryResponse | null>(null);

  // Load staff & system-wide bookings if ADMIN
  const loadAdminData = async () => {
    if (!isAdmin) return;
    
    setStaffLoading(true);
    setStaffError(null);
    try {
      const staff = await adminApi.listStaff();
      setStaffList(staff);
    } catch (err) {
      console.error('Failed to load staff list', err);
      setStaffError('Gagal memuat daftar staf.');
    } finally {
      setStaffLoading(false);
    }

    // System-wide bookings from booking-service. An empty result means the
    // system genuinely has no bookings — it must NOT fall back to this admin's
    // own reservations, which would misreport personal data as system data.
    setBookingsLoading(true);
    setBookingsError(null);
    try {
      const rawBookings = await adminApi.listAllBookings();
      const hotelLookup = new Map<string, Hotel>(hotels.map((h) => [h.id, h]));
      setAllBookings(
        (rawBookings ?? []).map((b) => {
          const h = hotelLookup.get(String(b.hotelId));
          return mapBookingToUI(b, {
            hotelImage: h?.image,
            hotelLocation: h?.location,
            hotelAddress: h?.address,
          });
        })
      );
    } catch (err) {
      console.error('Failed to load system-wide bookings', err);
      setAllBookings([]);
      setBookingsError('Gagal memuat data reservasi sistem.');
    } finally {
      setBookingsLoading(false);
    }

    // Real capacity, counted from room_units by room-service. Left null on
    // failure so the dashboard shows "—" rather than a made-up number.
    try {
      setInventory(await adminApi.inventorySummary());
    } catch (err) {
      console.error('Failed to load room inventory summary', err);
      setInventory(null);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [isAdmin, hotels.length]);

  // KPIs are computed from the real system-wide list only.
  const stats = useMemo(() => {
    const list = allBookings;

    const totalRevenue = list
      .filter((b) => b.paymentStatus === 'paid' && b.status !== 'cancelled')
      .reduce((sum, b) => sum + b.totalPrice, 0);

    const totalBookings = list.length;
    const confirmedCount = list.filter((b) => b.status === 'confirmed').length;
    const checkedInCount = list.filter((b) => b.status === 'checked-in').length;
    const completedCount = list.filter((b) => b.status === 'completed').length;
    const cancelledCount = list.filter((b) => b.status === 'cancelled').length;

    // Capacity is the real count of physical room units from room-service, not
    // an estimate derived from the hotel catalog. The previous version summed
    // `r.totalInventory || r.availableRooms || 5` per room type, which invented
    // 5 units for every room the catalog hadn't loaded inventory for — so the
    // figure never matched what the rooms actually had.
    const totalInventory = inventory?.totalUnits ?? null;

    // Occupancy is only meaningful against a known capacity.
    const occupancyRate =
      totalInventory && totalInventory > 0
        ? Math.min(100, Math.round((checkedInCount / totalInventory) * 100))
        : null;

    return {
      totalRevenue,
      totalBookings,
      confirmedCount,
      checkedInCount,
      completedCount,
      cancelledCount,
      occupancyRate,
      totalHotels: hotels.length,
      totalInventory,
      availableUnits: inventory?.availableUnits ?? null,
      occupiedUnits: inventory?.occupiedUnits ?? null,
      outOfServiceUnits: inventory?.outOfServiceUnits ?? null,
    };
  }, [allBookings, hotels, inventory]);

  // Actions
  const handleCreateStaff = async (payload: CreateStaffRequestDto) => {
    const newStaff = await adminApi.createStaff(payload);
    setStaffList((prev) => [newStaff, ...prev]);
    return newStaff;
  };

  const handleDeactivateStaff = async (staffId: number) => {
    await adminApi.deactivateStaff(staffId);
    setStaffList((prev) =>
      prev.map((s) => (s.id === staffId ? { ...s, active: false, status: 'INACTIVE' } : s))
    );
  };

  // Manual confirmation for reservations that never completed an online
  // payment (bank transfer settled at the desk, corporate billing). The
  // backend flips the booking to CONFIRMED/PAID, so mirror both fields here
  // instead of guessing a partial state.
  const handleConfirmBooking = async (bookingId: string) => {
    const numericId = Number(bookingId);
    if (!Number.isFinite(numericId)) return;
    const confirmed = await adminApi.confirmBooking(numericId);
    setAllBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? { ...b, status: 'confirmed', paymentStatus: confirmed.paymentStatus === 'PAID' ? 'paid' : b.paymentStatus }
          : b
      )
    );
  };

  const handleCheckOutGuest = async (bookingId: string) => {
    const numericId = Number(bookingId);
    if (!isNaN(numericId)) {
      await adminApi.checkOut(numericId);
    }
    setAllBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: 'completed' } : b))
    );
  };

  return {
    isAdmin,
    stats,
    allBookings,
    bookingsError,
    bookingsLoading,
    staffList,
    staffLoading,
    staffError,
    loadAdminData,
    handleCreateStaff,
    handleDeactivateStaff,
    handleConfirmBooking,
    handleCheckOutGuest,
  };
}
