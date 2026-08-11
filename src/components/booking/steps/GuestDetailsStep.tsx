import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Mail, Phone, MessageSquare, CheckCircle2 } from 'lucide-react';

interface GuestDetailsStepProps {
  isID: boolean;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  specialRequests: string;
  onGuestNameChange: (value: string) => void;
  onGuestEmailChange: (value: string) => void;
  onGuestPhoneChange: (value: string) => void;
  onSpecialRequestsChange: (value: string) => void;
}

export const GuestDetailsStep: React.FC<GuestDetailsStepProps> = ({
  isID, guestName, guestEmail, guestPhone, specialRequests,
  onGuestNameChange, onGuestEmailChange, onGuestPhoneChange, onSpecialRequestsChange
}) => {
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const isValidEmail = guestEmail.includes('@') && guestEmail.includes('.');
  const isValidPhone = guestPhone.length >= 10;

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="space-y-1">
        <h4 className="text-lg font-semibold text-slate-900 tracking-tight flex items-center gap-2">
          <User className="w-5 h-5 text-slate-400" />
          {isID ? 'Informasi Tamu Utama' : 'Lead Guest Details'}
        </h4>
        <p className="text-[13px] text-slate-400 font-light">
          {isID ? 'Data ini digunakan untuk konfirmasi reservasi dan invoice.'
            : 'This information is used for booking confirmation and invoice.'}
        </p>
      </div>

      {/* Full Name */}
      <div>
        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
          {isID ? 'Nama Lengkap' : 'Full Name'}
        </label>
        <div className={`relative rounded-xl border transition-all duration-200 ${
          focusedField === 'name' ? 'border-slate-900 ring-1 ring-slate-900/5' : 'border-slate-200 hover:border-slate-300'
        }`}>
          <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={guestName} onChange={(e) => onGuestNameChange(e.target.value)}
            onFocus={() => setFocusedField('name')} onBlur={() => setFocusedField(null)}
            className="w-full pl-10 pr-4 py-3 bg-transparent text-[13px] font-medium text-slate-900 placeholder-slate-300 focus:outline-none rounded-xl"
            placeholder={isID ? 'Nama sesuai KTP / Paspor' : 'Name as on ID / Passport'} />
        </div>
      </div>

      {/* Email & Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Email */}
        <div>
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
            {isID ? 'Email' : 'Email Address'}
          </label>
          <div className={`relative rounded-xl border transition-all duration-200 ${
            focusedField === 'email' ? 'border-slate-900 ring-1 ring-slate-900/5' : 'border-slate-200 hover:border-slate-300'
          }`}>
            <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="email" value={guestEmail} onChange={(e) => onGuestEmailChange(e.target.value)}
              onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)}
              className="w-full pl-10 pr-10 py-3 bg-transparent text-[13px] font-medium text-slate-900 placeholder-slate-300 focus:outline-none rounded-xl"
              placeholder="you@example.com" />
            {isValidEmail && (
              <CheckCircle2 className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500" />
            )}
          </div>
          <p className="text-[11px] text-slate-400 font-light mt-1.5">
            {isID ? 'Invoice akan dikirim ke email ini.' : 'The invoice will be sent to this email.'}
          </p>
        </div>

        {/* Phone */}
        <div>
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
            {isID ? 'Nomor Telepon' : 'Phone Number'}
          </label>
          <div className={`relative rounded-xl border transition-all duration-200 ${
            focusedField === 'phone' ? 'border-slate-900 ring-1 ring-slate-900/5' : 'border-slate-200 hover:border-slate-300'
          }`}>
            <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="tel" value={guestPhone} onChange={(e) => onGuestPhoneChange(e.target.value)}
              onFocus={() => setFocusedField('phone')} onBlur={() => setFocusedField(null)}
              className="w-full pl-10 pr-4 py-3 bg-transparent text-[13px] font-medium text-slate-900 placeholder-slate-300 focus:outline-none rounded-xl"
              placeholder="+62 812 3456 7890" />
          </div>
          <p className="text-[11px] text-slate-400 font-light mt-1.5">
            {isID ? 'Gunakan format internasional (+62).' : 'Use international format (+62).'}
          </p>
        </div>
      </div>

      {/* Special Requests */}
      <div>
        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
          {isID ? 'Permintaan Khusus' : 'Special Requests'}
        </label>
        <div className={`relative rounded-xl border transition-all duration-200 ${
          focusedField === 'requests' ? 'border-slate-900 ring-1 ring-slate-900/5' : 'border-slate-200 hover:border-slate-300'
        }`}>
          <MessageSquare className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <textarea value={specialRequests} onChange={(e) => onSpecialRequestsChange(e.target.value)}
            onFocus={() => setFocusedField('requests')} onBlur={() => setFocusedField(null)}
            rows={3} className="w-full pl-10 pr-4 py-3 bg-transparent text-[13px] font-medium text-slate-900 placeholder-slate-300 focus:outline-none rounded-xl resize-none"
            placeholder={isID ? 'Contoh: Kamar bebas asap rokok, late check-in...' : 'E.g. Non-smoking room, late check-in...'} />
        </div>
        <p className="text-[11px] text-slate-400 font-light mt-1.5">
          {isID ? 'Opsional. Kami akan berusaha memenuhi permintaan Anda.' : 'Optional. We will do our best to accommodate your request.'}
        </p>
      </div>

      {/* Security Note */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        </div>
        <div>
          <p className="text-[12px] font-semibold text-slate-700">{isID ? 'Data Anda Aman' : 'Your Data is Secure'}</p>
          <p className="text-[11px] text-slate-400 font-light mt-0.5">
            {isID ? 'Informasi pribadi Anda dienkripsi dan tidak akan dibagikan ke pihak ketiga.'
              : 'Your personal information is encrypted and will never be shared with third parties.'}
          </p>
        </div>
      </motion.div>
    </div>
  );
};