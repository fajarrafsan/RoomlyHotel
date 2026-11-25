import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { roomApi } from '../../api/rooms';
import { RoomAvailabilityResponse } from '../../types/api';
import { toISODate, startOfDay, addDays, getMonthGrid } from '../../lib/calendar';

interface RoomAvailabilityCalendarProps {
  isID: boolean;
  roomId: string;
  checkIn: string;
  checkOut: string;
  onCheckInChange: (value: string) => void;
  onCheckOutChange: (value: string) => void;
}

const BLOCKED_STATUSES = new Set(['SOLD_OUT', 'MAINTENANCE', 'CLOSED']);
const FETCH_WINDOW_DAYS = 90;
const navButton = 'absolute top-0 z-10 grid size-10 cursor-pointer place-items-center rounded-xl border border-slate-200 bg-white text-navy-dark hover:bg-navy-soft motion-safe:transition-colors disabled:cursor-not-allowed disabled:bg-white disabled:text-slate-400 sm:size-11';

export const RoomAvailabilityCalendar: React.FC<RoomAvailabilityCalendarProps> = ({
  isID,
  roomId,
  checkIn,
  checkOut,
  onCheckInChange,
  onCheckOutChange
}) => {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [viewDate, setViewDate] = useState(() => checkIn ? new Date(checkIn + 'T00:00:00') : today);
  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();
  const lastDay = useMemo(() => addDays(today, FETCH_WINDOW_DAYS), [today]);
  const [availability, setAvailability] = useState<Map<string, RoomAvailabilityResponse>>(new Map());
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [rangeWarning, setRangeWarning] = useState<string | null>(null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setAvailability(new Map());
    const from = toISODate(today);
    const to = toISODate(lastDay);
    roomApi
      .availability(Number(roomId), from, to)
      .then((rows) => {
        if (cancelled) return;
        const map = new Map<string, RoomAvailabilityResponse>();
        rows.forEach((row) => map.set(row.availabilityDate, row));
        setAvailability(map);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Failed to load room availability', err);
        setError(isID ? 'Gagal memuat data ketersediaan.' : 'Failed to load availability data.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [roomId, today, lastDay, isID, retryCount]);

  // A date with no availability row at all is treated the same as blocked —
  // we genuinely don't know if it's bookable, so it must not be selectable,
  // not just "probably fine, the server will catch it later".
  const dayStatus = (date: Date): 'past' | 'no-data' | 'blocked' | 'limited' | 'open' => {
    if (startOfDay(date) < today) return 'past';
    const entry = availability.get(toISODate(date));
    if (!entry) return 'no-data';
    if (BLOCKED_STATUSES.has(entry.status)) return 'blocked';
    if (entry.status === 'LIMITED') return 'limited';
    return 'open';
  };

  const isSelectable = (date: Date) => {
    const status = dayStatus(date);
    return status === 'open' || status === 'limited';
  };

  // Every night between checkIn (inclusive) and checkOut (exclusive) must be
  // confirmed open/limited — mirrors booking-service's own validateAvailability(),
  // which checks the same range and also rejects gaps in the availability data.
  const hasUnavailableNightBetween = (start: Date, end: Date): boolean => {
    let cursor = start;
    while (cursor < end) {
      if (!isSelectable(cursor)) return true;
      cursor = addDays(cursor, 1);
    }
    return false;
  };

  const handleDayClick = (date: Date) => {
    if (!isSelectable(date)) return;
    setRangeWarning(null);

    const iso = toISODate(date);
    const currentCheckIn = checkIn ? new Date(checkIn + 'T00:00:00') : null;

    if (!currentCheckIn || checkOut || date <= currentCheckIn) {
      // Start a new selection.
      onCheckInChange(iso);
      onCheckOutChange('');
      return;
    }

    // Picking check-out.
    if (hasUnavailableNightBetween(currentCheckIn, date)) {
      setRangeWarning(
        isID
          ? 'Rentang ini melewati tanggal yang tidak tersedia. Pilih tanggal check-out yang lebih awal.'
          : 'This range passes through an unavailable date. Pick an earlier check-out date.'
      );
      return;
    }
    onCheckOutChange(iso);
  };

  const canGoPrev = viewYear > today.getFullYear() || (viewYear === today.getFullYear() && viewMonth > today.getMonth());
  const nextMonth = new Date(viewYear, viewMonth + 1, 1);
  const canGoNext = nextMonth <= lastDay;
  const goPrevMonth = () => setViewDate(new Date(viewYear, viewMonth - 1, 1));
  const goNextMonth = () => setViewDate(nextMonth);

  const locale = isID ? 'id-ID' : 'en-US';
  const weekdayLabels = isID
    ? ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const statusLabels = {
    past: isID ? 'sudah lewat' : 'in the past',
    'no-data': isID ? 'belum ada data ketersediaan' : 'no availability data',
    blocked: isID ? 'penuh atau tutup' : 'sold out or closed',
    limited: isID ? 'tersedia terbatas' : 'limited availability',
    open: isID ? 'tersedia' : 'available',
  };
  const todayIso = toISODate(today);
  const checkInDate = checkIn ? new Date(checkIn + 'T00:00:00') : null;
  const checkOutDate = checkOut ? new Date(checkOut + 'T00:00:00') : null;
  const previewEnd = checkOutDate || (hoverDate ? new Date(hoverDate + 'T00:00:00') : null);

  const renderMonth = (year: number, month: number) => (
    <div className="min-w-0">
      <p className="flex h-10 items-center justify-center text-center text-sm font-bold capitalize text-navy-dark sm:h-11 sm:text-base" aria-live="polite">
        {new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(new Date(year, month, 1))}
      </p>
      <div className="mt-1 grid grid-cols-7">
        {weekdayLabels.map((w) => (
          <div key={w} className="py-1.5 text-center text-xs font-semibold text-slate-500">{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5 sm:gap-y-1">
        {getMonthGrid(year, month).map((date, idx) => {
          if (!date) return <div key={`empty-${idx}`} />;
          const status = dayStatus(date);
          const iso = toISODate(date);
          const isToday = iso === todayIso;
          const isCheckIn = Boolean(checkInDate && toISODate(checkInDate) === iso);
          const isCheckOut = Boolean(checkOutDate && toISODate(checkOutDate) === iso);
          const isSelected = isCheckIn || isCheckOut;
          const inRange = Boolean(checkInDate && previewEnd && date > checkInDate && date < previewEnd);
          const rangeStarts = isCheckIn && Boolean(previewEnd && checkInDate && previewEnd > checkInDate);
          const entry = availability.get(iso);
          const disabled = !isSelectable(date);

          const band = inRange
            ? 'bg-navy-soft'
            : rangeStarts
              ? 'bg-gradient-to-r from-transparent from-50% to-navy-soft to-50%'
              : isCheckOut
                ? 'bg-gradient-to-l from-transparent from-50% to-navy-soft to-50%'
                : '';

          const tone = isSelected
            ? 'cursor-pointer bg-navy-dark text-white'
            : status === 'past' || status === 'no-data'
              ? 'cursor-not-allowed text-slate-400'
              : status === 'blocked'
                ? 'cursor-not-allowed text-slate-400 line-through'
              : 'cursor-pointer text-navy-dark hover:bg-navy-soft';

          return (
            <div key={iso} className={`flex items-center justify-center ${band}`}>
              <button
                type="button"
                disabled={loading || disabled}
                onClick={() => handleDayClick(date)}
                onMouseEnter={() => setHoverDate(disabled ? null : iso)}
                aria-label={`${new Intl.DateTimeFormat(locale, { dateStyle: 'full' }).format(date)}, ${statusLabels[status]}`}
                aria-pressed={isSelected}
                title={entry ? `${entry.availableInventory}/${entry.totalInventory} ${isID ? 'kamar tersisa' : 'rooms left'}` : (status === 'no-data' ? statusLabels['no-data'] : undefined)}
                className={`relative flex h-[34px] w-full max-w-11 items-center justify-center rounded-[10px] text-sm font-semibold tabular-nums motion-safe:transition-colors sm:h-10 ${isToday && !isSelected ? 'ring-1 ring-inset ring-gold' : ''} ${tone}`}
              >
                {date.getDate()}
                {status === 'limited' && !isSelected && <span className="absolute bottom-1 size-1 rounded-full bg-gold" aria-hidden />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-2.5 sm:p-4" data-checkout-calendar>
      <div className="relative" onMouseLeave={() => setHoverDate(null)}>
        <button type="button" onClick={goPrevMonth} disabled={!canGoPrev} aria-label={isID ? 'Bulan sebelumnya' : 'Previous month'} className={`${navButton} left-0`}>
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <button type="button" onClick={goNextMonth} disabled={!canGoNext} aria-label={isID ? 'Bulan berikutnya' : 'Next month'} className={`${navButton} right-0`}>
          <ChevronRight className="size-4" aria-hidden />
        </button>

        <div className={canGoNext ? 'grid xl:grid-cols-2 xl:gap-6' : 'mx-auto xl:max-w-[420px]'}>
          {renderMonth(viewYear, viewMonth)}
          {canGoNext && <div className="hidden min-w-0 border-l border-slate-100 pl-6 xl:block">{renderMonth(nextMonth.getFullYear(), nextMonth.getMonth())}</div>}
        </div>

        {loading && (
          <div className="absolute inset-x-0 bottom-0 top-11 z-10 flex items-center justify-center bg-white/85" role="status">
            <Loader2 className="size-5 text-navy motion-safe:animate-spin" aria-hidden />
            <span className="sr-only">{isID ? 'Memuat ketersediaan kamar' : 'Loading room availability'}</span>
          </div>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-slate-100 pt-2 text-xs leading-5 text-slate-600 sm:mt-3 sm:gap-x-4">
        <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-gold" aria-hidden />{isID ? 'Terbatas' : 'Limited'}</span>
        <span className="flex items-center gap-1.5"><span className="font-medium text-slate-400 line-through" aria-hidden>12</span>{isID ? 'Penuh / tutup' : 'Sold out'}</span>
        <span className="flex items-center gap-1.5"><span className="size-3.5 rounded-full ring-1 ring-inset ring-gold" aria-hidden />{isID ? 'Hari ini' : 'Today'}</span>
      </div>

      {error ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-100 bg-rose-50 p-2.5 text-sm text-rose-800">
          <p className="flex items-center gap-2" role="alert"><AlertCircle className="size-4 shrink-0" aria-hidden />{error}</p>
          <button type="button" onClick={() => setRetryCount(count => count + 1)} className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg px-2 font-bold hover:bg-rose-100">
            <RefreshCw className="size-4" aria-hidden />{isID ? 'Coba lagi' : 'Try again'}
          </button>
        </div>
      ) : rangeWarning && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 p-3 text-[13px] font-medium leading-5 text-rose-700" role="alert">
          <AlertCircle className="mt-px size-4 shrink-0" aria-hidden />
          {rangeWarning}
        </div>
      )}
    </div>
  );
};
