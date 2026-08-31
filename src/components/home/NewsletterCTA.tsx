import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Sparkles, Mail, ArrowRight } from 'lucide-react';
import { DashboardView } from '../../types';
import { easeOutSoft } from './animations';

interface NewsletterCTAProps {
  isID: boolean;
  onNavigateTo: (view: DashboardView) => void;
}

export const NewsletterCTA: React.FC<NewsletterCTAProps> = ({ isID, onNavigateTo }) => {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, ease: easeOutSoft }}
      className="relative rounded-[2rem] overflow-hidden bg-[#1E3A8A] px-6 py-12 sm:px-12 sm:py-16 text-center"
      aria-labelledby="newsletter-heading"
    >
      <div className="absolute -top-20 -right-16 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-10 w-64 h-64 bg-gold/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-xl mx-auto space-y-7">
        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/10 border border-white/15 rounded-full text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-light">
          <Sparkles className="w-3.5 h-3.5" aria-hidden />
          {isID ? 'Penawaran terbatas' : 'Members only'}
        </span>

        <div className="space-y-3">
          <h2 id="newsletter-heading" className="font-serif text-3xl sm:text-4xl lg:text-[2.75rem] text-white tracking-tight leading-[1.15]">
            {isID ? (
              <>Tarif <span className="italic text-gold-light">eksklusif</span> menanti</>
            ) : (
              <>Exclusive <span className="italic text-gold-light">rates</span> await</>
            )}
          </h2>
          <p className="text-[15px] text-blue-100 leading-relaxed max-w-md mx-auto">
            {isID
              ? 'Bergabung sebagai member dan nikmati diskon hingga 30% untuk reservasi pertama.'
              : 'Join membership and enjoy up to 30% off your first reservation.'}
          </p>
        </div>

        <form
          className="flex flex-col sm:flex-row items-stretch gap-3 max-w-md mx-auto"
          onSubmit={(e) => {
            e.preventDefault();
            onNavigateTo('explore');
          }}
        >
          <div className="relative flex-1 w-full">
            <label htmlFor="home-newsletter-email" className="sr-only">
              {isID ? 'Alamat email' : 'Email address'}
            </label>
            <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              id="home-newsletter-email"
              type="email"
              autoComplete="email"
              placeholder={isID ? 'Alamat email Anda' : 'Your email address'}
              className="w-full min-h-12 pl-11 pr-4 py-3 rounded-xl bg-white border border-white text-[14px] font-medium text-navy placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-gold-light/80"
            />
          </div>
          <motion.button
            type="submit"
            whileHover={reduceMotion ? undefined : { scale: 1.015 }}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            className="min-h-12 w-full sm:w-auto px-7 py-3 bg-gold hover:bg-gold-dark text-white rounded-xl font-semibold text-[14px] transition-colors duration-200 cursor-pointer inline-flex items-center justify-center gap-2 shrink-0"
          >
            <span>{isID ? 'Daftar' : 'Join now'}</span>
            <ArrowRight className="w-4 h-4" aria-hidden />
          </motion.button>
        </form>

        <p className="text-[12px] text-blue-200/80 font-medium">
          {isID
            ? 'Gratis. Batalkan kapan saja. Tidak ada spam.'
            : 'Free. Cancel anytime. No spam.'}
        </p>
      </div>
    </motion.section>
  );
};
