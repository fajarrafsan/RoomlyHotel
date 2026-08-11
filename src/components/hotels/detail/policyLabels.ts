import { RoomPolicy } from '../../../types';

// Backend enum → human label. Keys mirror hotel-service's FacilityCategory and
// room-service's RoomPolicyType exactly, so an unmapped value falls back to itself.
export const FACILITY_CATEGORY_LABELS: Record<string, { id: string; en: string }> = {
  GENERAL: { id: 'Umum', en: 'General' },
  INTERNET: { id: 'Internet', en: 'Internet' },
  FOOD: { id: 'Makanan & Minuman', en: 'Food & Drink' },
  DINING: { id: 'Restoran', en: 'Dining' },
  FITNESS: { id: 'Kebugaran', en: 'Fitness' },
  WELLNESS: { id: 'Spa & Wellness', en: 'Spa & Wellness' },
  RECREATION: { id: 'Rekreasi', en: 'Recreation' },
  BUSINESS: { id: 'Bisnis', en: 'Business' },
  TRANSPORTATION: { id: 'Transportasi', en: 'Transportation' },
  ACCESSIBILITY: { id: 'Aksesibilitas', en: 'Accessibility' },
  FAMILY: { id: 'Keluarga', en: 'Family' },
  SECURITY: { id: 'Keamanan', en: 'Security' }
};

export const POLICY_TYPE_LABELS: Record<string, { id: string; en: string }> = {
  CHECK_IN: { id: 'Check-In', en: 'Check-In' },
  CHECK_OUT: { id: 'Check-Out', en: 'Check-Out' },
  BREAKFAST: { id: 'Sarapan', en: 'Breakfast' },
  EXTRA_BED: { id: 'Tempat Tidur Tambahan', en: 'Extra Bed' },
  REFUND: { id: 'Pembatalan & Refund', en: 'Cancellation & Refund' },
  SMOKING: { id: 'Merokok', en: 'Smoking' },
  PET: { id: 'Hewan Peliharaan', en: 'Pets' },
  CHILD: { id: 'Kebijakan Anak', en: 'Children' },
  GENERAL: { id: 'Umum', en: 'General' }
};

export const label = (map: Record<string, { id: string; en: string }>, key: string, isID: boolean) =>
  map[key] ? (isID ? map[key].id : map[key].en) : key;

/** "15:00:00" → "15:00" */
export const formatTime = (t?: string) => (t ? t.slice(0, 5) : null);

/** Turns a REFUND policy's raw fields into the concrete terms a guest cares about. */
export const refundTerms = (p: RoomPolicy, isID: boolean): string => {
  if (p.isRefundable === false) return isID ? 'Tidak dapat direfund' : 'Non-refundable';
  const parts: string[] = [];
  if (p.freeCancelDays) {
    parts.push(isID ? `Gratis batal hingga H-${p.freeCancelDays}` : `Free cancellation up to ${p.freeCancelDays} day(s) before`);
  }
  if (p.feeType === 'PERCENT' && p.feeValue != null) {
    parts.push(isID ? `setelah itu denda ${p.feeValue}%` : `then a ${p.feeValue}% fee`);
  } else if (p.feeType === 'FULL') {
    parts.push(isID ? 'setelah itu dana hangus' : 'then non-refundable');
  } else if (p.feeType === 'FIRST_NIGHT') {
    parts.push(isID ? 'setelah itu denda 1 malam' : 'then a 1-night fee');
  }
  return parts.join(', ');
};
