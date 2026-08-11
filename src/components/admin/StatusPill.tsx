import React from 'react';

/**
 * Colour map for every backend status enum the admin console renders —
 * payment, invoice, booking, cancellation and review statuses all share it.
 * Unknown values fall back to neutral slate rather than rendering unstyled.
 */
const TONE: Record<string, string> = {
  // success / settled
  PAID: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  ISSUED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  CONFIRMED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  CHECKED_IN: 'bg-teal-50 text-teal-700 border-teal-100',
  CHECKED_OUT: 'bg-slate-100 text-slate-600 border-slate-200',

  // in-flight
  PENDING: 'bg-amber-50 text-amber-700 border-amber-100',
  WAITING_PAYMENT: 'bg-amber-50 text-amber-700 border-amber-100',
  PROCESSING: 'bg-amber-50 text-amber-700 border-amber-100',
  DRAFT: 'bg-slate-50 text-slate-500 border-slate-200',

  // terminal / negative
  FAILED: 'bg-rose-50 text-rose-700 border-rose-100',
  EXPIRED: 'bg-rose-50 text-rose-700 border-rose-100',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-100',
  REJECTED: 'bg-rose-50 text-rose-700 border-rose-100',
  NO_SHOW: 'bg-rose-50 text-rose-700 border-rose-100',
  VOID: 'bg-rose-50 text-rose-700 border-rose-100',
  HIDDEN: 'bg-slate-200 text-slate-600 border-slate-300',
  INACTIVE: 'bg-slate-200 text-slate-600 border-slate-300',

  // money-back
  REFUNDED: 'bg-violet-50 text-violet-700 border-violet-100',
  REFUND_PENDING: 'bg-violet-50 text-violet-600 border-violet-100',
};

export const StatusPill: React.FC<{ status?: string | null }> = ({ status }) => {
  if (!status) return <span className="text-slate-300">—</span>;

  const tone = TONE[status.toUpperCase()] ?? 'bg-slate-100 text-slate-600 border-slate-200';
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${tone}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
};
