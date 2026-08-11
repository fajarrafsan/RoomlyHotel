import React from 'react';

export const InvoiceSkeleton: React.FC = () => (
  <div className="space-y-3" aria-busy="true" aria-label="Loading invoice details">
    <div className="flex items-center justify-between">
      <span className="w-36 h-3 rounded-full bg-slate-100 animate-pulse" />
      <span className="w-16 h-5 rounded-full bg-slate-100 animate-pulse" />
    </div>

    <div className="rounded-2xl border border-slate-100 divide-y divide-slate-50 overflow-hidden">
      {[0, 1, 2].map((i) => (
        <div key={i} className="px-4 py-3 flex items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="block w-28 h-2.5 rounded-full bg-slate-100 animate-pulse" />
            <span className="block w-36 h-2 rounded-full bg-slate-100 animate-pulse" />
          </div>
          <span className="w-16 h-3 rounded-full bg-slate-100 animate-pulse" />
        </div>
      ))}
      <div className="px-4 py-3 bg-slate-50/60 flex items-center justify-between">
        <span className="w-14 h-3 rounded-full bg-slate-200 animate-pulse" />
        <span className="w-20 h-4 rounded-lg bg-slate-200 animate-pulse" />
      </div>
    </div>

    <div className="flex items-center justify-between px-1">
      <span className="w-24 h-2.5 rounded-full bg-slate-100 animate-pulse" />
      <span className="w-28 h-2.5 rounded-full bg-slate-100 animate-pulse" />
    </div>
  </div>
);
