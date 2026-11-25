import React from 'react';
import { RoomDetailGridSkeleton } from './RoomDetailGrid';

const pulse = 'animate-pulse bg-slate-200/80 motion-reduce:animate-none';

export const RoomDetailPageSkeleton: React.FC<{ isID: boolean }> = ({ isID }) => (
  <div className="room-detail-page mx-auto max-w-[1280px] pb-10" aria-busy="true" aria-label={isID ? 'Memuat detail kamar' : 'Loading room detail'}>
    <div className="mb-5 sm:mb-7">
      <div className="mb-2 flex min-h-11 items-center sm:mb-3"><span className={`${pulse} h-4 w-20 rounded-full`} /></div>
      <span className={`${pulse} block h-[clamp(2.2rem,5.39vw,4.07rem)] w-80 max-w-full rounded-xl sm:w-[420px]`} />
      <span className={`${pulse} mt-2.5 block h-5 w-60 max-w-full rounded-full sm:mt-3 sm:w-80`} />
    </div>

    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-7 xl:grid-cols-[minmax(0,1fr)_350px] xl:gap-9">
      <div className="min-w-0 space-y-5 sm:space-y-6">
        <div className="grid aspect-[4/3] gap-2 overflow-hidden rounded-[22px] sm:aspect-video sm:rounded-[26px] lg:aspect-[2/1] lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <span className={pulse} />
          <span className={`${pulse} hidden lg:block`} />
        </div>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="space-y-2 bg-white px-3 py-3.5 sm:px-4 sm:py-4">
              <span className={`${pulse} block h-3.5 w-3/4 rounded-full`} />
              <span className={`${pulse} block h-4 w-1/2 rounded-full`} />
            </div>
          ))}
        </div>
        <RoomDetailGridSkeleton isID={isID} />
      </div>

      <div className="hidden overflow-hidden rounded-[24px] border border-slate-200 bg-white lg:block">
        <div className="bg-[#172953] p-5 xl:px-6 motion-safe:animate-pulse">
          <span className="block h-4 w-32 rounded-full bg-white/25" />
          <span className="mt-2.5 block h-9 w-52 rounded-xl bg-white/25" />
        </div>
        <div className="space-y-4 p-5 xl:p-6">
          <span className={`${pulse} block h-7 w-3/4 rounded-full`} />
          <span className="block h-12 w-full rounded-xl bg-gold-soft motion-safe:animate-pulse" />
          <span className={`${pulse} block h-3.5 w-4/5 rounded-full`} />
          <span className={`${pulse} block h-3.5 w-1/2 rounded-full`} />
        </div>
      </div>
    </div>
  </div>
);
