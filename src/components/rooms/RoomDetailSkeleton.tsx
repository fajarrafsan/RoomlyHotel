import React from 'react';

export const RoomDetailPageSkeleton: React.FC = () => (
  <div className="room-detail-page max-w-7xl mx-auto pb-20" aria-busy="true" aria-label="Loading room detail">
    <nav className="py-5">
      <div className="flex items-center gap-2.5">
        <span className="w-11 h-11 rounded-full bg-navy-soft animate-pulse" />
        <span className="w-16 h-3 rounded-full bg-navy-soft animate-pulse" />
      </div>
    </nav>

    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
      <div className="lg:col-span-8 space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="relative aspect-[16/10] rounded-3xl bg-navy-soft animate-pulse lg:col-span-8 overflow-hidden" />
          <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 lg:grid-rows-2 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="min-h-[96px] lg:h-full rounded-2xl bg-navy-soft animate-pulse" />
            ))}
          </div>
        </div>

        <div className="space-y-4 border-b border-navy-soft pb-7">
          <span className="block w-40 h-3 rounded-full bg-navy-soft animate-pulse" />
          <span className="block w-72 h-8 rounded-lg bg-navy-soft animate-pulse" />
          <div className="flex flex-wrap gap-2">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="w-24 h-8 rounded-full bg-navy-soft animate-pulse" />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="p-5 rounded-2xl bg-white border border-navy-soft space-y-4">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-navy-soft animate-pulse shrink-0" />
                <span className="w-32 h-3 rounded-full bg-navy-soft animate-pulse" />
              </div>
              <div className="space-y-2.5 pl-[42px]">
                <span className="block w-full h-2.5 rounded-full bg-navy-soft animate-pulse" />
                <span className="block w-3/4 h-2.5 rounded-full bg-navy-soft animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="lg:col-span-4">
        <div className="sticky top-[5.25rem] sm:top-[6rem] space-y-4">
          <div className="p-6 rounded-3xl bg-white border border-navy-soft space-y-5">
            <span className="block w-28 h-3 rounded-full bg-navy-soft animate-pulse" />
            <span className="block w-44 h-9 rounded-lg bg-navy-soft animate-pulse" />
            <span className="block w-full h-12 rounded-xl bg-navy-soft animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  </div>
);
