import React from 'react';
import { motion } from 'motion/react';
import { AlertCircle, RotateCw, type LucideIcon } from 'lucide-react';

interface AdminPageShellProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  /** Endpoint this screen reads, shown as a hint so the data source is never a mystery. */
  endpoint: string;
  isID: boolean;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  /** Filter controls rendered in the toolbar row. */
  filters?: React.ReactNode;
  children: React.ReactNode;
}

export const AdminPageShell: React.FC<AdminPageShellProps> = ({
  icon: Icon,
  title,
  subtitle,
  endpoint,
  isID,
  loading = false,
  error = null,
  onRefresh,
  filters,
  children,
}) => (
  <div className="space-y-6 pb-20 max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 2xl:px-16 text-slate-800">
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl bg-white p-4 sm:p-8 border border-slate-100 shadow-sm space-y-5 sm:space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-5">
        <div className="flex items-start gap-3 sm:gap-4 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 space-y-1">
            <h1 className="text-lg sm:text-2xl font-semibold tracking-tight text-slate-900 leading-snug">{title}</h1>
            <p className="text-[11px] sm:text-xs text-slate-400 font-light leading-relaxed">{subtitle}</p>
            <code className="inline-block text-[9px] sm:text-[10px] text-slate-400 bg-slate-50 border border-slate-100 rounded-md px-1.5 py-0.5 font-mono break-all sm:break-normal">
              {endpoint}
            </code>
          </div>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="w-full md:w-auto py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold transition-all inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 shrink-0"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{isID ? 'Muat Ulang' : 'Refresh'}</span>
          </button>
        )}
      </div>

      {filters && <div className="pt-1 flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 -mx-2 px-2 sm:mx-0 sm:px-0">{filters}</div>}
    </motion.div>

    {error && (
      <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
        <AlertCircle className="w-4 h-4 shrink-0" />
        {error}
      </div>
    )}

    {children}
  </div>
);

/** Segmented status filter used by the payments / bookings / invoices screens. */
export const AdminFilterChips: React.FC<{
  options: { value: string; label: string }[];
  active: string;
  onChange: (value: string) => void;
}> = ({ options, active, onChange }) => (
  <>
    {options.map((opt) => (
      <button
        key={opt.value}
        onClick={() => onChange(opt.value)}
        className={`px-3 sm:px-3.5 py-1.5 rounded-full text-[10px] sm:text-[11px] font-semibold transition-all cursor-pointer border shrink-0 whitespace-nowrap ${
          active === opt.value
            ? 'bg-slate-900 text-white border-slate-900'
            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-800'
        }`}
      >
        {opt.label}
      </button>
    ))}
  </>
);

/** Consistent card wrapper for the data table on each admin screen. */
export const AdminTableCard: React.FC<{
  isID: boolean;
  loading: boolean;
  isEmpty: boolean;
  emptyLabel: string;
  children: React.ReactNode;
}> = ({ isID, loading, isEmpty, emptyLabel, children }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
    <div className="overflow-x-auto">
      {isEmpty ? (
        <p className="px-4 py-16 text-center text-xs text-slate-400 font-light">
          {loading ? (isID ? 'Memuat data...' : 'Loading data...') : emptyLabel}
        </p>
      ) : (
        children
      )}
    </div>
  </div>
);
