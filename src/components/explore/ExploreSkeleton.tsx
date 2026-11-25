import React from 'react';

const pulse = 'animate-pulse bg-slate-200/80 motion-reduce:animate-none';
const photoPulse = 'animate-pulse bg-white/15 motion-reduce:animate-none';

/** Mirrors ExplorePage's spacing so the page doesn't jump when the catalog arrives. */
export const ExploreSkeleton: React.FC<{ isID?: boolean }> = ({ isID = true }) => (
  <div className="explore-page -mx-4 -mt-6 min-h-screen bg-slate-50 pb-10 sm:-mx-6 lg:-mx-8" role="status" aria-busy="true" aria-label={isID ? 'Memuat pilihan penginapan' : 'Loading places to stay'} data-explore-skeleton>
    <div className="overflow-hidden rounded-b-[28px] bg-[#0f2340] sm:rounded-b-[36px]" aria-hidden>
      <div className="mx-auto flex max-w-[1480px] items-end justify-between gap-10 px-5 pb-[84px] pt-7 sm:px-8 sm:pb-[88px] sm:pt-9 lg:px-12 lg:pb-[92px] lg:pt-10 lg:short:pb-[84px] lg:short:pt-6">
        <div className="min-w-0 max-w-[680px] flex-1">
          <div className={`${photoPulse} mb-3 h-4 w-40 rounded-full`} />
          <div className={`${photoPulse} mb-2 h-[33px] w-4/5 max-w-[400px] rounded-xl sm:mb-2.5 sm:h-10 lg:mb-3 lg:h-[46px]`} />
          <div className={`${photoPulse} h-[33px] w-full max-w-[460px] rounded-xl sm:h-10 lg:h-[46px]`} />
          <div className={`${photoPulse} mt-3 hidden h-6 w-full max-w-[430px] rounded-full sm:block lg:short:hidden`} />
          <div className="mt-4 flex gap-2 overflow-hidden">
            {Array.from({ length: 5 }, (_, index) => <div key={index} className={`${photoPulse} h-11 w-24 shrink-0 rounded-full`} />)}
          </div>
        </div>
        <div className={`${photoPulse} hidden h-[108px] w-[320px] shrink-0 rounded-2xl lg:block`} />
      </div>
    </div>

    <div className="relative z-10 mx-4 -mt-[60px] rounded-[22px] border border-[#e7e5df] bg-white p-3 shadow-[0_16px_48px_rgba(12,31,59,0.12)] sm:mx-8 sm:-mt-[58px] sm:rounded-[26px] sm:p-4 lg:mx-auto lg:-mt-[64px] lg:w-[calc(100%_-_6rem)] lg:max-w-[1384px] lg:px-7 lg:py-[18px]" aria-hidden>
      <div className="grid items-end gap-3 md:grid-cols-[1.15fr_1fr_auto] md:gap-5">
        <div className={`${pulse} h-12 min-w-0 rounded-xl md:h-[72px]`} />
        <div className={`${pulse} h-12 min-w-0 rounded-xl md:h-[72px]`} />
        <div className={`${pulse} h-12 rounded-xl md:h-14 md:w-[208px]`} />
      </div>
    </div>

    <div className="mx-auto mt-7 max-w-[1480px] px-4 sm:mt-9 sm:px-8 lg:px-12" aria-hidden>
      <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[272px_minmax(0,1fr)] xl:gap-8">
        <div className="hidden max-h-[calc(100dvh-104px)] min-w-0 overflow-hidden rounded-[26px] border border-slate-200/80 bg-white px-5 pb-5 xl:block">
          <div className="flex h-[62px] items-center"><div className={`${pulse} h-6 w-2/3 rounded-lg`} /></div>
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="space-y-3 border-t border-slate-100 py-[18px]">
              <div className={`${pulse} h-4 w-1/2 rounded-full`} />
              <div className={`${pulse} h-12 w-full rounded-xl`} />
              {index === 0 && <div className={`${pulse} h-11 w-full rounded-full`} />}
            </div>
          ))}
        </div>

        <div className="min-w-0">
          <div className={`${pulse} h-9 w-3/5 max-w-[420px] rounded-xl`} />
          <div className={`${pulse} mt-1 h-5 w-1/2 max-w-[260px] rounded-full lg:hidden`} />
          <div className="mt-3.5 flex flex-col gap-3 lg:mt-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-2 overflow-hidden max-lg:order-2">
              {Array.from({ length: 4 }, (_, index) => <div key={index} className={`${pulse} h-12 w-[104px] shrink-0 rounded-full`} />)}
            </div>
            <div className={`${pulse} h-12 w-full rounded-full max-lg:order-1 lg:w-[300px]`} />
          </div>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="min-w-0 rounded-[22px] border border-slate-200/80 bg-white p-2 sm:rounded-[26px]">
                <div className={`${pulse} aspect-[4/3] rounded-[16px] sm:rounded-[19px]`} />
                <div className="space-y-2.5 px-2 pb-2 pt-3 sm:px-3 sm:pb-2.5 sm:pt-3.5">
                  <div className={`${pulse} h-4 w-3/5 rounded-full`} />
                  <div className={`${pulse} h-6 w-4/5 rounded-lg`} />
                  <div className={`${pulse} !mt-5 h-4 w-1/2 rounded-full`} />
                  <div className={`${pulse} h-3.5 w-2/3 rounded-full`} />
                  <div className="!mt-3.5 flex items-end justify-between border-t border-slate-100 pt-3">
                    <div className={`${pulse} h-8 w-3/5 rounded-lg`} />
                    <div className={`${pulse} size-10 rounded-full`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);
