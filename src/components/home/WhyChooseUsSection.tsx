import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { BedDouble, CalendarCheck, CreditCard, MapPin } from 'lucide-react';
import { easeOutSoft } from './animations';
import { applyImageFallback } from '../../lib/imageFallback';

export const WhyChooseUsSection: React.FC<{ isID: boolean }> = ({ isID }) => {
  const reduceMotion = useReducedMotion();
  const items = [
    {
      icon: BedDouble,
      title: isID ? 'Pilihan lebih jelas' : 'Choose with confidence',
      desc: isID
        ? 'Lihat foto, detail kamar, kapasitas tamu, dan tarif sebelum menentukan tempat menginap.'
        : 'See photos, room details, guest capacity, and rates before choosing your stay.',
    },
    {
      icon: CreditCard,
      title: isID ? 'Pembayaran lebih praktis' : 'A simpler way to pay',
      desc: isID
        ? 'Tinjau rincian reservasi, lalu lanjutkan dengan metode pembayaran yang tersedia.'
        : 'Review your reservation details, then continue with an available payment method.',
    },
    {
      icon: CalendarCheck,
      title: isID ? 'Perjalanan lebih tertata' : 'Keep your plans together',
      desc: isID
        ? 'Simpan penginapan favorit dan temukan kembali reservasi serta invoice yang sudah terbit di akunmu.'
        : 'Save your favourite stays and find your reservations and issued invoices in your account.',
    },
  ];

  return (
    <section className="-mx-4 grid overflow-hidden rounded-[28px] border border-[#e7e0d4] bg-[#f6f2e9] sm:mx-0 sm:rounded-[32px] lg:grid-cols-[0.43fr_0.57fr]" aria-labelledby="why-heading" data-why-roomly>
      <figure className="relative m-0 min-h-[220px] overflow-hidden bg-slate-200 sm:min-h-[280px] lg:min-h-[510px]">
        <img
          src="/images/seed/hotels/samudra-belitung.png"
          alt={isID ? 'Resor tropis di pesisir Belitung dengan pantai berpasir putih dan bebatuan granit' : 'A tropical resort on the Belitung coast, with white sand and granite rocks'}
          loading="lazy"
          decoding="async"
          onError={applyImageFallback}
          className="absolute inset-0 h-full w-full object-cover object-[center_60%] lg:object-[60%_center]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0b2039]/90 via-[#0b2039]/40 to-transparent" aria-hidden />
        <figcaption className="absolute inset-x-6 bottom-6 text-white sm:inset-x-8 sm:bottom-8 lg:inset-x-9 lg:bottom-9" style={{ textShadow: '0 1px 14px rgba(0,0,0,0.25)' }}>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-light">The Roomly feeling</p>
          <p className="font-serif text-[27px] leading-[1.25] tracking-tight sm:text-[32px] lg:text-[35px]">{isID ? <>Ruang untuk<br /><span className="italic">cerita baru.</span></> : <>Room for<br /><span className="italic">a new story.</span></>}</p>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-white/85"><MapPin className="size-3.5 text-gold-light" aria-hidden />Belitung, Indonesia</p>
        </figcaption>
      </figure>

      <div className="min-w-0 px-6 py-7 sm:px-9 sm:py-9 lg:px-10 lg:py-10 xl:px-12">
        <p className="mb-3 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold sm:text-[11px]"><span className="h-px w-7 bg-gold/60" aria-hidden />{isID ? 'Kenapa Roomly' : 'Why Roomly'}</p>
        <h2 id="why-heading" className="font-serif text-[29px] leading-[1.2] tracking-[-0.035em] text-navy-dark sm:text-[35px] lg:text-[37px] xl:text-[40px]">
          {isID ? <>Menginap nyaman,<br /><span className="italic text-gold">berawal di sini.</span></> : <>A better stay<br /><span className="italic text-gold">starts here.</span></>}
        </h2>
        <div className="mt-6 sm:mt-7">
          {items.map((item, index) => (
            <motion.div
              key={index}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: reduceMotion ? 0 : 0.25, delay: reduceMotion ? 0 : index * 0.035, ease: easeOutSoft }}
              className="flex items-start gap-3.5 border-b border-[#e5ddce] py-4 first:pt-0 last:border-b-0 last:pb-0 sm:gap-4 sm:py-5"
              data-roomly-benefit
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-[13px] border border-[#e9e1d3] bg-white/85 text-gold sm:size-11"><item.icon className="size-[19px]" aria-hidden /></span>
              <div className="min-w-0 flex-1">
                <h3 className="text-[15px] font-semibold leading-6 text-navy-dark sm:text-base">{item.title}</h3>
                <p className="mt-1 text-[13px] leading-[1.7] text-slate-600 sm:text-[14px]">{item.desc}</p>
              </div>
              <span className="hidden pt-1 text-[11px] font-semibold tabular-nums text-gold/60 xl:block" aria-hidden>{String(index + 1).padStart(2, '0')}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
