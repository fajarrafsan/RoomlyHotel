export function InvoiceSkeleton({ isID }: { isID: boolean }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5" role="status">
      <p className="text-sm font-semibold text-navy-dark">{isID ? 'Memuat rincian invoice…' : 'Loading invoice details…'}</p>
      <div className="mt-3 space-y-3 motion-safe:animate-pulse" aria-hidden>
        {[0, 1, 2].map(index => (
          <div key={index} className="flex items-center justify-between border-b border-slate-100 py-2">
            <span className="h-3 w-24 rounded-full bg-slate-100" />
            <span className="h-3 w-16 rounded-full bg-slate-100" />
          </div>
        ))}
        <div className="h-10 rounded-lg bg-navy-soft/55" />
      </div>
    </section>
  );
}
