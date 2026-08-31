import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { applyImageFallback, ROOM_IMAGE_FALLBACK } from '../../lib/imageFallback';
import { fadeTween } from '../../lib/motion';

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

  useEffect(() => {
    if (gallery.length < 2) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gallery.length, onPrev, onNext]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
      <div className={`relative aspect-[16/10] rounded-3xl overflow-hidden bg-navy-soft border border-navy-soft group ${hasSideThumbs ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
        <motion.img
          key={activeImage}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={fadeTween}
          src={gallery[activeImage]}
          alt={roomName}
          onError={(event) => applyImageFallback(event, ROOM_IMAGE_FALLBACK)}
          className="w-full h-full object-cover"
        />

        {gallery.length > 1 && (
          <>
            <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-3">
              <button
                type="button"
                onClick={onPrev}
                className="min-w-11 min-h-11 rounded-full bg-white/95 shadow-sm flex items-center justify-center text-navy hover:bg-white transition-colors duration-200 cursor-pointer"
                aria-label={isID ? 'Foto sebelumnya' : 'Previous photo'}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onNext}
                className="min-w-11 min-h-11 rounded-full bg-white/95 shadow-sm flex items-center justify-center text-navy hover:bg-white transition-colors duration-200 cursor-pointer"
                aria-label={isID ? 'Foto berikutnya' : 'Next photo'}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-navy/80 text-white text-[11px] font-semibold">
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
              aria-label={isID ? `Foto ${idx + 1}` : `Photo ${idx + 1}`}
              aria-current={idx === activeImage}
              className={`relative min-h-[96px] min-w-11 lg:h-full rounded-2xl overflow-hidden bg-navy-soft transition-opacity duration-200 cursor-pointer ${
                idx === activeImage
                  ? 'ring-2 ring-gold ring-offset-2'
                  : 'opacity-75 hover:opacity-100'
              }`}
            >
              <img
                src={img}
                alt=""
                onError={(event) => applyImageFallback(event, ROOM_IMAGE_FALLBACK)}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
