import React from 'react';

const pulse = 'animate-pulse bg-slate-200 motion-reduce:animate-none';
const photoPulse = 'animate-pulse bg-white/15 motion-reduce:animate-none';

const HotelCardSkeleton: React.FC = () => (
  <div className="min-w-0 rounded-[22px] border border-slate-200/80 bg-white p-2 sm:rounded-[26px]">
    <div className={`${pulse} aspect-[4/3] rounded-[16px] sm:aspect-[16/10] sm:rounded-[19px] lg:aspect-[16/9]`} />
    <div className="space-y-3 px-2 pb-2 pt-4 sm:px-3.5 sm:pb-3">
      <div className={`${pulse} h-6 w-3/4 rounded-lg`} />
      <div className={`${pulse} h-3 w-full rounded-full`} />
      <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <div className={`${pulse} h-3 w-1/2 rounded-full`} />
        <div className={`${pulse} size-8 shrink-0 rounded-full sm:size-9`} />
      </div>
    </div>
  </div>
);

export const HomeSkeleton: React.FC = () => (
  <div className="home-luxury pb-20" role="status" aria-label="Memuat halaman utama" aria-busy="true" data-home-skeleton>
    <div className="relative -mx-4 -mt-6 sm:-mx-6 lg:-mx-8" aria-hidden>
      <div className="relative h-[520px] overflow-hidden rounded-b-[28px] bg-[#10243a] sm:h-[560px] sm:rounded-b-[36px] lg:h-[590px] xl:h-[610px]">
        <div className="mx-auto flex max-w-[1000px] flex-col items-center px-5 pt-12 sm:px-8 sm:pt-14 lg:pt-16">
          <div className={`${photoPulse} mb-6 h-3 w-3/5 max-w-[260px] rounded-full`} />
          <div className={`${photoPulse} h-10 w-4/5 max-w-[650px] rounded-xl sm:h-16 lg:h-20`} />
          <div className={`${photoPulse} mt-3 h-10 w-full max-w-[720px] rounded-xl sm:h-16 lg:h-20`} />
          <div className="mt-6 w-full max-w-[540px] space-y-3">
            <div className={`${photoPulse} mx-auto h-3 w-full rounded-full`} />
            <div className={`${photoPulse} mx-auto h-3 w-4/5 rounded-full`} />
          </div>
          <div className="mt-6 flex w-full max-w-[320px] justify-center gap-2.5">
            {Array.from({ length: 3 }, (_, i) => <div key={i} className={`${photoPulse} h-11 min-w-0 flex-1 rounded-full`} />)}
          </div>
        </div>
        <div className="absolute inset-x-5 bottom-[88px] flex items-end justify-between gap-4 sm:inset-x-9 sm:bottom-[100px] lg:inset-x-14 lg:bottom-[108px]">
          <div className="min-w-0 flex-1 space-y-3">
            <div className={`${photoPulse} h-3 w-3/5 max-w-[180px] rounded-full`} />
            <div className={`${photoPulse} hidden h-2 w-2/5 max-w-[140px] rounded-full sm:block`} />
          </div>
          <div className="flex shrink-0 gap-2">
            {Array.from({ length: 3 }, (_, i) => <div key={i} className={`${photoPulse} h-8 w-7 rounded-md`} />)}
          </div>
        </div>
      </div>
      <div className="relative mx-auto -mt-14 max-w-[1280px] px-4 sm:-mt-16 sm:px-8 lg:px-10">
        <div className="rounded-[22px] border border-[#e7e5df] bg-white p-5 sm:rounded-[26px] sm:px-7 sm:py-5 lg:px-8">
          <div className="mb-4 border-b border-slate-100 pb-3.5">
            <div className={`${pulse} h-4 w-4/5 max-w-[300px] rounded-full`} />
          </div>
          <div className="grid items-center gap-4 md:grid-cols-[1.15fr_0.95fr_auto] md:gap-6">
            {[0, 1].map(i => <div key={i} className={`min-w-0 space-y-2 md:border-r md:border-slate-100 md:pr-6 ${i === 1 ? 'border-t border-slate-100 pt-3 md:border-t-0 md:pt-0' : ''}`}>
              <div className={`${pulse} h-3 w-24 rounded-full`} />
              <div className={`${pulse} h-12 w-full rounded-lg`} />
            </div>)}
            <div className={`${pulse} h-14 w-full rounded-xl md:w-[200px]`} />
          </div>
          <div className={`${pulse} mt-3 h-3 w-5/6 max-w-[380px] rounded-full`} />
        </div>
      </div>
    </div>

    <div className="mx-auto mt-8 max-w-[1360px] px-4 sm:mt-10 sm:px-8 lg:px-12" aria-hidden>
      <div className="grid grid-cols-2 overflow-hidden rounded-[24px] border border-[#e8e1d5] bg-[#fffdf9] md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={`flex min-w-0 flex-col items-center gap-3 border-[#e8e1d5] px-3 py-5 sm:px-5 sm:py-6 ${i < 2 ? 'border-b md:border-b-0' : ''} ${i % 2 === 0 ? 'border-r' : ''} ${i === 1 ? 'md:border-r' : ''}`}>
            <div className={`${pulse} h-8 w-12 rounded-lg`} />
            <div className={`${pulse} h-3 w-4/5 max-w-[130px] rounded-full`} />
          </div>
        ))}
      </div>
    </div>

    <div className="mx-auto mt-16 max-w-[1480px] space-y-7 px-4 sm:mt-20 sm:space-y-9 sm:px-8 lg:px-12" aria-hidden>
      <div className="flex min-w-0 items-end justify-between gap-6">
        <div className="min-w-0 flex-1 space-y-4">
          <div className={`${pulse} h-3 w-3/5 max-w-[260px] rounded-full`} />
          <div className={`${pulse} h-9 w-full max-w-[400px] rounded-xl`} />
          <div className={`${pulse} h-3 w-11/12 max-w-[500px] rounded-full`} />
        </div>
        <div className={`${pulse} hidden h-12 w-[180px] shrink-0 rounded-full sm:block`} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 lg:gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <HotelCardSkeleton key={i} />
        ))}
      </div>
    </div>
  </div>
);
