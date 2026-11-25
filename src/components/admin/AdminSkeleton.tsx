import type { CSSProperties } from 'react';
import { ADMIN_PATHS } from '../../lib/routes';

const blocks = 'rounded-md bg-slate-200 motion-safe:animate-pulse';
const lightBlocks = 'rounded-md bg-white/15 motion-safe:animate-pulse';
const card = 'min-w-0 rounded-[20px] border border-slate-200 bg-white shadow-sm';

const workspaceTitles: Record<string, [string, string]> = {
  [ADMIN_PATHS.dashboard]: ['Dasbor admin', 'Admin dashboard'],
  [ADMIN_PATHS.checkIn]: ['Check-in & check-out', 'Check-in & check-out'],
  [ADMIN_PATHS.housekeeping]: ['Housekeeping', 'Housekeeping'],
  [ADMIN_PATHS.invoices]: ['Invoice', 'Invoices'],
  [ADMIN_PATHS.payments]: ['Pembayaran', 'Payments'],
  [ADMIN_PATHS.reviews]: ['Ulasan', 'Reviews'],
  [ADMIN_PATHS.hotels]: ['Properti & Kamar', 'Properties & Rooms'],
  [ADMIN_PATHS.masterData]: ['Data Master', 'Master Data'],
  [ADMIN_PATHS.notifications]: ['Notifikasi', 'Notifications'],
};

