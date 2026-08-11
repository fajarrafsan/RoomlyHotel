import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Award, Star } from 'lucide-react';
import { viewOnce } from './animations';

export const WhyChooseUsSection: React.FC<{ isID: boolean }> = ({ isID }) => (
  <div className="space-y-10">
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewOnce}
      transition={{ duration: 0.6 }}
      className="text-center space-y-3"
    >
      <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-[0.2em]">
        {isID ? 'Keunggulan' : 'Advantages'}
      </p>
      <h2 className="text-3xl sm:text-4xl font-light text-slate-900 tracking-tight">
        {isID ? 'Mengapa Memilih ' : 'Why Choose '}
        <span className="font-serif italic">{isID ? 'Kami' : 'Us'}</span>
      </h2>
    </motion.div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {[
        {
          icon: ShieldCheck,
          title: isID ? 'Pembayaran Aman' : 'Secure Payments',
          desc: isID
            ? 'Enkripsi tingkat perbankan untuk setiap transaksi. Data Anda sepenuhnya dilindungi.'
            : 'Bank-grade encryption for every transaction. Your data is fully protected.'
        },
        {
          icon: Award,
          title: isID ? 'Harga Terbaik' : 'Best Price Promise',
          desc: isID
            ? 'Jaminan harga termurah. Jika Anda menemukan harga lebih rendah, kami akan menyamakannya.'
            : 'Lowest price guarantee. Find a lower rate and we will match it.'
        },
        {
          icon: Star,
          title: isID ? 'Layanan Premium' : 'Premium Service',
          desc: isID
            ? 'Tim concierge kami tersedia 24 jam untuk memastikan pengalaman menginap Anda sempurna.'
            : 'Our concierge team is available 24/7 to ensure your stay is flawless.'
        }
      ].map((item, idx) => (
        <motion.div
          key={item.title}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewOnce}
          whileHover={{ y: -6 }}
          transition={{ duration: 0.5, delay: idx * 0.1 }}
          className="group p-8 rounded-[2rem] bg-white border border-slate-100 hover:border-slate-200 hover:shadow-xl hover:shadow-slate-200/50 transition-colors duration-500"
        >
          <div className="w-14 h-14 rounded-2xl bg-slate-50 group-hover:bg-amber-50 flex items-center justify-center mb-6 transition-colors duration-300">
            <item.icon className="w-6 h-6 text-slate-400 group-hover:text-amber-600 transition-colors duration-300" />
          </div>
          <h4 className="text-lg font-semibold text-slate-900 mb-3">{item.title}</h4>
          <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
        </motion.div>
      ))}
    </div>
  </div>
);
