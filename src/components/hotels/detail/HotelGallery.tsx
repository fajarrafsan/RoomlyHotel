import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star, MapPin, ChevronLeft, ChevronRight, Maximize2, Check, Share2, Heart } from 'lucide-react';
import { Hotel } from '../../../types';
import { StarRating } from './StarRating';
import { applyImageFallback } from '../../../lib/imageFallback';

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
      <div className="relative h-48 sm:h-52 w-full shrink-0 overflow-hidden bg-navy-soft group">
        <motion.img
          key={selectedImgIdx}
          src={images[selectedImgIdx]}
          alt={hotel.name}
          onError={applyImageFallback}
          initial={{ opacity: 0.8, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1B3A]/75 via-[#0B1B3A]/15 to-transparent" />

        {/* Top Bar */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20">
          <div className="flex items-center gap-2">
            {isBestSeller && (
              <span className="hidden lg:inline-flex px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md text-[10px] font-bold text-slate-900 shadow-sm uppercase tracking-wider items-center gap-1">
                <Star className="w-3 h-3 fill-gold text-gold" />
                {isID ? 'Terlaris' : 'Best Seller'}
              </span>
            )}
            <button type="button" onClick={() => setIsGalleryOpen(true)}
              aria-label={isID ? 'Lihat semua foto hotel' : 'View all hotel photos'}
              className="min-h-11 px-3 rounded-full bg-white/95 text-xs font-semibold text-navy shadow-sm hover:bg-white transition-colors duration-200 flex items-center gap-2 cursor-pointer">
              <Maximize2 className="w-3.5 h-3.5" aria-hidden />
              <span>{images.length} {isID ? 'foto' : 'photos'}</span>
              <span className="hidden sm:inline text-slate-500">· {isID ? 'Lihat semua' : 'View all'}</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <motion.button type="button" whileTap={{ scale: 0.95 }} onClick={handleShare}
              aria-label={copied ? (isID ? 'Tautan disalin' : 'Link copied') : (isID ? 'Bagikan' : 'Share')}
              className="w-11 h-11 rounded-full bg-white/95 flex items-center justify-center text-navy hover:bg-white shadow-sm transition-colors duration-200 cursor-pointer">
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            </motion.button>
            <motion.button type="button" whileTap={{ scale: 0.95 }} onClick={() => onToggleWishlist(hotel.id)}
              aria-pressed={isWishlisted}
              aria-label={isID ? (isWishlisted ? 'Hapus dari wishlist' : 'Simpan ke wishlist') : (isWishlisted ? 'Remove from wishlist' : 'Save to wishlist')}
              className={`w-11 h-11 rounded-full flex items-center justify-center shadow-sm transition-colors duration-200 cursor-pointer ${
                isWishlisted ? 'bg-rose-500 text-white' : 'bg-white/95 text-navy hover:bg-white'
              }`}>
              <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
            </motion.button>
            <motion.button type="button" whileTap={{ scale: 0.95 }} onClick={onClose}
              aria-label={isID ? 'Tutup' : 'Close'}
              className="w-11 h-11 rounded-full bg-white/95 flex items-center justify-center text-navy hover:bg-white shadow-sm transition-colors duration-200 cursor-pointer">
              <X className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Bottom Info Overlay */}
        <div className="absolute bottom-4 left-4 right-4 z-10 pointer-events-none">
          <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center gap-2 mb-1">
              <StarRating rating={hotel.stars} />
              <span className="text-white/80 text-[10px] font-medium">{hotel.category}</span>
            </div>
            <h1 id="hotel-detail-title" title={hotel.name} className="text-xl sm:text-2xl font-semibold text-white tracking-tight mb-0.5 font-serif line-clamp-2 leading-tight">
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
            <button type="button" aria-label={isID ? 'Foto sebelumnya' : 'Previous photo'} onClick={() => setSelectedImgIdx(p => Math.max(0, p - 1))}
              className="absolute left-3 top-[42%] -translate-y-1/2 w-11 h-11 rounded-full bg-white/95 flex items-center justify-center text-navy shadow-sm cursor-pointer">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button type="button" aria-label={isID ? 'Foto berikutnya' : 'Next photo'} onClick={() => setSelectedImgIdx(p => Math.min(images.length - 1, p + 1))}
              className="absolute right-3 top-[42%] -translate-y-1/2 w-11 h-11 rounded-full bg-white/95 flex items-center justify-center text-navy shadow-sm cursor-pointer">
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Thumbnail Strip */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 hidden sm:flex items-center gap-1.5 z-10">
          {images.slice(0, 4).map((img, idx) => (
            <button key={idx} type="button" onClick={() => setSelectedImgIdx(idx)}
              aria-label={isID ? `Lihat foto hotel ${idx + 1}` : `View hotel photo ${idx + 1}`}
              aria-pressed={selectedImgIdx === idx}
              className={`w-11 h-11 rounded-lg overflow-hidden border-2 transition-all ${
                selectedImgIdx === idx ? 'border-white shadow-md scale-105' : 'border-white/40 opacity-70 hover:opacity-100'
              }`}>
              <img src={img} alt="" onError={applyImageFallback} className="w-full h-full object-cover" />
            </button>
          ))}
          {images.length > 4 && (
            <button type="button" onClick={() => setIsGalleryOpen(true)} aria-label={isID ? 'Lihat foto hotel lainnya' : 'View more hotel photos'} className="w-11 h-11 rounded-lg bg-slate-900/70 backdrop-blur-sm flex items-center justify-center text-white text-xs font-semibold cursor-pointer">
              +{images.length - 4}
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
            data-hotel-fullscreen-gallery
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
                  onError={applyImageFallback}
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
                  <img src={img} alt="" onError={applyImageFallback} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
