import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star, MapPin, ChevronLeft, ChevronRight, Maximize2, Check, Share2, Heart } from 'lucide-react';
import { Hotel } from '../../../types';
import { StarRating } from './StarRating';

export const HotelGallery: React.FC<{
  hotel: Hotel;
  images: string[];
  isBestSeller: boolean;
  isID: boolean;
  isWishlisted: boolean;
  onToggleWishlist: (hotelId: string) => void;
  onClose: () => void;
}> = ({ hotel, images, isBestSeller, isID, isWishlisted, onToggleWishlist, onClose }) => {
  const [selectedImgIdx, setSelectedImgIdx] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Keyboard gallery nav
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!isGalleryOpen) return;
      if (e.key === 'ArrowRight') setSelectedImgIdx(p => Math.min(p + 1, images.length - 1));
      if (e.key === 'ArrowLeft') setSelectedImgIdx(p => Math.max(p - 1, 0));
      if (e.key === 'Escape') setIsGalleryOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isGalleryOpen, images.length]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <>
      {/* ===== HERO GALLERY ===== */}
      <div className="relative h-52 sm:h-64 w-full shrink-0 bg-slate-100 group">
        <motion.img
          key={selectedImgIdx}
          src={images[selectedImgIdx]}
          alt={hotel.name}
          initial={{ opacity: 0.8, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-950/10 to-transparent" />

        {/* Top Bar */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20">
          <div className="flex items-center gap-2">
            {isBestSeller && (
              <span className="px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md text-[10px] font-bold text-slate-900 shadow-sm uppercase tracking-wider flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {isID ? 'Terlaris' : 'Best Seller'}
              </span>
            )}
            <span className="px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md text-[10px] font-semibold text-slate-700 shadow-sm">
              {images.length} {isID ? 'foto' : 'photos'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <motion.button whileTap={{ scale: 0.9 }} onClick={handleShare}
              className="w-8 h-8 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center text-slate-700 hover:text-slate-900 shadow-sm transition-colors">
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => onToggleWishlist(hotel.id)}
              className={`w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center shadow-sm transition-colors ${
                isWishlisted ? 'bg-rose-500 text-white' : 'bg-white/95 text-slate-600 hover:text-rose-500'
              }`}>
              <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center text-slate-600 hover:text-slate-900 shadow-sm transition-colors">
              <X className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </div>

        {/* Bottom Info Overlay */}
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center gap-2 mb-1">
              <StarRating rating={hotel.stars} />
              <span className="text-white/80 text-[10px] font-medium">{hotel.category}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-white tracking-tight mb-0.5">
              {hotel.name}
            </h1>
            <div className="flex items-center gap-1.5 text-white/80">
              <MapPin className="w-3 h-3" />
              <span className="text-[12px] font-light truncate">{hotel.address}</span>
            </div>
          </motion.div>
        </div>

        {/* Gallery Nav Arrows */}
        {images.length > 1 && (
          <>
            <button onClick={() => setSelectedImgIdx(p => Math.max(0, p - 1))}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setSelectedImgIdx(p => Math.min(images.length - 1, p + 1))}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Expand Gallery */}
        <button onClick={() => setIsGalleryOpen(true)}
          className="absolute bottom-4 right-4 px-3 py-1.5 rounded-full bg-white/95 text-[11px] font-semibold text-slate-900 shadow-sm hover:bg-white transition-colors z-10 flex items-center gap-1">
          <Maximize2 className="w-3 h-3" />
          {isID ? 'Lihat Semua' : 'View All'}
        </button>

        {/* Thumbnail Strip */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 hidden sm:flex items-center gap-1.5 z-10">
          {images.slice(0, 5).map((img, idx) => (
            <button key={idx} onClick={() => setSelectedImgIdx(idx)}
              className={`w-10 h-7 rounded-md overflow-hidden border-2 transition-all ${
                selectedImgIdx === idx ? 'border-white shadow-md scale-105' : 'border-white/40 opacity-70 hover:opacity-100'
              }`}>
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
          {images.length > 5 && (
            <button onClick={() => setIsGalleryOpen(true)} className="w-10 h-7 rounded-md bg-slate-900/60 flex items-center justify-center text-white text-[10px] font-bold">
              +{images.length - 5}
            </button>
          )}
        </div>
      </div>

      {/* ===== FULLSCREEN GALLERY ===== */}
      <AnimatePresence>
        {isGalleryOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-slate-950 flex flex-col"
          >
            <div className="flex items-center justify-between p-4 text-white z-10">
              <span className="text-[13px] font-medium">{selectedImgIdx + 1} / {images.length}</span>
              <button onClick={() => setIsGalleryOpen(false)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center relative">
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedImgIdx}
                  src={images[selectedImgIdx]}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                  className="max-w-full max-h-full object-contain px-4"
                />
              </AnimatePresence>
              {images.length > 1 && (
                <>
                  <button onClick={() => setSelectedImgIdx(p => Math.max(0, p - 1))}
                    className="absolute left-4 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button onClick={() => setSelectedImgIdx(p => Math.min(images.length - 1, p + 1))}
                    className="absolute right-4 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>
            <div className="p-4 flex items-center justify-center gap-2 overflow-x-auto">
              {images.map((img, idx) => (
                <button key={idx} onClick={() => setSelectedImgIdx(idx)}
                  className={`shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImgIdx === idx ? 'border-white' : 'border-transparent opacity-50 hover:opacity-100'
                  }`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
