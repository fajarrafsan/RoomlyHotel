import React from 'react';
import { User, Mail, Phone, MessageSquare } from 'lucide-react';

interface GuestDetailsStepProps {
  isID: boolean;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestPhoneInvalid: boolean;
  specialRequests: string;
  onGuestNameChange: (value: string) => void;
  onGuestEmailChange: (value: string) => void;
  onGuestPhoneChange: (value: string) => void;
  onSpecialRequestsChange: (value: string) => void;
}

const labelClass = 'mb-1.5 block text-sm font-bold leading-5 text-navy-dark';
const shellClass = 'group/field relative rounded-xl border border-slate-200 bg-slate-50 hover:border-slate-300 focus-within:border-navy/60 focus-within:bg-white focus-within:ring-2 focus-within:ring-navy/15 motion-safe:transition-colors';
const iconClass = 'pointer-events-none absolute left-3.5 size-4 text-slate-500 group-focus-within/field:text-navy';
const inputClass = 'w-full min-w-0 rounded-xl bg-transparent text-base font-medium text-navy-dark placeholder:font-normal placeholder:text-slate-500';
const helpClass = 'mt-1.5 text-xs leading-5 text-slate-500';

export const GuestDetailsStep: React.FC<GuestDetailsStepProps> = ({
  isID, guestName, guestEmail, guestPhone, guestPhoneInvalid, specialRequests,
  onGuestNameChange, onGuestEmailChange, onGuestPhoneChange, onSpecialRequestsChange
}) => {
  return (
    <div className="space-y-4 sm:space-y-5">
      <div>
        <h2 className="font-serif text-[25px] leading-tight tracking-tight text-navy-dark sm:text-[31px]" tabIndex={-1} data-checkout-step-heading>
          {isID ? 'Informasi tamu utama' : 'Lead guest details'}
        </h2>
        <p className="mt-1 text-sm leading-5 text-slate-600">
          {isID ? 'Data ini digunakan untuk konfirmasi reservasi dan invoice.' : 'This information is used for booking confirmation and invoice.'}
        </p>
      </div>

      <div>
        <label htmlFor="guest-name" className={labelClass}>{isID ? 'Nama lengkap' : 'Full name'}</label>
        <div className={shellClass}>
          <User className={`${iconClass} top-1/2 -translate-y-1/2`} aria-hidden />
          <input
            id="guest-name"
            name="guestName"
            type="text"
            autoComplete="name"
            value={guestName}
            onChange={(e) => onGuestNameChange(e.target.value)}
            style={{ outline: 'none' }}
            className={`${inputClass} min-h-[52px] pl-10 pr-4`}
            placeholder={isID ? 'Nama sesuai KTP / Paspor' : 'Name as on ID / Passport'}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="guest-email" className={labelClass}>{isID ? 'Email' : 'Email address'}</label>
          <div className={shellClass}>
            <Mail className={`${iconClass} top-1/2 -translate-y-1/2`} aria-hidden />
            <input
              id="guest-email"
              name="guestEmail"
              type="email"
              autoComplete="email"
              value={guestEmail}
              aria-describedby="guest-email-hint"
              onChange={(e) => onGuestEmailChange(e.target.value)}
              style={{ outline: 'none' }}
              className={`${inputClass} min-h-[52px] pl-10 pr-4`}
              placeholder="you@example.com"
            />
          </div>
          <p id="guest-email-hint" className={helpClass}>{isID ? 'Invoice akan dikirim ke email ini.' : 'The invoice will be sent to this email.'}</p>
        </div>

        <div>
          <label htmlFor="guest-phone" className={labelClass}>{isID ? 'Nomor telepon' : 'Phone number'}</label>
          <div className={`${shellClass} data-[invalid=true]:border-rose-500`} data-invalid={guestPhoneInvalid}>
            <Phone className={`${iconClass} top-1/2 -translate-y-1/2`} aria-hidden />
            <input
              id="guest-phone"
              name="guestPhone"
              type="tel"
              autoComplete="tel"
              required
              aria-invalid={guestPhoneInvalid}
              aria-describedby="guest-phone-hint"
              value={guestPhone}
              onChange={(e) => onGuestPhoneChange(e.target.value)}
              style={{ outline: 'none' }}
              className={`${inputClass} min-h-[52px] pl-10 pr-4`}
              placeholder="+62 812 3456 7890"
            />
          </div>
          <p id="guest-phone-hint" className={guestPhoneInvalid ? 'mt-1.5 text-xs leading-5 text-rose-700' : helpClass}>
            {guestPhoneInvalid
              ? (isID ? 'Setelah +62, masukkan 8–13 digit dan hilangkan angka 0 di awal nomor.' : 'Enter +62 followed by 8–13 digits, without a leading zero.')
              : (isID ? 'Wajib diawali +62. Misalnya +62 812 3456 7890.' : 'Start with +62. For example, +62 812 3456 7890.')}
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="guest-requests" className={labelClass}>
          {isID ? 'Permintaan khusus' : 'Special requests'} <span className="font-normal text-slate-500">({isID ? 'opsional' : 'optional'})</span>
        </label>
        <div className={shellClass}>
          <MessageSquare className={`${iconClass} top-4`} aria-hidden />
          <textarea
            id="guest-requests"
            name="specialRequests"
            value={specialRequests}
            onChange={(e) => onSpecialRequestsChange(e.target.value)}
            rows={3}
            style={{ outline: 'none' }}
            className={`${inputClass} block min-h-[6.5rem] resize-y py-3.5 pl-10 pr-4`}
            placeholder={isID ? 'Contoh: Kamar bebas asap rokok, late check-in...' : 'E.g. Non-smoking room, late check-in...'}
          />
        </div>
        <p className={helpClass}>{isID ? 'Kami akan berusaha memenuhi permintaan Anda.' : 'We will do our best to accommodate your request.'}</p>
      </div>

    </div>
  );
};
