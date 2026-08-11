import React from 'react';

export const RoomDetailPageSkeleton: React.FC = () => (
  <div className="max-w-7xl mx-auto pb-20 px-4 sm:px-6 lg:px-8" aria-busy="true" aria-label="Loading room detail">
    {/* Back Navigation */}
    <nav className="py-6">
      <div className="flex items-center gap-2.5">
        <span className="w-8 h-8 rounded-full bg-slate-100 animate-pulse" />
        <span className="w-16 h-3 rounded-full bg-slate-100 animate-pulse" />
      </div>
    </nav>

    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
      {/* ===== LEFT: Content (8 cols) ===== */}
      <div className="lg:col-span-8 space-y-12">
        {/* Gallery */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="relative aspect-[16/10] rounded-3xl bg-slate-100 animate-pulse lg:col-span-8 overflow-hidden">
            <span className="absolute bottom-3 right-3 w-12 h-6 rounded-lg bg-slate-200/80" />
          </div>
          <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 lg:grid-rows-2 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="min-h-[96px] lg:h-full rounded-3xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        </div>

        {/* Title & Meta */}
        <div className="space-y-5 border-b border-slate-100 pb-8">
          <div className="flex items-start gap-3 flex-wrap">
            <span className="w-72 h-8 rounded-lg bg-slate-100 animate-pulse" />
            <span className="mt-1 w-20 h-7 rounded-full bg-slate-100 animate-pulse" />
          </div>
          <span className="block w-40 h-3 rounded-full bg-slate-100 animate-pulse" />
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-1">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="flex items-center gap-2">
                <span className="w-9 h-9 rounded-xl bg-slate-100 animate-pulse" />
                <span className="w-16 h-3 rounded-full bg-slate-100 animate-pulse" />
              </span>
            ))}
          </div>
          <div className="space-y-2 pt-1">
            <span className="block w-full max-w-2xl h-3 rounded-full bg-slate-100 animate-pulse" />
            <span className="block w-3/4 max-w-xl h-3 rounded-full bg-slate-100 animate-pulse" />
          </div>
        </div>

        {/* Detail grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-slate-100 animate-pulse shrink-0" />
                <span className="w-32 h-3 rounded-full bg-slate-100 animate-pulse" />
              </div>
              <div className="space-y-2.5 pl-[42px]">
                <span className="block w-full h-2.5 rounded-full bg-slate-100 animate-pulse" />
                <span className="block w-3/4 h-2.5 rounded-full bg-slate-100 animate-pulse" />
                <span className="block w-5/6 h-2.5 rounded-full bg-slate-100 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== RIGHT: Sticky booking card (4 cols) ===== */}
      <div className="lg:col-span-4">
        <div className="sticky top-28 space-y-4">
          <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-[0_12px_48px_rgba(15,23,42,0.08)] space-y-5">
            <span className="block w-28 h-3 rounded-full bg-slate-100 animate-pulse" />
            <span className="block w-44 h-9 rounded-lg bg-slate-100 animate-pulse" />
            <span className="block w-24 h-7 rounded-full bg-slate-100 animate-pulse" />
            <span className="block w-full h-14 rounded-2xl bg-slate-100 animate-pulse" />
          </div>
          <div className="p-5 rounded-3xl bg-slate-50/70 border border-slate-100 space-y-3">
            {[0, 1, 2].map((i) => (
              <span key={i} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-slate-100 animate-pulse shrink-0" />
                <span className="w-40 h-3 rounded-full bg-slate-100 animate-pulse" />
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);
