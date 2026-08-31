import React from 'react';
import { motion } from 'motion/react';
import { Star } from 'lucide-react';

export const StarRating = ({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) => {
  const s = size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5';
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((n) => (
        <Star key={n} className={`${s} ${n <= Math.round(rating) ? 'fill-gold text-gold' : 'fill-slate-200 text-slate-200'}`} />
      ))}
    </div>
  );
};

export const RatingBar = ({ label, value, total }: { label: string; value: number; total: number }) => {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] font-medium text-slate-500 w-3 text-right">{label}</span>
      <Star className="w-3 h-3 fill-gold text-gold" />
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="h-full bg-gold rounded-full"
        />
      </div>
      <span className="text-[11px] text-slate-400 w-6 text-right">{value}</span>
    </div>
  );
};
