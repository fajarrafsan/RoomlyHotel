import React from 'react';
import { X } from 'lucide-react';

interface HotelDetailModalSkeletonProps {
  onClose: () => void;
  isID: boolean;
}

export const HotelDetailModalSkeleton: React.FC<HotelDetailModalSkeletonProps> = ({ onClose, isID }) => (
  <div
    className="flex flex-col h-full"
    aria-busy="true"
    aria-label={isID ? 'Memuat detail hotel' : 'Loading hotel detail'}
  >
    {/* Gallery skeleton */}
    <div className="relative h-64 sm:h-80 bg-slate-100 animate-pulse shrink-0">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center text-slate-700 hover:bg-white transition-colors"
        aria-label={isID ? 'Tutup' : 'Close'}
      >
        <X className="w-5 h-5" />
      </button>
      <span className="absolute top-4 left-4 w-20 h-7 rounded-full bg-slate-200/70" />
      <span className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className="w-2 h-2 rounded-full bg-slate-200/70" />
        ))}
      </span>
    </div>

    {/* Quick stats skeleton */}
    <div className="flex items-center gap-6 px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-slate-100 animate-pulse shrink-0" />
          <span className="w-20 h-3 rounded-full bg-slate-100 animate-pulse" />
        </span>
      ))}
    </div>

    {/* Tabs skeleton */}
    <div className="flex items-center px-6 border-b border-slate-100 bg-white shrink-0">
      {[0, 1, 2].map((i) => (
        <span key={i} className="py-4 mr-8 w-16 h-4 rounded bg-slate-100 animate-pulse" />
      ))}
    </div>

    {/* Room cards skeleton */}
    <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-8 bg-white">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <span className="block w-40 h-5 rounded bg-slate-100 animate-pulse" />
          <span className="block w-52 h-3 rounded bg-slate-100 animate-pulse" />
        </div>
        <span className="w-24 h-6 rounded-full bg-slate-100 animate-pulse" />
      </div>

      {[0, 1].map((idx) => (
        <div key={idx} className="rounded-2xl border border-slate-100 overflow-hidden">
          <div className="flex flex-col sm:flex-row">
            <div className="w-full sm:w-56 h-48 sm:h-auto shrink-0 bg-slate-100 animate-pulse" />
            <div className="flex-1 p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <span className="block w-44 h-4 rounded bg-slate-100 animate-pulse" />
                  <span className="block w-64 h-3 rounded bg-slate-100 animate-pulse" />
                  <span className="block w-48 h-3 rounded bg-slate-100 animate-pulse" />
                </div>
                <span className="w-16 h-6 rounded-lg bg-slate-100 animate-pulse shrink-0" />
              </div>
              <span className="block w-3/4 h-3 rounded bg-slate-100 animate-pulse" />
              <div className="space-y-2 pt-1">
                {[0, 1, 2].map((l) => (
                  <div key={l} className="flex gap-2.5">
                    <span className="w-32 h-3 rounded bg-slate-100 animate-pulse shrink-0" />
                    <span className="flex-1 h-3 rounded bg-slate-100 animate-pulse" />
                  </div>
                ))}
              </div>
              <div className="flex items-end justify-between pt-4 mt-2 border-t border-slate-50">
                <div className="space-y-2">
                  <span className="block w-24 h-4 rounded bg-slate-100 animate-pulse" />
                  <span className="block w-16 h-3 rounded bg-slate-100 animate-pulse" />
                </div>
                <span className="w-28 h-10 rounded-xl bg-slate-100 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);
