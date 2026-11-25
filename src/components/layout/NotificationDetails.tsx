import type { ReactNode, RefObject } from 'react';
import type { ParsedNotificationMessage } from '../../lib/notificationFormatter';
import type { Notification } from '../../types';

export function NotificationDetails({ notification, message, isID, headingRef, icon }: {
  notification: Notification;
  message: ParsedNotificationMessage;
  isID: boolean;
  headingRef: RefObject<HTMLHeadingElement | null>;
  icon: ReactNode;
}) {
  const rows = [
    { label: isID ? 'Nomor invoice' : 'Invoice number', value: message.invoiceNumber, code: true },
    { label: isID ? 'Kode reservasi' : 'Booking code', value: message.bookingCode, code: true },
    { label: isID ? 'Total dibayar' : 'Total paid', value: message.totalPaid },
    { label: 'Hotel', value: message.hotelName },
    { label: isID ? 'Kamar' : 'Room', value: message.roomType },
    { label: isID ? 'Tanggal menginap' : 'Stay dates', value: message.stayDates },
  ].filter(row => row.value);

  return (
    <article className="space-y-4">
      <div className="flex items-start gap-2.5">
        {icon}
        <div className="min-w-0">
          <h3 ref={headingRef} tabIndex={-1} className="text-lg font-bold leading-snug text-[#162951] outline-none [overflow-wrap:anywhere]">{notification.title}</h3>
          {notification.time && <p className="mt-1 text-xs font-medium text-slate-600">{notification.time}</p>}
        </div>
      </div>
      {message.cleanPreview && <p className="text-sm leading-6 whitespace-pre-line text-slate-700 [overflow-wrap:anywhere]">{message.cleanPreview}</p>}
      {rows.length > 0 && (
        <dl className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-[#f6f8fc] px-3.5">
          {rows.map(row => (
            <div key={row.label} className="grid min-w-0 gap-x-3 gap-y-1 py-2.5 min-[410px]:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] min-[410px]:items-baseline">
              <dt className="text-xs font-medium text-slate-600">{row.label}</dt>
              <dd className={`min-w-0 text-sm font-semibold text-[#162951] [overflow-wrap:anywhere] ${row.code ? 'font-mono text-[13px]' : ''}`}>{row.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </article>
  );
}
