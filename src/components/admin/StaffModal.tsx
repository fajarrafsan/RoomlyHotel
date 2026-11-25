import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { X, UserPlus, Shield, Mail, Lock, User, Loader2, AlertCircle, Building2 } from 'lucide-react';
import { Role } from '../../types/api/auth';
import { CreateStaffRequestDto } from '../../api/admin';

interface StaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  isID: boolean;
  hotels: Array<{ id: string; name: string }>;
  onSubmit: (payload: CreateStaffRequestDto) => Promise<unknown>;
}

const ROLE_OPTIONS: { role: Role; labelId: string; labelEn: string; descId: string; descEn: string }[] = [
  {
    role: 'RECEPTIONIST',
    labelId: 'Resepsionis Front Desk',
    labelEn: 'Front Desk Receptionist',
    descId: 'Menangani check-in, check-out, dan layanan tamu.',
    descEn: 'Handles guest check-in, check-out, and guest requests.',
  },
  {
    role: 'HOUSEKEEPING',
    labelId: 'Staf Housekeeping',
    labelEn: 'Housekeeping Staff',
    descId: 'Mengelola kebersihan dan kesiapan kamar hotel.',
    descEn: 'Manages room cleaning and inspection tasks.',
  },
  {
    role: 'MAINTENANCE',
    labelId: 'Staf Pemeliharaan',
    labelEn: 'Maintenance Staff',
    descId: 'Memperbaiki fasilitas dan perawatan teknis gedung.',
    descEn: 'Fixes property facilities and technical maintenance.',
  },
  {
    role: 'ADMIN',
    labelId: 'Administrator Tambahan',
    labelEn: 'Additional Admin',
    descId: 'Akses penuh kelola staf, pemesanan, dan laporan.',
    descEn: 'Full system management access and staff controls.',
  },
];

export const StaffModal: React.FC<StaffModalProps> = ({
  isOpen,
  onClose,
  isID,
  hotels,
  onSubmit,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('RECEPTIONIST');
  const [hotelId, setHotelId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleId = useId();
  const reduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const loadingRef = useRef(loading);
  loadingRef.current = loading;

  const requiresHotelId = role !== 'ADMIN';

  useEffect(() => {
    if (!isOpen) return;
    const opener = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus({ preventScroll: true });
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loadingRef.current) closeRef.current();
      if (event.key !== 'Tab' || !panelRef.current) return;
      const controls = [...panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])')];
      const first = controls[0];
      const last = controls.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKey);
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password) {
      setError(isID ? 'Semua bidang wajib diisi.' : 'All fields are required.');
      return;
    }

    const parsedHotelId = Number(hotelId);
    if (requiresHotelId && (!Number.isInteger(parsedHotelId) || parsedHotelId <= 0)) {
      setError(isID ? 'ID hotel wajib berupa angka positif.' : 'Hotel ID must be a positive whole number.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        role,
        ...(requiresHotelId ? { hotelId: parsedHotelId } : {}),
      });
      setFullName('');
      setEmail('');
      setPassword('');
      setHotelId('');
      setRole('RECEPTIONIST');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : (isID ? 'Gagal menambah staf baru.' : 'Failed to add new staff.'));
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <AnimatePresence>{isOpen && (
      <motion.div
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.16 }}
        className="fixed inset-0 z-[80] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto"
      >
        <motion.div
          ref={panelRef}
          role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}
          initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: reduceMotion ? 0 : 0.2 }}
          className="bg-white rounded-2xl max-w-md w-full max-h-[92vh] shadow-2xl border border-slate-100 overflow-hidden relative my-auto flex flex-col outline-none"
        >
          {/* Header */}
          <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs shrink-0">
                <UserPlus className="w-4 h-4" />
              </span>
              <div>
                <h3 id={titleId} className="font-semibold text-sm sm:text-base text-slate-900 leading-tight">
                  {isID ? 'Tambah Staf Baru' : 'Add Staff Member'}
                </h3>
                <p className="text-[10px] sm:text-[11px] text-slate-400 font-light mt-0.5">
                  {isID ? 'Buat akun staf operasional hotel' : 'Create a new staff member account'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-600 border border-slate-100 flex items-center justify-center transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                {isID ? 'Nama Lengkap' : 'Full Name'}
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Budi Santoso"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="budi.receptionist@roomly.com"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                {isID ? 'Peran / Jabatan' : 'Role / Position'}
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {ROLE_OPTIONS.map((opt) => (
                  <div
                    key={opt.role}
                    onClick={() => {
                      setRole(opt.role);
                      setError(null);
                      if (opt.role === 'ADMIN') setHotelId('');
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                      role === opt.role
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50/70 border-slate-100 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Shield className={`w-4 h-4 mt-0.5 shrink-0 ${role === opt.role ? 'text-amber-400' : 'text-slate-400'}`} />
                    <div>
                      <p className="text-xs font-semibold">{isID ? opt.labelId : opt.labelEn}</p>
                      <p className={`text-[11px] font-light mt-0.5 ${role === opt.role ? 'text-slate-300' : 'text-slate-400'}`}>
                        {isID ? opt.descId : opt.descEn}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {requiresHotelId ? (
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  {isID ? 'ID Hotel Penugasan' : 'Assigned Hotel ID'}
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    required
                    value={hotelId}
                    onChange={(e) => setHotelId(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 appearance-none"
                  >
                    <option value="">{isID ? 'Pilih hotel...' : 'Select a hotel...'}</option>
                    {hotels.map((hotel) => (
                      <option key={hotel.id} value={hotel.id}>{hotel.name} (#{hotel.id})</option>
                    ))}
                  </select>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                  {hotels.length === 0
                    ? (isID ? 'Belum ada hotel yang dapat ditugaskan.' : 'No hotel is available for assignment yet.')
                    : (isID
                        ? 'Staf operasional hanya dapat mengakses pekerjaan untuk hotel ini.'
                        : 'Operational staff can only access work for this hotel.')}
                </p>
              </div>
            ) : (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-800">
                <Shield className="w-4 h-4 mt-0.5 shrink-0" />
                <p className="text-[11px] leading-relaxed">
                  {isID
                    ? 'ADMIN memiliki akses global dan tidak ditugaskan ke satu hotel.'
                    : 'ADMIN has system-wide access and is not assigned to one hotel.'}
                </p>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
              >
                {isID ? 'Batal' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={loading || (requiresHotelId && hotels.length === 0)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isID ? 'Simpan Staf' : 'Save Staff'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    )}</AnimatePresence>,
    document.body,
  );
};
