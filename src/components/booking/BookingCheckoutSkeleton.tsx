const pulse = 'bg-slate-200/80 motion-safe:animate-pulse';

export function BookingCheckoutSkeleton({ isID, message }: { isID: boolean; message?: string }) {
  const status = message ?? (isID ? 'Memuat reservasi' : 'Loading reservation');
  return (
    <div className="booking-checkout mx-auto max-w-[1280px] pb-5 lg:pb-12" role="status" aria-busy="true" aria-label={status} data-checkout-skeleton>
      <div className="mb-4 sm:mb-6">
        <div className="mb-1 flex min-h-11 items-center sm:mb-2"><span className={`${pulse} h-4 w-24 rounded-full`} /></div>
        <div className={`${pulse} h-[clamp(2.2rem,4.4vw,3.575rem)] w-64 max-w-full rounded-xl sm:w-80`} />
        {message && <p className="sr-only">{message}</p>}
      </div>

      <div className="grid items-start gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_338px] lg:gap-7 xl:grid-cols-[minmax(0,1fr)_360px]" aria-hidden>
        <div className="flex items-center gap-3 overflow-hidden rounded-[22px] border border-slate-200 bg-white p-2.5 lg:col-start-2 lg:row-start-1 lg:block lg:rounded-[24px] lg:p-0">
          <div className={`${pulse} size-[62px] shrink-0 rounded-xl lg:aspect-video lg:h-auto lg:w-full lg:rounded-none`} />
          <div className="min-w-0 flex-1 space-y-2 lg:p-5 xl:px-6">
            <div className={`${pulse} h-5 w-40 max-w-full rounded-full lg:h-7 lg:w-52`} />
            <div className={`${pulse} h-3 w-32 max-w-full rounded-full`} />
            <div className={`${pulse} h-3 w-24 max-w-full rounded-full lg:h-4 lg:w-36`} />
            <div className={`${pulse} mt-4 hidden h-24 w-full rounded-xl lg:block`} />
          </div>
          <div className="hidden space-y-2 bg-navy-dark px-5 py-4 lg:block xl:px-6">
            <div className="h-3 w-28 rounded-full bg-white/25 motion-safe:animate-pulse" />
            <div className="h-7 w-40 rounded-lg bg-white/25 motion-safe:animate-pulse" />
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white lg:col-start-1 lg:row-start-1">
          <div className="grid grid-cols-3 gap-1 rounded-t-[24px] border-b border-slate-200 bg-slate-50 p-2.5 sm:gap-2 sm:px-5 sm:py-3">
            {[1, 2, 3].map(step => (
              <div key={step} className="flex min-h-[58px] flex-col items-center justify-center gap-1.5 rounded-xl sm:min-h-12 sm:flex-row">
                <span className={`${pulse} size-6 shrink-0 rounded-full sm:size-7`} />
                <span className={`${pulse} h-3 w-3/5 max-w-24 rounded-full`} />
              </div>
            ))}
          </div>
          <div className="space-y-4 p-3.5 sm:space-y-5 sm:p-6 lg:p-7">
            <div>
              <div className={`${pulse} h-7 w-56 max-w-full rounded-lg sm:h-9`} />
              <div className={`${pulse} mt-2 h-4 w-60 max-w-full rounded-full`} />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className={`${pulse} h-[57px] rounded-xl sm:h-[65px]`} />
              <div className={`${pulse} h-[57px] rounded-xl sm:h-[65px]`} />
            </div>
            <div className={`${pulse} h-[295px] rounded-2xl sm:h-[338px]`} />
          </div>
        </div>
      </div>
    </div>
  );
}
