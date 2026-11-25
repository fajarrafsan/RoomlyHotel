import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { BookingsPage } from './pages/BookingsPage';
import { WishlistPage } from './pages/WishlistPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { HotelDetailModal } from './components/hotels/HotelDetailModal';
import { RoomDetailPage } from './pages/RoomDetailPage';
import { CheckInPage } from './pages/CheckInPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminInvoicesPage } from './pages/AdminInvoicesPage';
import { AdminPaymentsPage } from './pages/AdminPaymentsPage';
import { AdminReviewsPage } from './pages/AdminReviewsPage';
import { AdminHotelsPage } from './pages/AdminHotelsPage';
import { AdminMasterDataPage } from './pages/AdminMasterDataPage';
import { AdminNotificationsPage } from './pages/AdminNotificationsPage';
import { HousekeepingPage } from './pages/HousekeepingPage';
import { BookingCheckoutPage } from './pages/BookingCheckoutPage';
import { InvoiceModal } from './components/booking/InvoiceModal';
import { getPaymentReturnOrder, PaymentReturnFeedback } from './components/booking/PaymentReturnFeedback';
import { AuthModal } from './components/auth/AuthModal';
import { AccountAccessGuard } from './components/auth/AccountAccessGuard';
import { LogoutConfirmDialog } from './components/auth/LogoutConfirmDialog';
import { AuthNoticeKind, AuthSessionNotice } from './components/auth/AuthSessionNotice';
import { HomeSkeleton } from './components/ui/HomeSkeleton';
import { ExploreSkeleton } from './components/explore/ExploreSkeleton';
import { BookingCheckoutSkeleton } from './components/booking/BookingCheckoutSkeleton';
import { RoomDetailPageSkeleton } from './components/rooms/RoomDetailSkeleton';
import { AdminWorkspaceSkeleton, WorkspaceHeaderSkeleton } from './components/admin/AdminSkeleton';

import { bookingApi } from './api/bookings';
import { mapBookingToUI } from './lib/adapters';
import { useAuth } from './context/AuthContext';
import { useHotelCatalog } from './hooks/useHotelCatalog';
import { useUserData } from './hooks/useUserData';
import { ADMIN_PATHS, isCustomerOnlyPath, isOperationsRole, roleLandingPath, viewToPath } from './lib/routes';
import { DashboardView, Language, Hotel, RoomType, Booking } from './types';

