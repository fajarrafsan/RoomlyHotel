import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface RoomGalleryProps {
  gallery: string[];
  roomName: string;
  activeImage: number;
  onSelect: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
  isID: boolean;
}

export const RoomGallery: React.FC<RoomGalleryProps> = ({
  gallery, roomName, activeImage, onSelect, onPrev, onNext, isID,
}) => {
  const hasSideThumbs = gallery.length > 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
      <div className={`relative aspect-[16/10] rounded-3xl overflow-hidden bg-slate-100 ring-1 ring-slate-100 group ${hasSideThumbs ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
        <motion.img
          key={activeImage}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          src={gallery[activeImage]}
          alt={roomName}
          className="w-full h-full object-cover"
        />

        {gallery.length > 1 && (
          <>
            <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-3">
              <button
                type="button"
                onClick={onPrev}
                className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                aria-label={isID ? 'Foto sebelumnya' : 'Previous photo'}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onNext}
                className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                aria-label={isID ? 'Foto berikutnya' : 'Next photo'}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-slate-900/70 backdrop-blur-sm text-white text-[11px] font-semibold">
              {activeImage + 1} / {gallery.length}
            </span>
          </>
        )}
      </div>

      {hasSideThumbs && (
        <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 lg:grid-rows-2 gap-3">
          {gallery.slice(0, 4).map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelect(idx)}
              className={`relative min-h-[96px] lg:h-full rounded-3xl overflow-hidden bg-slate-100 transition-all duration-200 ${
                idx === activeImage
                  ? 'ring-2 ring-amber-400 ring-offset-2'
                  : 'opacity-75 hover:opacity-100'
              }`}
            >
              <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
