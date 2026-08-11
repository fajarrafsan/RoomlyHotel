export interface ParsedNotificationMessage {
  cleanPreview: string;
  invoiceNumber?: string;
  bookingCode?: string;
  hotelName?: string;
  roomType?: string;
  stayDates?: string;
  totalPaid?: string;
  hasHtml: boolean;
}

export function parseNotificationMessage(rawMessage: string): ParsedNotificationMessage {
  if (!rawMessage) {
    return { cleanPreview: '', hasHtml: false };
  }

  const hasHtml = /<[a-z][\s\S]*>/i.test(rawMessage);

  if (!hasHtml) {
    return {
      cleanPreview: rawMessage.trim(),
      hasHtml: false,
    };
  }

  // Extract key invoice details from HTML string
  let invoiceNumber: string | undefined;
  let bookingCode: string | undefined;
  let hotelName: string | undefined;
  let roomType: string | undefined;
  let stayDates: string | undefined;
  let totalPaid: string | undefined;

  // Extract Invoice code (e.g. INV-20260810-0002)
  const invMatch = rawMessage.match(/INV-[A-Za-z0-9-]+/i);
  if (invMatch) invoiceNumber = invMatch[0];

  // Extract Booking code (e.g. BK-20260810-FE252E89)
  const bkMatch = rawMessage.match(/BK-[A-Za-z0-9-]+/i);
  if (bkMatch) bookingCode = bkMatch[0];

  // Extract Hotel name from table rows like <tr>...Hotel...<td>The Westin Surabaya</td></tr>
  const hotelMatch = rawMessage.match(/Hotel<\/td>\s*<td[^>]*>([^<]+)<\/td>/i);
  if (hotelMatch) hotelName = hotelMatch[1].trim();

  // Extract Room type
  const roomMatch = rawMessage.match(/Room<\/td>\s*<td[^>]*>(?:<b>)?([^<]+)(?:<\/b>)?<\/td>/i);
  if (roomMatch) roomType = roomMatch[1].trim();

  // Extract Stay dates
  const stayMatch = rawMessage.match(/Stay<\/td>\s*<td[^>]*>([^<]+)<\/td>/i);
  if (stayMatch) stayDates = stayMatch[1].trim();

  // Extract Total paid
  const totalMatch = rawMessage.match(/Total paid<\/td>\s*<td[^>]*>(?:<b>)?([^<]+)(?:<\/b>)?<\/td>/i);
  if (totalMatch) totalPaid = totalMatch[1].trim();

  // Clean text preview by stripping HTML tags and tables
  let cleanText = rawMessage
    .replace(/<table[\s\S]*?<\/table>/gi, '') // remove tables for dropdown preview
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanText || cleanText.length < 5) {
    if (invoiceNumber) {
      cleanText = `Invoice ${invoiceNumber} ${bookingCode ? `(${bookingCode})` : ''} telah terbit.`;
    } else {
      cleanText = 'Informasi invoice dan rincian pembayaran.';
    }
  }

  return {
    cleanPreview: cleanText,
    invoiceNumber,
    bookingCode,
    hotelName,
    roomType,
    stayDates,
    totalPaid,
    hasHtml: true,
  };
}
