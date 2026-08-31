import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ShieldCheck, Award, Star } from 'lucide-react';
import { easeOutSoft, viewOnce } from './animations';

export const WhyChooseUsSection: React.FC<{ isID: boolean }> = ({ isID }) => {
  const reduceMotion = useReducedMotion();

  const items = [
    {
      icon: ShieldCheck,
      title: isID ? 'Pembayaran aman' : 'Secure payments',
      desc: isID
        ? 'Enkripsi tingkat perbankan untuk setiap transaksi. Data Anda dilindungi.'
        : 'Bank-grade encryption for every transaction. Your data stays protected.'
    },
    {
      icon: Award,
      title: isID ? 'Harga terbaik' : 'Best price promise',
      desc: isID
        ? 'Jaminan harga termurah. Temukan tarif lebih rendah, kami samakan.'
        : 'Lowest price guarantee. Find a lower rate and we will match it.'
    },
    {
      icon: Star,
      title: isID ? 'Layanan premium' : 'Concierge premium',
      desc: isID
        ? 'Tim concierge 24 jam memastikan pengalaman menginap Anda lancar.'
        : 'Our concierge team is available 24/7 to keep your stay effortless.'
    }
  ];

  return (
    <section className="relative rounded-[2rem] bg-[#F8FAFC] border border-[#E9EEF5] px-5 py-14 sm:px-10 sm:py-16" aria-labelledby="why-heading">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewOnce}
        transition={{ duration: 0.4, ease: easeOutSoft }}
        className="text-center space-y-2 mb-10"
      >
        <p className="text-[12px] font-semibold text-gold uppercase tracking-[0.16em]">
          {isID ? 'Keunggulan Roomly' : 'The Roomly standard'}
        </p>
        <h2 id="why-heading" className="font-serif text-3xl sm:text-4xl lg:text-[2.75rem] text-[#1E3A8A] tracking-tight">
          {isID ? 'Mengapa memilih kami' : 'Why stay with us'}
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {items.map((item, idx) => (
          <motion.div
            key={item.title}
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewOnce}
            transition={{ duration: 0.35, delay: idx * 0.06, ease: easeOutSoft }}
            className="group p-7 sm:p-8 rounded-3xl bg-white border border-[#E9EEF5] shadow-[0_8px_28px_rgba(30,58,138,0.06)] hover:shadow-[0_16px_40px_rgba(30,58,138,0.1)] hover:border-blue-100 transition-all duration-200"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#E9EEF5] flex items-center justify-center mb-5">
              <item.icon className="w-6 h-6 text-[#1E3A8A]" aria-hidden />
            </div>
            <h3 className="text-lg font-semibold text-[#1E3A8A] mb-2">{item.title}</h3>
            <p className="text-[14px] text-slate-600 leading-relaxed">{item.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
