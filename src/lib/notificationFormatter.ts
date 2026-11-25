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

  // Booking and invoice templates are normally plain text. Extract their
  // references before branching into the richer HTML-only parser so real
  // in-app notifications can still open the related booking or invoice.
  const invMatch = rawMessage.match(/INV-[A-Za-z0-9-]+/i);
  const bkMatch = rawMessage.match(/BK-[A-Za-z0-9-]+/i);
  const invoiceNumber = invMatch?.[0];
  const bookingCode = bkMatch?.[0];

  if (!hasHtml) {
    return {
      cleanPreview: rawMessage.trim(),
      invoiceNumber,
      bookingCode,
      totalPaid: invoiceNumber ? rawMessage.match(/\bTotal(?: paid| dibayar)?:[ \t]*([A-Z]{3}[ \t]+\d+(?:[.,]\d+)*)/i)?.[1] : undefined,
      hasHtml: false,
    };
  }

  // Extract key invoice details from HTML string
  let hotelName: string | undefined;
  let roomType: string | undefined;
  let stayDates: string | undefined;
  let totalPaid: string | undefined;

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

  // Keep paragraphs readable when a notification uses a legacy email template.
  let cleanText = rawMessage
    .replace(/<(head|style|script)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<table\b[^>]*>[\s\S]*?<\/table>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\r?\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
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
