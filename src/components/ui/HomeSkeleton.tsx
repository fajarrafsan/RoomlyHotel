import React from 'react';

const pulse = 'animate-pulse bg-slate-200';

const HotelCardSkeleton: React.FC = () => (
  <div className="flex flex-col">
    <div className={`${pulse} aspect-[4/3] rounded-2xl`} />
    <div className="mt-4 px-0.5 space-y-2">
      <div className={`${pulse} h-3 w-24 rounded-full`} />
      <div className={`${pulse} h-4 w-3/4 rounded-full`} />
      <div className={`${pulse} h-3 w-1/2 rounded-full`} />
      <div className={`${pulse} h-8 w-full mt-2 rounded-xl`} />
    </div>
  </div>
);

export const HomeSkeleton: React.FC = () => (
  <div className="space-y-20 pb-20">
    {/* Hero skeleton */}
    <div className="relative -mt-6 -mx-4 sm:-mx-6 lg:-mx-8 min-h-[480px] overflow-hidden bg-slate-100">
      <div className={`${pulse} absolute inset-0`} />
      <div className="relative z-10 max-w-[1400px] mx-auto w-full px-4 sm:px-8 lg:px-12 pt-24 pb-32 space-y-6">
        <div className="mx-auto w-56 h-6 rounded-full bg-white/70 animate-pulse" />
        <div className="mx-auto w-3/4 max-w-xl h-12 rounded-xl bg-white/60 animate-pulse" />
        <div className="mx-auto w-2/3 max-w-md h-4 rounded-full bg-white/40 animate-pulse" />
        <div className="mt-12 h-20 rounded-3xl bg-white/60 animate-pulse max-w-5xl mx-auto" />
      </div>
    </div>

    <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 space-y-12">
      {/* Section header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-6 w-48 rounded-xl bg-slate-200 animate-pulse" />
        <div className="h-4 w-24 rounded-full bg-slate-200 animate-pulse" />
      </div>

      {/* Hotel cards grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <HotelCardSkeleton key={i} />
        ))}
      </div>
    </div>
  </div>
);
