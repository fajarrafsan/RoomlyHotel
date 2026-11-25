interface StayScheduleTimeProps {
  time?: string | null;
  checkout?: boolean;
  isID: boolean;
}

export function StayScheduleTime({ time, checkout = false, isID }: StayScheduleTimeProps) {
  const hoursAndMinutes = time?.match(/^((?:[01]\d|2[0-3]):[0-5]\d)(?::[0-5]\d(?:\.\d{1,9})?)?$/)?.[1];
  if (!hoursAndMinutes) {
    return <span className="mt-0.5 block text-xs leading-4 text-slate-500">{isID ? 'Jam belum tersedia' : 'Time unavailable'}</span>;
  }

  const prefix = isID ? (checkout ? 'Paling lambat' : 'Mulai') : (checkout ? 'By' : 'From');
  return (
    <span className="mt-0.5 block text-xs font-medium leading-4 text-slate-600">
      {prefix} <time className="whitespace-nowrap font-semibold text-navy-dark tabular-nums" dateTime={hoursAndMinutes}>{hoursAndMinutes}</time>
    </span>
  );
}
