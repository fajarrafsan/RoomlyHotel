import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Hotel, Language } from '../../types';
import { HotelCardImage } from './card/HotelCardImage';
import { HotelCardContent } from './card/HotelCardContent';

interface HotelCardProps {
  hotel: Hotel;
  isWishlisted: boolean;
  onToggleWishlist: (hotelId: string) => void;
  onSelect: (hotel: Hotel) => void;
  language: Language;
  index?: number;
}

export const HotelCard: React.FC<HotelCardProps> = React.memo(({
  hotel,
  isWishlisted,
  onToggleWishlist,
  onSelect,
  language,
  index = 0
}) => {
  const isID = language === 'ID';
  const [isHovered, setIsHovered] = useState(false);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  const isBestSeller = hotel.rating >= 4.8 && hotel.reviewsCount > 50;
  const isAlmostFull = 'availableRooms' in hotel && (hotel as any).availableRooms <= 3 && (hotel as any).availableRooms > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '50px' }}
      transition={{
        duration: 0.4,
        delay: Math.min(index, 6) * 0.04,
        ease: 'easeOut'
      }}
      onClick={() => onSelect(hotel)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setCurrentImgIndex(0); }}
      className="group cursor-pointer flex flex-col rounded-3xl bg-white border border-navy-soft overflow-hidden shadow-[0_8px_28px_rgba(30,58,138,0.06)] hover:shadow-[0_16px_40px_rgba(30,58,138,0.12)] will-change-transform transform-gpu hover:-translate-y-1 transition-all duration-200 ease-out"
    >
      <HotelCardImage
        hotel={hotel}
        isID={isID}
        isWishlisted={isWishlisted}
        isBestSeller={isBestSeller}
        isAlmostFull={isAlmostFull}
        isHovered={isHovered}
        currentImgIndex={currentImgIndex}
        onToggleWishlist={onToggleWishlist}
        onHoverDot={setCurrentImgIndex}
      />

      <HotelCardContent
        hotel={hotel}
        isID={isID}
        isHovered={isHovered}
      />
    </motion.div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.hotel.id === nextProps.hotel.id &&
    prevProps.isWishlisted === nextProps.isWishlisted &&
    prevProps.language === nextProps.language &&
    prevProps.index === nextProps.index &&
    prevProps.hotel.pricePerNight === nextProps.hotel.pricePerNight &&
    prevProps.hotel.rating === nextProps.hotel.rating &&
    prevProps.hotel.image === nextProps.hotel.image &&
    prevProps.hotel.gallery === nextProps.hotel.gallery
  );
});
