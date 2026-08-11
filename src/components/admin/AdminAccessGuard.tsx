import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface AdminAccessGuardProps {
  isID: boolean;
  children: React.ReactNode;
  onOpenAuth?: () => void;
}

/**
 * Client-side gate for the admin console. This is UX only — every /api/admin/**
 * route in Roomly enforces hasRole('ADMIN') on its own, so a user who bypasses
 * this still gets a 403 from the backend.
 */
export const AdminAccessGuard: React.FC<AdminAccessGuardProps> = ({ isID, children, onOpenAuth }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (user?.role === 'ADMIN') return <>{children}</>;

  return (
    <div className="min-h-[65vh] flex flex-col items-center justify-center text-center p-6 my-10 max-w-md mx-auto bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center mx-auto">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <div className="space-y-1.5">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          {isID ? 'Akses Ditolak' : 'Access Restricted'}
        </h2>
        <p className="text-xs text-slate-400 font-light leading-relaxed">
          {isID
            ? 'Halaman ini hanya dapat diakses oleh akun dengan peran ADMIN.'
            : 'This page is reserved for accounts signed in with an ADMIN role.'}
        </p>
      </div>

      <div className="pt-2 w-full">
        {!user && onOpenAuth ? (
          <button
            onClick={onOpenAuth}
            className="w-full py-2.5 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all cursor-pointer"
          >
            {isID ? 'Masuk Akun Admin' : 'Sign In as Admin'}
          </button>
        ) : (
          <button
            onClick={() => navigate('/')}
            className="w-full py-2.5 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
          >
            {isID ? 'Kembali ke Beranda' : 'Back to Home'}
          </button>
        )}
      </div>
    </div>
  );
};