export default function App() {
  const { user, isLoading: authLoading, logoutRequested, isLoggingOut, logoutError, cancelLogout, logout, sessionEndReason } = useAuth();
  const currentUserRef = useRef(user);
  currentUserRef.current = user;
  const navigate = useNavigate();
  const location = useLocation();
  const returnedPaymentOrder = getPaymentReturnOrder(location.search);
  // Match the same case and trailing-slash variants as the router.
  const pathname = location.pathname.replace(/\/+$/, '').toLowerCase() || '/';
  const isAdminPath = pathname === ADMIN_PATHS.dashboard || pathname.startsWith(ADMIN_PATHS.dashboard + '/');
  const isWorkspacePath = isAdminPath || pathname === ADMIN_PATHS.checkIn || pathname === ADMIN_PATHS.housekeeping;
  const isCustomerPath = isCustomerOnlyPath(pathname);

  // Child components still navigate by menu id; this turns that id into a real URL.
  const goToView = (view: DashboardView) => navigate(viewToPath(view));

  const [language, setLanguage] = useState<Language>('ID');

  // White theme only — always remove the dark class and clear any saved theme.
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('heavenly_theme');
  }, []);

  // Staff sessions run role-specific operations workspaces, so storefront-only
  // routes redirect to the first screen that role can actually operate.
  const isOperations = isOperationsRole(user?.role);
  const workspaceRedirect = isOperations && isCustomerPath ? roleLandingPath(user?.role) : null;
  useEffect(() => {
    if (workspaceRedirect) navigate(workspaceRedirect, { replace: true });
  }, [workspaceRedirect, location.pathname, navigate]);

  const checkingWorkspace = authLoading && isWorkspacePath;
  const checkingStorefront = authLoading && !user && isCustomerPath;
  const pendingWorkspace = workspaceRedirect ?? (checkingWorkspace ? pathname : null);

  // Hotel catalog + lazy per-hotel detail enrichment.
  const {
    hotels,
    hotelsLoading,
    hotelsError,
    refreshHotels,
    selectedHotelForModal,
    setSelectedHotelForModal,
    openHotelDetail,
    detailLoadingId,
  } = useHotelCatalog();

  const hotelsRef = useRef<Hotel[] | null>(null);
  useEffect(() => {
    hotelsRef.current = hotels;
  }, [hotels]);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');

  // Modals
  const [activeInvoiceBooking, setActiveInvoiceBooking] = useState<Booking | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authReturnTo, setAuthReturnTo] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<AuthNoticeKind | null>(null);
  const lastSessionNotice = useRef<AuthNoticeKind | null>(null);
  const [invoiceLookupError, setInvoiceLookupError] = useState<string | null>(null);

  const openAuth = useCallback((returnTo: string | null = null) => {
    setAuthReturnTo(returnTo);
    setAuthNotice(null);
    setShowAuthModal(true);
  }, []);

  const closeAuth = useCallback(() => {
    setShowAuthModal(false);
    setAuthReturnTo(null);
  }, []);

  useEffect(() => {
    if (user) {
      lastSessionNotice.current = null;
      setAuthNotice(null);
      return;
    }
    if (!sessionEndReason || lastSessionNotice.current === sessionEndReason) return;
    lastSessionNotice.current = sessionEndReason;
    setAuthNotice(sessionEndReason);
    closeAuth();
    setActiveInvoiceBooking(null);
    setSelectedHotelForModal(null);
    setInvoiceLookupError(null);
    if (sessionEndReason === 'logout') navigate('/', { replace: true });
  }, [user, sessionEndReason, closeAuth, navigate, setSelectedHotelForModal]);

  useEffect(() => {
    if (authNotice !== 'logout') return;
    const timer = window.setTimeout(() => setAuthNotice(null), 6500);
    return () => window.clearTimeout(timer);
  }, [authNotice]);

  useEffect(() => {
    if (showAuthModal && authReturnTo && `${location.pathname}${location.search}` !== authReturnTo) closeAuth();
  }, [location.pathname, location.search, showAuthModal, authReturnTo, closeAuth]);

  const confirmLogout = async () => {
    try { await logout(); } catch { /* The confirmation keeps the account and retry error visible. */ }
  };

  const accountPage = (feature: string, page: React.ReactNode) => (
    <AccountAccessGuard language={language} feature={feature} onSignIn={() => openAuth(`${location.pathname}${location.search}`)}>{page}</AccountAccessGuard>
  );

  const requireAuth = (action: () => void) => {
    if (!user) {
      openAuth();
      return;
    }
    action();
  };

  const handleBookRoom = (hotel: Hotel, room: RoomType) => {
    const path = `/booking/${hotel.id}/${room.id}`;
    setSelectedHotelForModal(null);
    navigate(path);
    if (!user) openAuth(path);
  };

  const {
    bookings,
    setBookings,
    refreshBookings,
    bookingsLoading,
    bookingsRefreshing,
    bookingsError,
    bookingsLoaded,
    notifications,
    refreshNotifications,
    wishlistIds,
    wishlistHotels,
    wishlistSavedAt,
    wishlistLoading,
    wishlistRefreshing,
    wishlistLoaded,
    wishlistError,
    wishlistMutationError,
    wishlistPendingIds,
    refreshWishlist,
    setWishlistSaved,
    handleToggleWishlist,
    handleMarkNotificationsRead,
    handleMarkNotificationRead,
    handleCancelBooking,
    activeBookingsCount,
  } = useUserData(user, hotelsRef, requireAuth);

  // Complete Booking — BookingCheckoutPage already created the real booking (and
  // payment session) against Roomly; this just folds the result into local state.
  const handleCompleteBooking = (newBooking: Booking) => {
    if (!user || currentUserRef.current !== user) return;
    setBookings((prev) => {
      const exists = prev.some((booking) => booking.id === newBooking.id);
      return exists
        ? prev.map((booking) => booking.id === newBooking.id ? newBooking : booking)
        : [newBooking, ...prev];
    });
    setSelectedHotelForModal(null);
    // The real invoice is only issued asynchronously after PAYMENT_SUCCESS.
    // Do not open a receipt or create a fake notification before that happens.
    window.setTimeout(refreshNotifications, 1_500);
  };

  // Opening an invoice from a notification: the booking may not be in the
  // locally-loaded list (an older stay, or a page loaded before it existed), so
  // fall back to fetching it by code from booking-service. If it genuinely can't
  // be resolved we surface that — never a placeholder booking, because this
  // modal shows money and guest details that must be real.
  const handleOpenInvoiceByCode = async (bookingCode: string) => {
    const owner = user;
    if (!owner) return;
    setInvoiceLookupError(null);

    const found = bookings.find((b) => b.bookingCode === bookingCode);
    if (found) {
      setActiveInvoiceBooking(found);
      return;
    }

    try {
      const response = await bookingApi.getByCode(bookingCode);
      if (currentUserRef.current !== owner) return;
      const hotel = hotelsRef.current?.find((h) => h.id === String(response.hotelId));
      setActiveInvoiceBooking(
        mapBookingToUI(response, {
          hotelImage: hotel?.image,
          hotelLocation: hotel?.location,
          hotelAddress: hotel?.address,
        })
      );
    } catch (err) {
      if (currentUserRef.current !== owner) return;
      console.error('Failed to resolve booking by code', bookingCode, err);
      setInvoiceLookupError(
        language === 'ID'
          ? `Reservasi dengan kode ${bookingCode} tidak ditemukan atau tidak dapat diakses.`
          : `Booking ${bookingCode} could not be found or accessed.`
      );
    }
  };

  // The account list can arrive before the public catalog. Enrich on render so
  // the correct hotel photos appear as soon as that catalog finishes loading.
  const bookingHotels = new Map(hotels.map(hotel => [hotel.id, hotel]));
  const bookingsForDisplay = bookings.map(booking => {
    const hotel = bookingHotels.get(booking.hotelId);
    return hotel ? { ...booking, hotelImage: hotel.image, hotelLocation: hotel.location, hotelAddress: hotel.address } : booking;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased">
      {/* Top Navigation Header */}
      {checkingWorkspace || checkingStorefront ? <WorkspaceHeaderSkeleton admin={isAdminPath} /> : <Header
        activeBookingsCount={activeBookingsCount}
        wishlistCount={wishlistIds.length}
        language={language}
        onLanguageChange={setLanguage}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        notifications={notifications}
        onMarkNotificationsRead={handleMarkNotificationsRead}
        onMarkNotificationRead={handleMarkNotificationRead}
        onSelectCity={(city) => {
          setSelectedCity(city);
          goToView('explore');
        }}
        onOpenAuth={() => openAuth()}
        onOpenInvoiceByCode={handleOpenInvoiceByCode}
      />}

      {hotelsError && !isWorkspacePath && !pendingWorkspace && !checkingStorefront && pathname !== '/wishlist' && pathname !== '/analytics' && (
        <div className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4">
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {language === 'ID'
              ? `Gagal memuat data hotel dari Roomly API: ${hotelsError}. Pastikan Roomly (gateway + hotel-service + room-service) sedang berjalan di localhost:8080.`
              : `Failed to load hotel data from the Roomly API: ${hotelsError}. Make sure Roomly (gateway + hotel-service + room-service) is running on localhost:8080.`}
          </div>
        </div>
      )}

      {invoiceLookupError && (
        <div className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center justify-between gap-3">
            <span>{invoiceLookupError}</span>
            <button
              onClick={() => setInvoiceLookupError(null)}
              className="shrink-0 px-2.5 py-1 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer"
            >
              {language === 'ID' ? 'Tutup' : 'Dismiss'}
            </button>
          </div>
        </div>
      )}

      {/* Full-Width Main Content Container */}
      <div className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <main id="main-content" className="w-full h-full">
        {pendingWorkspace ? (
          <AdminWorkspaceSkeleton pathname={pendingWorkspace} isID={language === 'ID'} checking={checkingWorkspace} />
        ) : checkingStorefront ? (
          <div role="status" className="mx-auto max-w-lg py-12 text-center text-sm font-medium text-slate-600">
            {language === 'ID' ? 'Memeriksa sesi Roomly…' : 'Checking your Roomly session…'}
          </div>
        ) : hotelsLoading && hotels.length === 0 && !hotelsError && !isWorkspacePath && !pathname.startsWith('/settings') && pathname !== '/bookings' && pathname !== '/wishlist' && pathname !== '/analytics' ? (
          pathname.startsWith('/hotel/')
            ? <RoomDetailPageSkeleton isID={language === 'ID'} />
            : pathname.startsWith('/booking/')
            ? <BookingCheckoutSkeleton isID={language === 'ID'} />
            : pathname.startsWith('/explore')
              ? <ExploreSkeleton isID={language === 'ID'} />
              : <HomeSkeleton />
        ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            <Routes location={location}>
              <Route
                path="/"
                element={
                  <HomePage
                    bookings={bookings}
                    hotels={hotels}
                    wishlistCount={wishlistIds.length}
                    onOpenInvoice={setActiveInvoiceBooking}
                    onSelectHotel={openHotelDetail}
                    onNavigateTo={goToView}
                    language={language}
                    searchCity={selectedCity}
                    onSearchCityChange={(city) => {
                      setSelectedCity(city);
                      setSearchQuery('');
                    }}
                    wishlistIds={wishlistIds}
                    onToggleWishlist={handleToggleWishlist}
                  />
                }
              />

              <Route
                path="/explore"
                element={
                  <ExplorePage
                    hotels={hotels}
                    searchQuery={searchQuery}
                    onSearchQueryChange={setSearchQuery}
                    selectedCity={selectedCity}
                    onSelectCity={setSelectedCity}
                    onSelectHotel={openHotelDetail}
                    wishlistIds={wishlistIds}
                    onToggleWishlist={handleToggleWishlist}
                    language={language}
                  />
                }
              />

              <Route
                path="/bookings"
                element={
                  accountPage(language === 'ID' ? 'pesanan' : 'bookings', <BookingsPage
                    bookings={bookingsForDisplay}
                    bookingsLoading={bookingsLoading}
                    bookingsRefreshing={bookingsRefreshing}
                    bookingsError={bookingsError}
                    bookingsLoaded={bookingsLoaded}
                    onRefresh={refreshBookings}
                    onOpenInvoice={setActiveInvoiceBooking}
                    onCancelBooking={handleCancelBooking}
                    language={language}
                  />)
                }
              />

              <Route
                path="/wishlist"
                element={
                  accountPage(language === 'ID' ? 'wishlist' : 'your wishlist', <WishlistPage
                    hotels={hotels}
                    wishlistHotels={wishlistHotels}
                    wishlistIds={wishlistIds}
                    wishlistSavedAt={wishlistSavedAt}
                    wishlistLoading={wishlistLoading}
                    wishlistRefreshing={wishlistRefreshing}
                    wishlistLoaded={wishlistLoaded}
                    wishlistError={wishlistError}
                    wishlistMutationError={wishlistMutationError}
                    wishlistPendingIds={wishlistPendingIds}
                    catalogLoading={hotelsLoading}
                    catalogError={!!hotelsError}
                    onRefresh={() => { void refreshWishlist(); refreshHotels(); }}
                    onSetSaved={setWishlistSaved}
                    onSelectHotel={openHotelDetail}
                    language={language}
                  />)
                }
              />

              <Route
                path="/analytics"
                element={
                  accountPage(language === 'ID' ? 'statistik akun' : 'account statistics', <AnalyticsPage
                    bookings={bookingsForDisplay}
                    hotels={hotels}
                    bookingsLoading={bookingsLoading}
                    bookingsRefreshing={bookingsRefreshing}
                    bookingsLoaded={bookingsLoaded}
                    bookingsError={bookingsError}
                    onRefresh={refreshBookings}
                    language={language}
                  />)
                }
              />

              <Route
                path="/settings"
                element={
                  accountPage(language === 'ID' ? 'pengaturan' : 'settings', <SettingsPage
                    language={language}
                    onLanguageChange={setLanguage}
                    onOpenAuth={() => openAuth('/settings')}
                  />)
                }
              />

              {/* Room detail is its own page too — browse a room's full amenities,
                  layout and policies before committing to the booking flow. */}
              <Route
                path="/hotel/:hotelId/room/:roomId"
                element={
                  <RoomDetailPage
                    hotels={hotels}
                    language={language}
                    onBook={handleBookRoom}
                  />
                }
              />

              {/* Booking checkout is a real page (not a modal stacked on the hotel
                  detail modal) so it has its own URL and survives a refresh. */}
              <Route
                path="/booking/:hotelId/:roomId"
                element={
                  accountPage(language === 'ID' ? 'reservasi' : 'your reservation', <BookingCheckoutPage
                    hotels={hotels}
                    onCompleteBooking={handleCompleteBooking}
                    onBookingStatusChanged={refreshBookings}
                    language={language}
                  />)
                }
              />

              {/* Role-specific staff workspaces. Each page also enforces its own access guard. */}
              <Route path={ADMIN_PATHS.checkIn} element={<CheckInPage language={language} />} />
              <Route path="/staff/housekeeping" element={<HousekeepingPage language={language} />} />

              {/* ===== Admin console — every screen is ADMIN-gated inside itself,
                   and each maps onto a Roomly /api/admin/** endpoint group. ===== */}
              <Route
                path="/admin"
                element={
                  <AdminDashboardPage
                    hotels={hotels}
                    language={language}
                    onOpenInvoice={setActiveInvoiceBooking}
                    onOpenAuth={() => setShowAuthModal(true)}
                  />
                }
              />

              <Route
                path="/admin/invoices"
                element={
                  <AdminInvoicesPage language={language} onOpenAuth={() => setShowAuthModal(true)} />
                }
              />

              <Route
                path="/admin/payments"
                element={
                  <AdminPaymentsPage language={language} onOpenAuth={() => setShowAuthModal(true)} />
                }
              />

              <Route
                path="/admin/reviews"
                element={
                  <AdminReviewsPage language={language} hotels={hotels} onOpenAuth={() => setShowAuthModal(true)} />
                }
              />

              <Route
                path="/admin/hotels"
                element={
                  <AdminHotelsPage language={language} onOpenAuth={() => setShowAuthModal(true)} />
                }
              />

              <Route
                path="/admin/master-data"
                element={
                  <AdminMasterDataPage language={language} onOpenAuth={() => setShowAuthModal(true)} />
                }
              />

              <Route
                path="/admin/notifications"
                element={
                  <AdminNotificationsPage language={language} onOpenAuth={() => setShowAuthModal(true)} />
                }
              />

              {/* Unknown URL falls back to the home page instead of a blank screen. */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
        )}
        </main>
      </div>

      {/* Hotel Details Modal */}
      <AnimatePresence>
        {selectedHotelForModal && (
          <HotelDetailModal
            hotel={selectedHotelForModal}
            isLoadingDetail={detailLoadingId === selectedHotelForModal.id}
            onClose={() => setSelectedHotelForModal(null)}
            onSelectRoom={(hotel, room) => {
              setSelectedHotelForModal(null);
              navigate(`/hotel/${hotel.id}/room/${room.id}`);
            }}
            isWishlisted={wishlistIds.includes(selectedHotelForModal.id)}
            onToggleWishlist={handleToggleWishlist}
            language={language}
          />
        )}
      </AnimatePresence>

      {/* Invoice Modal */}
      <AnimatePresence>
        {user?.role === 'CUSTOMER' && returnedPaymentOrder && (
          <PaymentReturnFeedback
            key={`${user.userId}:${returnedPaymentOrder}`}
            orderId={returnedPaymentOrder}
            isID={language === 'ID'}
            onStatusChanged={refreshBookings}
          />
        )}
        {user && activeInvoiceBooking && (
          <InvoiceModal
            booking={activeInvoiceBooking}
            onClose={() => setActiveInvoiceBooking(null)}
            language={language}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAuthModal && <AuthModal onClose={closeAuth} language={language} returnTo={authReturnTo} />}
      </AnimatePresence>
      <LogoutConfirmDialog open={Boolean(user && logoutRequested)} language={language} user={user} busy={isLoggingOut} failed={Boolean(logoutError)} onCancel={cancelLogout} onConfirm={() => { void confirmLogout(); }} />
      {authNotice && <AuthSessionNotice kind={authNotice} language={language} onDismiss={() => setAuthNotice(null)} onSignIn={() => openAuth(`${location.pathname}${location.search}`)} />}
    </div>
  );
}
