import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { CalendarDays, LayoutDashboard, RotateCw, UserCheck, UserPlus, Users, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAdminData } from '../hooks/useAdminData';
import { ADMIN_PATHS } from '../lib/routes';
import type { Booking, Hotel, Language } from '../types';
import { AdminAccessGuard } from '../components/admin/AdminAccessGuard';
import { AdminRoomInventory, AdminStatsGrid } from '../components/admin/AdminStatsGrid';
import { AdminBookingsTable } from '../components/admin/AdminBookingsTable';
import { AdminCustomersTable } from '../components/admin/AdminCustomersTable';
import { AdminStaffDirectory } from '../components/admin/AdminStaffDirectory';
import { AdminWorkspaceSkeleton } from '../components/admin/AdminSkeleton';
import { StaffModal } from '../components/admin/StaffModal';

interface AdminDashboardPageProps {
  hotels: Hotel[];
  language: Language;
  onOpenInvoice: (booking: Booking) => void;
  onOpenAuth: () => void;
}

const tabs = [
  { id: 'overview', icon: LayoutDashboard, idLabel: 'Ikhtisar', enLabel: 'Overview' },
  { id: 'customers', icon: UsersRound, idLabel: 'Pelanggan', enLabel: 'Customers' },
  { id: 'staff', icon: Users, idLabel: 'Kelola staf', enLabel: 'Staff' },
] as const;
type DashboardTab = typeof tabs[number]['id'];