function RowsPlaceholder({ columns }: { columns: number }) {
  return (
    <div aria-hidden className="divide-y divide-slate-200" style={{ '--columns': columns } as CSSProperties}>
      <div className="hidden grid-cols-[2fr_repeat(var(--columns),minmax(0,1fr))] gap-4 bg-slate-50 px-5 py-3.5 lg:grid">
        <div className={blocks + ' h-2.5 w-24'} />
        {Array.from({ length: columns }, (_, index) => <div key={index} className={blocks + ' h-2.5 w-3/5'} />)}
      </div>
      {[0, 1, 2].map(row => (
        <div key={row} className="grid grid-cols-2 gap-3 px-4 py-4 sm:px-5 lg:grid-cols-[2fr_repeat(var(--columns),minmax(0,1fr))] lg:items-center lg:gap-4 lg:py-3.5">
          <div className="col-span-2 space-y-2 lg:col-span-1">
            <div className={blocks + ' h-3 w-3/4 max-w-44'} />
            <div className={blocks + ' h-2.5 w-1/2 max-w-28'} />
          </div>
          {Array.from({ length: columns }, (_, index) => (
            <div key={index} className={blocks + (index === columns - 1 ? ' h-7 w-2/3 max-w-24 rounded-lg' : ' h-3 w-4/5 max-w-28')} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function AdminRowsSkeleton({ isID, columns = 3 }: { isID: boolean; columns?: number }) {
  return (
    <div role="status" aria-busy="true" data-admin-rows-skeleton>
      <span className="sr-only">{isID ? 'Memuat daftar…' : 'Loading records…'}</span>
      <RowsPlaceholder columns={columns} />
    </div>
  );
}

type CardLayout = 'properties' | 'reviews' | 'rooms' | 'tasks';

function CardsPlaceholder({ layout }: { layout: CardLayout }) {
  const properties = layout === 'properties';
  const reviews = layout === 'reviews';
  const grid = properties ? 'gap-4 sm:grid-cols-2 xl:grid-cols-3'
    : reviews ? 'gap-px bg-slate-200 md:grid-cols-2'
      : layout === 'rooms' ? 'gap-3 md:grid-cols-2 xl:grid-cols-3' : 'gap-3 lg:grid-cols-2 lg:gap-4';

  return (
    <div aria-hidden className={`grid ${grid}`}>
      {Array.from({ length: properties || layout === 'rooms' ? 3 : 4 }, (_, index) => (
        <div key={index} className={reviews ? 'bg-white' : card + ' overflow-hidden'}>
          {properties && <div className={blocks + ' aspect-[2.4] rounded-none'} />}
          <div className="space-y-3 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className={blocks + ' h-4 w-3/5 max-w-60'} />
              <div className={blocks + ' h-4 w-14 shrink-0 rounded-full'} />
            </div>
            <div className={blocks + ' h-3 w-4/5'} />
            <div className={blocks + ' h-3 w-2/3'} />
            <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
              <div className={blocks + ' h-3 w-1/3'} />
              <div className={blocks + ' h-9 w-24 rounded-xl'} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminCardsSkeleton({ isID, layout }: { isID: boolean; layout: CardLayout }) {
  return (
    <div role="status" aria-busy="true" data-admin-cards-skeleton={layout}>
      <span className="sr-only">{isID ? 'Memuat data…' : 'Loading data…'}</span>
      <CardsPlaceholder layout={layout} />
    </div>
  );
}

function DashboardPlaceholder({ isID }: { isID: boolean }) {
  return (
    <>
      <div aria-hidden className="grid w-full grid-cols-3 gap-1 rounded-xl border border-slate-200 bg-white p-1 sm:w-95">
        {[0, 1, 2].map(index => <div key={index} className={blocks + ' h-11 rounded-lg'} />)}
      </div>
      <div>
        <p className="mb-3 text-lg font-semibold text-navy-dark">{isID ? 'Ringkasan operasional' : 'Operations overview'}</p>
        <div aria-hidden className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
          {['bg-emerald-100', 'bg-navy-soft', 'bg-gold-soft', 'bg-violet-100'].map(tone => (
            <div key={tone} className={card + ' space-y-2 p-3.5 sm:p-5'}>
              <div className={`size-8 rounded-lg motion-safe:animate-pulse sm:size-10 ${tone}`} />
              <div className={blocks + ' h-3 w-3/4'} />
              <div className={blocks + ' h-6 w-2/3'} />
              <div className={blocks + ' h-3 w-4/5'} />
            </div>
          ))}
        </div>
      </div>
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_270px]">
        <div className={card + ' overflow-hidden'}>
          <p className="border-b border-slate-200 px-4 py-4 text-lg font-semibold text-navy-dark sm:px-5">
            {isID ? 'Reservasi' : 'Reservations'}
          </p>
          <RowsPlaceholder columns={4} />
        </div>
        <div className={card + ' space-y-3 p-4 sm:p-5'}>
          <div aria-hidden className={blocks + ' size-10 rounded-xl'} />
          <p className="text-lg font-semibold text-navy-dark">{isID ? 'Kesiapan kamar' : 'Room readiness'}</p>
          {[0, 1, 2].map(index => <div key={index} aria-hidden className={blocks + ' h-3 w-4/5'} />)}
        </div>
      </div>
    </>
  );
}

export function AdminWorkspaceSkeleton({ pathname, isID, checking = false }: { pathname: string; isID: boolean; checking?: boolean }) {
  const dashboard = pathname === ADMIN_PATHS.dashboard;
  const payments = pathname === ADMIN_PATHS.payments;
  const properties = pathname === ADMIN_PATHS.hotels;
  const reviews = pathname === ADMIN_PATHS.reviews;
  const housekeeping = pathname === ADMIN_PATHS.housekeeping;
  const checkIn = pathname === ADMIN_PATHS.checkIn;
  const title = workspaceTitles[pathname]?.[isID ? 0 : 1] ?? (isID ? 'Panel admin' : 'Admin panel');

  return (
    <div className={`operations-page mx-auto space-y-4 pb-14 sm:space-y-5 ${payments ? 'max-w-[1280px]' : 'max-w-[1340px]'}`}
      role="status" aria-busy="true" data-admin-workspace-skeleton={pathname}>
      <span className="sr-only">{checking
        ? (isID ? 'Memeriksa sesi Roomly…' : 'Checking your Roomly session…')
        : (isID ? 'Memuat halaman admin…' : 'Loading the admin workspace…')}</span>
      <div className={payments
        ? 'flex min-h-16 items-center gap-3'
        : 'relative isolate flex flex-wrap items-end justify-between gap-4 rounded-[24px] bg-[#101f3d] px-5 py-6 text-white sm:px-8 sm:py-8'}>
        {payments && <div aria-hidden className="size-11 shrink-0 rounded-xl border border-gold/20 bg-gold-soft sm:size-14" />}
        <div className="min-w-0">
          {!payments && <div aria-hidden className={lightBlocks + (dashboard ? ' mb-2 h-4 w-40' : ' mb-2.5 size-9 rounded-xl')} />}
          <p className={`font-serif leading-tight tracking-tight ${dashboard || checkIn ? 'text-[clamp(1.9rem,4.4vw,3.3rem)]' : 'text-[clamp(1.85rem,4vw,2.8rem)]'} ${payments ? 'text-navy-dark' : ''}`}>{title}</p>
          <div aria-hidden className={`${payments ? blocks : lightBlocks} mt-2 h-3 w-44 max-w-full sm:w-64`} />
        </div>
        {!payments && <div aria-hidden className="flex gap-2">
          {(dashboard || properties || housekeeping || pathname === ADMIN_PATHS.masterData || pathname === ADMIN_PATHS.notifications)
            && <div className={lightBlocks + ' h-11 w-28 rounded-xl sm:w-32'} />}
          <div className={lightBlocks + ' size-11 rounded-xl'} />
        </div>}
      </div>

      {dashboard ? <DashboardPlaceholder isID={isID} /> : checkIn ? (
        <div aria-hidden className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className={card + ' space-y-3 p-5'}>
            <div className={blocks + ' h-5 w-36'} />
            <div className={blocks + ' h-11 w-full rounded-xl'} />
          </div>
          <div className={card + ' space-y-3 p-5'}>
            <div className={blocks + ' h-4 w-32'} />
            <div className={blocks + ' h-3 w-4/5'} />
            <div className={blocks + ' h-3 w-3/5'} />
          </div>
        </div>
      ) : (
        <>
          {(payments || housekeeping) && (
            <div aria-hidden className={`grid gap-2 sm:grid-cols-3 ${payments ? 'rounded-[22px] bg-[#162850] p-3' : 'grid-cols-3'}`}>
              {[0, 1, 2].map(index => (
                <div key={index} className={payments ? lightBlocks + ' h-11 rounded-xl sm:h-16' : card + ' space-y-2 p-3 sm:p-5'}>
                  {housekeeping && <><div className={blocks + ' size-8'} /><div className={blocks + ' h-3 w-3/4'} /></>}
                </div>
              ))}
            </div>
          )}
          {properties ? (
            <>
              <div className={card + ' p-4 sm:p-5'} aria-hidden><div className={blocks + ' h-11 w-full max-w-lg rounded-xl'} /></div>
              <CardsPlaceholder layout="properties" />
            </>
          ) : housekeeping ? <CardsPlaceholder layout="tasks" /> : (
            <div className={card + ' overflow-hidden'}>
              <div aria-hidden className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4 sm:p-5">
                <div className={blocks + ' h-5 w-32'} />
                <div className={blocks + ' h-10 w-full max-w-72 rounded-lg'} />
              </div>
              {reviews ? <CardsPlaceholder layout="reviews" /> : <RowsPlaceholder columns={3} />}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function WorkspaceHeaderSkeleton({ admin }: { admin: boolean }) {
  return (
    <div aria-hidden className="border-b border-slate-200 bg-white" data-session-header-skeleton={admin ? 'admin' : 'session'}>
      {!admin && <div className="hidden h-9 bg-navy-dark lg:block" />}
      <div className={admin ? 'bg-[#172953] bg-[radial-gradient(ellipse_at_left_top,#243d78_0%,transparent_68%)]' : ''}>
        <div className="mx-auto flex h-16 max-w-[1680px] items-center justify-between gap-3 px-4 sm:px-8 lg:h-[72px] lg:px-10 2xl:px-14">
          <div className={(admin ? lightBlocks : blocks) + ' h-8 w-32 rounded-lg'} />
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {[0, 1, 2].map(index => <div key={index} className={(admin ? lightBlocks : blocks) + ' size-11 rounded-xl'} />)}
          </div>
        </div>
      </div>
      {admin && (
        <div className="mx-auto hidden h-[60px] max-w-[1680px] items-center gap-4 px-7 lg:flex xl:px-11 2xl:px-15">
          {Array.from({ length: 8 }, (_, index) => <div key={index} className={blocks + ' h-7 w-[8%] rounded-lg'} />)}
        </div>
      )}
    </div>
  );
}
