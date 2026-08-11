import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
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

export const RoomAvailabilityCalendar: React.FC<RoomAvailabilityCalendarProps> = ({
  isID,
  roomId,
  checkIn,
  checkOut,
  onCheckInChange,
  onCheckOutChange
}) => {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [availability, setAvailability] = useState<Map<string, RoomAvailabilityResponse>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rangeWarning, setRangeWarning] = useState<string | null>(null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const from = toISODate(today);
    const to = toISODate(addDays(today, FETCH_WINDOW_DAYS));
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
  }, [roomId, today, isID]);

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
    const currentCheckIn = checkIn ? startOfDay(new Date(checkIn)) : null;

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
  const goPrevMonth = () => {
    if (!canGoPrev) return;
    const d = new Date(viewYear, viewMonth - 1, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };
  const goNextMonth = () => {
    const d = new Date(viewYear, viewMonth + 1, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const cells = getMonthGrid(viewYear, viewMonth);
  const monthLabel = new Intl.DateTimeFormat(isID ? 'id-ID' : 'en-US', { month: 'long', year: 'numeric' }).format(new Date(viewYear, viewMonth, 1));
  const weekdayLabels = isID
    ? ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const todayIso = toISODate(today);

  const checkInDate = checkIn ? startOfDay(new Date(checkIn)) : null;
  const checkOutDate = checkOut ? startOfDay(new Date(checkOut)) : null;
  const previewEnd = checkOutDate || (hoverDate ? startOfDay(new Date(hoverDate)) : null);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <button
          type="button"
          onClick={goPrevMonth}
          disabled={!canGoPrev}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200/70 hover:text-slate-700 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs font-bold text-slate-800 capitalize">{monthLabel}</span>
        <button
          type="button"
          onClick={goNextMonth}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200/70 hover:text-slate-700 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 gap-1 px-3 pt-3 pb-1">
        {weekdayLabels.map((w) => (
          <div key={w} className="text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 py-1">{w}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1 p-3 pt-0 relative">
        {loading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-b-2xl">
            <Loader2 className="w-5 h-5 text-slate-900 animate-spin" />
          </div>
        )}

        {cells.map((date, idx) => {
          if (!date) return <div key={`empty-${idx}`} />;
          const status = dayStatus(date);
          const iso = toISODate(date);
          const isToday = iso === todayIso;
          const isCheckIn = checkInDate && toISODate(checkInDate) === iso;
          const isCheckOut = checkOutDate && toISODate(checkOutDate) === iso;
          const isSelected = Boolean(isCheckIn || isCheckOut);
          const inRange = checkInDate && previewEnd && date > checkInDate && date < previewEnd;
          const entry = availability.get(iso);
          const disabled = !isSelectable(date);

          let cellClasses: string;
          let indicator: 'label-in' | 'label-out' | 'dot-open' | 'dot-limited' | null = null;

          if (isSelected) {
            cellClasses = 'bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/30 ring-1 ring-amber-500/40 cursor-pointer';
            indicator = isCheckIn ? 'label-in' : 'label-out';
          } else if (status === 'past') {
            cellClasses = 'text-slate-300 cursor-not-allowed';
          } else if (status === 'no-data') {
            cellClasses = 'text-slate-300 cursor-not-allowed border border-dashed border-slate-200';
          } else if (status === 'blocked') {
            cellClasses = 'text-rose-400 line-through cursor-not-allowed bg-rose-50/70';
          } else if (status === 'limited') {
            cellClasses = inRange
              ? 'bg-amber-100/70 text-amber-900 cursor-pointer'
              : 'bg-amber-50 hover:bg-amber-100 text-amber-800 cursor-pointer hover:scale-[1.05] hover:shadow-md transition-all';
            indicator = inRange ? null : 'dot-limited';
          } else {
            cellClasses = inRange
              ? 'bg-emerald-100/70 text-emerald-900 cursor-pointer'
              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 cursor-pointer hover:scale-[1.05] hover:shadow-md transition-all';
            indicator = inRange ? null : 'dot-open';
          }

          return (
            <button
              key={iso}
              type="button"
              disabled={disabled}
              onClick={() => handleDayClick(date)}
              onMouseEnter={() => setHoverDate(iso)}
              title={entry ? `${entry.availableInventory}/${entry.totalInventory} ${isID ? 'kamar tersisa' : 'rooms left'}` : (status === 'no-data' ? (isID ? 'Belum ada data ketersediaan' : 'No availability data') : undefined)}
              className={`relative aspect-square rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-px transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-1 ${isToday ? 'ring-1 ring-inset ring-amber-400/70' : ''} ${cellClasses}`}
            >
              <span className={isToday ? 'underline decoration-amber-400 underline-offset-2' : ''}>
                {date.getDate()}
              </span>
              {indicator === 'label-in' && <span className="text-[7px] font-bold uppercase tracking-widest opacity-80">{isID ? 'Masuk' : 'In'}</span>}
              {indicator === 'label-out' && <span className="text-[7px] font-bold uppercase tracking-widest opacity-80">{isID ? 'Keluar' : 'Out'}</span>}
              {(indicator === 'dot-open' || indicator === 'dot-limited') && (
                <span className={`w-1 h-1 rounded-full ${indicator === 'dot-open' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/60">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] font-medium text-slate-500">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" />{isID ? 'Tersedia' : 'Available'}</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" />{isID ? 'Terbatas' : 'Limited'}</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-400" />{isID ? 'Penuh / Tutup' : 'Sold out'}</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-300" />{isID ? 'Belum ada data' : 'No data'}</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400 ring-2 ring-amber-400/30" />{isID ? 'Hari ini' : 'Today'}</span>
        </div>
      </div>

      {error && (
        <div className="mx-4 mb-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-semibold flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      {rangeWarning && (
        <div className="mx-4 mb-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-semibold flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {rangeWarning}
        </div>
      )}
    </div>
  );
};