export function AdminDashboardPage({ hotels, language, onOpenInvoice, onOpenAuth }: AdminDashboardPageProps) {
  const isID = language === 'ID';
  const { user } = useAuth();
  const {
    stats, allBookings, bookingsError, staffList, staffError, inventory, initialLoading, loading, loadAdminData,
    handleCreateStaff, handleDeactivateStaff, handleConfirmBooking, handleCheckOutGuest,
  } = useAdminData(user, hotels);
  const tabId = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const activeMutation = useRef(false);
  const [mutating, setMutating] = useState(false);
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [customer, setCustomer] = useState<string | null>(null);

  const runMutation = async <Result,>(action: () => Promise<Result>) => {
    if (activeMutation.current || loading) throw new Error(isID ? 'Tunggu proses dasbor selesai.' : 'Wait for the dashboard to finish updating.');
    activeMutation.current = true;
    setMutating(true);
    try {
      return await action();
    } finally {
      activeMutation.current = false;
      setMutating(false);
    }
  };

  const handleTabKeys = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1
      : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    setActiveTab(tabs[next].id);
    tabRefs.current[next]?.focus();
  };

  if (user?.role !== 'ADMIN') return <AdminAccessGuard isID={isID} onOpenAuth={onOpenAuth}>{null}</AdminAccessGuard>;
  if (initialLoading) return <AdminWorkspaceSkeleton pathname={ADMIN_PATHS.dashboard} isID={isID} />;

  const date = new Intl.DateTimeFormat(isID ? 'id-ID' : 'en-US', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date());

  return (
    <div className="admin-dashboard mx-auto max-w-[1340px] space-y-5 pb-14 text-slate-800 sm:space-y-6">
      <header className="relative isolate overflow-hidden rounded-[24px] bg-[#101f3d] px-5 py-6 text-white shadow-sm sm:px-8 sm:py-8">
        <picture className="absolute inset-y-0 right-0 -z-20 hidden h-full w-[58%] [mask-image:linear-gradient(to_right,transparent,black_36%)] md:block" aria-hidden>
          <source media="(min-width: 768px)" srcSet="/images/seed/hotels/plataran-borobudur.jpg" />
          <img alt="" decoding="async" className="h-full w-full object-cover object-[center_60%] opacity-60" />
        </picture>
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-[#101f3d] via-[#101f3d]/80 to-[#101f3d]/30" aria-hidden />
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs font-medium text-gold-light sm:text-sm"><CalendarDays className="size-4" aria-hidden />{date}</p>
            <h1 className="mt-2 font-serif text-[clamp(1.95rem,4.4vw,3.3rem)] leading-tight tracking-tight">{isID ? 'Dasbor admin' : 'Admin dashboard'}</h1>
            <p className="mt-1.5 text-sm leading-6 text-slate-100 sm:text-base">{isID ? 'Pantau reservasi, pendapatan, dan kesiapan kamar.' : 'Track reservations, revenue, and room readiness.'}</p>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_44px] items-center gap-1.5 sm:flex sm:flex-wrap sm:gap-2">
            <Link to={ADMIN_PATHS.checkIn} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-gold-soft px-1.5 text-center text-xs font-semibold leading-tight text-navy-dark hover:bg-white sm:gap-2 sm:px-4 sm:text-sm">
              <UserCheck className="hidden size-4 shrink-0 min-[380px]:block" aria-hidden />{isID ? 'Check-in tamu' : 'Guest check-in'}
            </Link>
            <button type="button" onClick={() => setStaffModalOpen(true)} disabled={loading || mutating} className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-white/35 bg-[#14254b]/80 px-1.5 text-center text-xs font-semibold leading-tight text-white hover:bg-navy disabled:cursor-not-allowed disabled:opacity-60 sm:gap-2 sm:px-4 sm:text-sm">
              <UserPlus className="hidden size-4 shrink-0 min-[380px]:block" aria-hidden />{isID ? 'Tambah staf' : 'Add staff'}
            </button>
            <button type="button" onClick={() => void loadAdminData()} disabled={loading || mutating || staffModalOpen} aria-busy={loading} aria-label={isID ? 'Muat ulang data' : 'Refresh data'} title={isID ? 'Muat ulang data' : 'Refresh data'} className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-xl border border-white/35 bg-[#14254b]/80 text-white hover:bg-navy disabled:cursor-not-allowed disabled:opacity-60">
              <RotateCw className={`size-4 ${loading ? 'motion-safe:animate-spin' : ''}`} aria-hidden />
            </button>
          </div>
        </div>
      </header>

      <div role="tablist" aria-label={isID ? 'Bagian dasbor' : 'Dashboard sections'} className="grid w-full grid-cols-3 gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm sm:inline-grid sm:w-auto">
        {tabs.map(({ id, icon: Icon, idLabel, enLabel }, index) => (
          <button
            key={id} ref={element => { tabRefs.current[index] = element; }} type="button" role="tab"
            id={`${tabId}-${id}`} aria-controls={`${tabId}-panel`} aria-selected={id === activeTab} tabIndex={id === activeTab ? 0 : -1}
            onClick={() => setActiveTab(id)} onKeyDown={event => handleTabKeys(event, index)}
            className={`flex min-h-11 min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-1.5 text-xs font-semibold transition-colors sm:px-4 sm:text-sm ${id === activeTab ? 'bg-navy-dark text-white' : 'text-slate-700 hover:bg-navy-soft hover:text-navy-dark'}`}
          >
            <Icon className="hidden size-4 shrink-0 min-[365px]:block" aria-hidden />
            {isID ? idLabel : enLabel}
          </button>
        ))}
      </div>

      <div id={`${tabId}-panel`} role="tabpanel" aria-labelledby={`${tabId}-${activeTab}`} className="space-y-5 sm:space-y-6">
        {activeTab === 'overview' ? (
          <>
            <AdminStatsGrid isID={isID} stats={stats} inventory={inventory} loading={loading} bookingsError={bookingsError} />
            <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_270px]">
              <AdminBookingsTable
                isID={isID} language={language} bookings={allBookings} loading={loading} unavailable={bookingsError}
                blocked={mutating} customerEmail={customer} onClearCustomer={() => setCustomer(null)} onOpenInvoice={onOpenInvoice}
                onConfirm={id => runMutation(() => handleConfirmBooking(id))}
                onCheckOut={id => runMutation(() => handleCheckOutGuest(id))}
              />
              <AdminRoomInventory inventory={inventory} isID={isID} loading={loading} />
            </div>
          </>
        ) : activeTab === 'customers' ? (
          <AdminCustomersTable
            isID={isID} bookings={allBookings} staffList={staffList} loading={loading} incomplete={bookingsError || staffError}
            onFilterCustomerBookings={email => { setCustomer(email); setActiveTab('overview'); tabRefs.current[0]?.focus(); }}
          />
        ) : (
          <AdminStaffDirectory
            staff={staffList} hotels={hotels} isID={isID} loading={loading} unavailable={staffError}
            blocked={mutating} onDeactivate={id => runMutation(() => handleDeactivateStaff(id))}
          />
        )}
      </div>

      <StaffModal
        isOpen={staffModalOpen} onClose={() => setStaffModalOpen(false)} isID={isID} hotels={hotels}
        onSubmit={payload => runMutation(() => handleCreateStaff(payload))}
      />
    </div>
  );
}
