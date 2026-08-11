import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Mail, ArrowRight } from 'lucide-react';
import { DashboardView } from '../../types';

interface NewsletterCTAProps {
  isID: boolean;
  onNavigateTo: (view: DashboardView) => void;
}

export const NewsletterCTA: React.FC<NewsletterCTAProps> = ({ isID, onNavigateTo }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6 }}
    className="relative rounded-[2rem] overflow-hidden bg-white border border-slate-100 p-10 sm:p-16 text-center shadow-sm hover:shadow-xl hover:shadow-slate-900/5 transition-shadow duration-700"
  >
    {/* Subtle background texture */}
    <div className="absolute inset-0 bg-gradient-to-br from-slate-50/80 via-white to-amber-50/30" />

    {/* Decorative blurred orbs — static. Animating a blurred layer forces the
        browser to recomposite the blur every frame; with two of these running
        forever (never paused when off-screen) they were a steady drain on
        scroll performance for no real visual payoff. */}
    <div className="absolute -top-20 -right-20 w-72 h-72 bg-amber-100/40 rounded-full blur-3xl" />
    <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-slate-100/60 rounded-full blur-3xl" />

    {/* Top accent line */}
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

    <div className="relative z-10 max-w-2xl mx-auto space-y-8">
      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-50 border border-amber-100 rounded-full text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-700">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          {isID ? 'Penawaran Terbatas' : 'Limited Offer'}
        </span>
      </motion.div>

      {/* Heading */}
      <div className="space-y-4">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-slate-900 tracking-tight leading-[1.15]">
          {isID ? (
            <>
              Dapatkan{' '}
              <span className="font-serif italic text-slate-700">Penawaran Eksklusif</span>
            </>
          ) : (
            <>
              Get{' '}
              <span className="font-serif italic text-slate-700">Exclusive Offers</span>
            </>
          )}
        </h2>
        <p className="text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
          {isID
            ? 'Bergabung dengan member kami dan nikmati diskon hingga 30% untuk reservasi pertama Anda.'
            : 'Join our membership and enjoy up to 30% off your first reservation.'}
        </p>
      </div>

      {/* Email Input + CTA */}
      <div className="flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto">
        <div className="relative flex-1 w-full">
          <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="email"
            placeholder={isID ? 'Alamat email Anda' : 'Your email address'}
            className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigateTo('explore')}
          className="relative overflow-hidden w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-sm transition-colors cursor-pointer shadow-lg shadow-slate-900/15 inline-flex items-center justify-center gap-2 shrink-0"
        >
          <span className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-shimmer" />
          <span className="relative z-10">{isID ? 'Daftar' : 'Join Now'}</span>
          <ArrowRight className="w-4 h-4 relative z-10" />
        </motion.button>
      </div>

      {/* Trust text */}
      <p className="text-[11px] text-slate-400 font-medium">
        {isID
          ? 'Gratis. Batalkan kapan saja. Tidak ada spam.'
          : 'Free. Cancel anytime. No spam.'}
      </p>
    </div>
  </motion.div>
);
