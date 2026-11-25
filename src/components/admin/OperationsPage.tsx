import { useId, type ReactNode } from 'react';
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Inbox, LoaderCircle, RotateCw, type LucideIcon } from 'lucide-react';
import type { Language } from '../../types';
import { AdminRowsSkeleton } from './AdminSkeleton';

export const operationPanel = 'min-w-0 rounded-[20px] border border-slate-200 bg-white shadow-sm';
export const operationButton = 'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold leading-tight transition-colors disabled:cursor-not-allowed disabled:opacity-60';
export const operationPrimary = operationButton + ' bg-navy-dark text-white hover:bg-navy';
export const operationSecondary = operationButton + ' border border-slate-200 bg-white text-navy-dark hover:bg-navy-soft';
export const operationDanger = operationButton + ' border border-rose-200 bg-white text-rose-800 hover:bg-rose-50';
export const operationField = 'min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-base text-slate-900 placeholder:text-slate-500 sm:text-sm';

export function operationDate(value: string | null, language: Language) {
  if (!value) return '—';
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? value + 'T12:00:00' : value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(language === 'ID' ? 'id-ID' : 'en-US', {
    day: 'numeric', month: 'short', year: 'numeric',
    ...(value.includes('T') ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date);
}

interface OperationsPageProps {
  icon: LucideIcon;
  title: string;
  description: string;
  image?: string;
  isID: boolean;
  loading: boolean;
  onRefresh: () => void;
  blocked?: boolean;
  action?: ReactNode;
  children: ReactNode;
}

export function OperationsPage({ icon: Icon, title, description, image, isID, loading, onRefresh, blocked, action, children }: OperationsPageProps) {
  return (
    <div className="operations-page mx-auto max-w-[1340px] space-y-4 pb-14 text-slate-800 sm:space-y-5">
      <header className="relative isolate overflow-hidden rounded-[24px] bg-[#101f3d] px-5 py-6 text-white sm:px-8 sm:py-8">
        {image && <picture aria-hidden className="pointer-events-none absolute inset-y-0 right-0 -z-20 hidden h-full w-[57%] [mask-image:linear-gradient(to_right,transparent,black_42%)] md:block">
          <source media="(min-width: 768px)" srcSet={image} />
          <img alt="" decoding="async" className="size-full object-cover object-[center_60%] opacity-60" />
        </picture>}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-[#101f3d] via-[#101f3d]/80 to-[#101f3d]/25" aria-hidden />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <span className="mb-2.5 inline-grid size-9 place-items-center rounded-xl border border-white/20 bg-white/10 text-gold-light"><Icon className="size-4" aria-hidden /></span>
            <h1 className="font-serif text-[clamp(1.9rem,4vw,2.8rem)] leading-tight tracking-tight">{title}</h1>
            <p className="mt-1.5 max-w-lg text-sm leading-6 text-slate-100">{description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 [&_button:focus-visible]:outline-offset-2">
            {action}
            <button type="button" disabled={loading || blocked} aria-busy={loading} onClick={onRefresh}
              aria-label={isID ? 'Muat ulang' : 'Refresh'} className={operationButton + ' min-w-11 border border-white/40 bg-[#15264b]/90 text-white hover:bg-navy'}>
              <RotateCw className={`size-4 ${loading ? 'motion-safe:animate-spin' : ''}`} aria-hidden />
              <span className={action ? 'hidden min-[380px]:inline' : undefined}>{isID ? 'Muat ulang' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}

export function OperationsPager({ page, totalPages, isID, disabled, onChange }: {
  page: number;
  totalPages: number;
  isID: boolean;
  disabled: boolean;
  onChange: (page: number) => void;
}) {
  if (totalPages < 2 && page === 0) return null;
  return (
    <nav aria-label={isID ? 'Navigasi halaman' : 'Pagination'} className="flex flex-wrap items-center justify-between gap-3">
      <span className="text-sm text-slate-600">{isID ? 'Halaman' : 'Page'} {page + 1} / {Math.max(1, totalPages)}</span>
      <div className="flex gap-2">
        <button type="button" disabled={disabled || page === 0} onClick={() => onChange(page - 1)}
          aria-label={isID ? 'Halaman sebelumnya' : 'Previous page'} className={operationSecondary}>
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <button type="button" disabled={disabled || page + 1 >= totalPages} onClick={() => onChange(page + 1)}
          aria-label={isID ? 'Halaman berikutnya' : 'Next page'} className={operationSecondary}>
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>
    </nav>
  );
}

export function OperationsNotice({ children, success = false }: { children: ReactNode; success?: boolean }) {
  const Icon = success ? CheckCircle2 : AlertCircle;
  return (
    <div role={success ? 'status' : 'alert'} className={`flex items-start gap-2.5 rounded-xl border p-3 text-sm leading-5 ${success ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden /><div className="min-w-0 break-words">{children}</div>
    </div>
  );
}

export function OperationsFilters({ label, items, value, onChange }: {
  label: string;
  items: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label={label}>
      {items.map(item => (
        <button key={item.value} type="button" aria-pressed={value === item.value} onClick={() => onChange(item.value)}
          className={`min-h-11 cursor-pointer rounded-lg border px-3 text-sm font-semibold transition-colors ${value === item.value ? 'border-navy bg-navy-dark text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-navy/30 hover:bg-navy-soft'}`}>
          {item.label}
        </button>
      ))}
    </div>
  );
}

export function OperationsTabs<Value extends string>({ label, items, value, onChange }: {
  label: string;
  items: { value: Value; label: string; icon: LucideIcon }[];
  value: Value;
  onChange: (value: Value) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-x-4 border-b border-slate-200 sm:gap-x-6">
      {items.map(({ value: item, label: itemLabel, icon: Icon }) => (
        <button key={item} type="button" aria-pressed={value === item} onClick={() => onChange(item)}
          className="relative -mb-px flex min-h-11 cursor-pointer items-center gap-2 border-b-2 border-transparent px-1 pb-1 text-left text-sm font-semibold text-slate-600 hover:text-navy-dark aria-pressed:border-[#a37120] aria-pressed:text-navy-dark sm:px-2">
          <Icon className="size-4 shrink-0" aria-hidden />{itemLabel}
        </button>
      ))}
    </div>
  );
}

export function OperationsEmpty({ loading, isID, empty }: { loading: boolean; isID: boolean; empty: string }) {
  return (
    <div className="px-5 py-10 text-center text-sm text-slate-600" role="status">
      {loading ? <LoaderCircle className="mx-auto mb-2 size-5 text-navy motion-safe:animate-spin" aria-hidden /> : <Inbox className="mx-auto mb-2 size-5 text-slate-500" aria-hidden />}
      {loading ? (isID ? 'Memuat data…' : 'Loading data…') : empty}
    </div>
  );
}

export interface OperationsColumn<Row> {
  label: string;
  render: (row: Row) => ReactNode;
}

export function OperationsList<Row extends { id: number }>({ title, description, rows, primary, columns, status, actions, loading, empty, isID, controls, footer }: {
  title: string;
  description?: string;
  rows: Row[];
  primary: OperationsColumn<Row>;
  columns: OperationsColumn<Row>[];
  status: (row: Row) => ReactNode;
  actions?: (row: Row) => ReactNode;
  loading: boolean;
  empty: string;
  isID: boolean;
  controls?: ReactNode;
  footer?: ReactNode;
}) {
  const titleId = useId();
  return (
    <section aria-labelledby={titleId} aria-busy={loading} className={operationPanel + ' overflow-hidden'}>
      <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3 border-b border-slate-200 p-4 sm:px-5">
        <div>
          <h2 id={titleId} className="text-lg font-semibold text-navy-dark">{title}</h2>
          {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
        </div>
        {controls}
      </div>
      {rows.length === 0 ? (loading
        ? <AdminRowsSkeleton isID={isID} columns={columns.length + 1 + Number(Boolean(actions))} />
        : <OperationsEmpty loading={false} isID={isID} empty={empty} />) : (
        <>
          <ul className="divide-y divide-slate-200 lg:hidden">
            {rows.map(row => (
              <li key={row.id} className="space-y-3 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0">{primary.render(row)}</div>{status(row)}</div>
                <dl className="grid grid-cols-2 gap-3">
                  {columns.map(column => <div key={column.label} className="min-w-0"><dt className="mb-0.5 text-xs text-slate-600">{column.label}</dt><dd className="break-words text-sm">{column.render(row)}</dd></div>)}
                </dl>
                {actions && <div className="flex flex-wrap gap-2">{actions(row)}</div>}
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[740px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th scope="col" className="px-4 py-3">{primary.label}</th>
                  {columns.map(column => <th key={column.label} scope="col" className="px-3 py-3">{column.label}</th>)}
                  <th scope="col" className="px-3 py-3">Status</th>
                  {actions && <th scope="col" className="px-4 py-3 text-right">{isID ? 'Aksi' : 'Actions'}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {rows.map(row => (
                  <tr key={row.id} className="hover:bg-slate-50/70">
                    <th scope="row" className="px-4 py-3 text-left font-normal">{primary.render(row)}</th>
                    {columns.map(column => <td key={column.label} className="break-words px-3 py-3 text-slate-700">{column.render(row)}</td>)}
                    <td className="px-3 py-3">{status(row)}</td>
                    {actions && <td className="px-4 py-3"><div className="flex flex-wrap justify-end gap-1.5">{actions(row)}</div></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {footer && <div className="border-t border-slate-200 px-4 py-3 sm:px-5">{footer}</div>}
    </section>
  );
}
