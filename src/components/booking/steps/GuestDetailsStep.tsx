import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Mail, Phone, MessageSquare, CheckCircle2, ShieldCheck } from 'lucide-react';
import { fadeTween } from '../../../lib/motion';

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

const fieldShell = (focused: boolean) =>
  `relative rounded-xl border bg-[#F8FAFC] transition-colors duration-200 ${
    focused ? 'border-navy ring-2 ring-navy/15 bg-white' : 'border-navy-soft hover:border-navy/30'
  }`;

const iconTone = (focused: boolean) =>
  `w-4 h-4 absolute pointer-events-none transition-colors duration-200 ${focused ? 'text-gold' : 'text-slate-400'}`;

export const GuestDetailsStep: React.FC<GuestDetailsStepProps> = ({
  isID, guestName, guestEmail, guestPhone, specialRequests,
  onGuestNameChange, onGuestEmailChange, onGuestPhoneChange, onSpecialRequestsChange
}) => {
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const isValidEmail = guestEmail.includes('@') && guestEmail.includes('.');

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h4 className="font-serif text-xl text-navy tracking-tight flex items-center gap-2">
          <User className="w-5 h-5 text-gold" aria-hidden />
          {isID ? 'Informasi tamu utama' : 'Lead guest details'}
        </h4>
        <p className="text-[13px] text-slate-500">
          {isID ? 'Data ini digunakan untuk konfirmasi reservasi dan invoice.'
            : 'This information is used for booking confirmation and invoice.'}
        </p>
      </div>

      <div>
        <label htmlFor="guest-name" className="text-[11px] font-semibold text-navy uppercase tracking-wider block mb-2">
          {isID ? 'Nama lengkap' : 'Full name'}
        </label>
        <div className={fieldShell(focusedField === 'name')}>
          <User className={`${iconTone(focusedField === 'name')} left-3.5 top-1/2 -translate-y-1/2`} aria-hidden />
          <input
            id="guest-name"
            name="guestName"
            type="text"
            autoComplete="name"
            value={guestName}
            onChange={(e) => onGuestNameChange(e.target.value)}
            onFocus={() => setFocusedField('name')}
            onBlur={() => setFocusedField(null)}
            className="w-full min-h-12 pl-10 pr-4 py-3 bg-transparent text-[14px] font-medium text-navy placeholder-slate-400 focus:outline-none rounded-xl"
            placeholder={isID ? 'Nama sesuai KTP / Paspor' : 'Name as on ID / Passport'}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="guest-email" className="text-[11px] font-semibold text-navy uppercase tracking-wider block mb-2">
            {isID ? 'Email' : 'Email address'}
          </label>
          <div className={fieldShell(focusedField === 'email')}>
            <Mail className={`${iconTone(focusedField === 'email')} left-3.5 top-1/2 -translate-y-1/2`} aria-hidden />
            <input
              id="guest-email"
              name="guestEmail"
              type="email"
              autoComplete="email"
              value={guestEmail}
              onChange={(e) => onGuestEmailChange(e.target.value)}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              className="w-full min-h-12 pl-10 pr-10 py-3 bg-transparent text-[14px] font-medium text-navy placeholder-slate-400 focus:outline-none rounded-xl"
              placeholder="you@example.com"
            />
            {isValidEmail && (
              <CheckCircle2 className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500" aria-hidden />
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5">
            {isID ? 'Invoice akan dikirim ke email ini.' : 'The invoice will be sent to this email.'}
          </p>
        </div>

        <div>
          <label htmlFor="guest-phone" className="text-[11px] font-semibold text-navy uppercase tracking-wider block mb-2">
            {isID ? 'Nomor telepon' : 'Phone number'}
          </label>
          <div className={fieldShell(focusedField === 'phone')}>
            <Phone className={`${iconTone(focusedField === 'phone')} left-3.5 top-1/2 -translate-y-1/2`} aria-hidden />
            <input
              id="guest-phone"
              name="guestPhone"
              type="tel"
              autoComplete="tel"
              value={guestPhone}
              onChange={(e) => onGuestPhoneChange(e.target.value)}
              onFocus={() => setFocusedField('phone')}
              onBlur={() => setFocusedField(null)}
              className="w-full min-h-12 pl-10 pr-4 py-3 bg-transparent text-[14px] font-medium text-navy placeholder-slate-400 focus:outline-none rounded-xl"
              placeholder="+62 812 3456 7890"
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5">
            {isID ? 'Gunakan format internasional (+62).' : 'Use international format (+62).'}
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="guest-requests" className="text-[11px] font-semibold text-navy uppercase tracking-wider block mb-2">
          {isID ? 'Permintaan khusus' : 'Special requests'}
        </label>
        <div className={fieldShell(focusedField === 'requests')}>
          <MessageSquare className={`${iconTone(focusedField === 'requests')} left-3.5 top-3.5`} aria-hidden />
          <textarea
            id="guest-requests"
            name="specialRequests"
            value={specialRequests}
            onChange={(e) => onSpecialRequestsChange(e.target.value)}
            onFocus={() => setFocusedField('requests')}
            onBlur={() => setFocusedField(null)}
            rows={3}
            className="w-full min-h-[5.5rem] pl-10 pr-4 py-3 bg-transparent text-[14px] font-medium text-navy placeholder-slate-400 focus:outline-none rounded-xl resize-none"
            placeholder={isID ? 'Contoh: Kamar bebas asap rokok, late check-in...' : 'E.g. Non-smoking room, late check-in...'}
          />
        </div>
        <p className="text-[11px] text-slate-500 mt-1.5">
          {isID ? 'Opsional. Kami akan berusaha memenuhi permintaan Anda.' : 'Optional. We will do our best to accommodate your request.'}
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={fadeTween}
        className="flex items-start gap-3 p-4 rounded-2xl bg-navy-soft/50 border border-navy-soft"
      >
        <div className="w-9 h-9 rounded-lg bg-white border border-navy-soft flex items-center justify-center shrink-0">
          <ShieldCheck className="w-4 h-4 text-navy" aria-hidden />
        </div>
        <div>
          <p className="text-[12px] font-semibold text-navy">{isID ? 'Data Anda aman' : 'Your data is secure'}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {isID ? 'Informasi pribadi Anda dienkripsi dan tidak akan dibagikan ke pihak ketiga.'
              : 'Your personal information is encrypted and will never be shared with third parties.'}
          </p>
        </div>
      </motion.div>
    </div>
  );
};
