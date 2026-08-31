import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, LayoutGroup, useReducedMotion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  User, Bell, Mail, Languages, Loader2, AlertCircle, BadgeCheck, Hash, LogOut, LogIn
} from 'lucide-react';
import { Language } from '../types';
import { NotificationEventType, NotificationPreferenceResponse } from '../types/api';
import { useAuth } from '../context/AuthContext';
import { notificationPreferenceApi } from '../api/notifications';
import { GUEST_EVENT_GROUPS, EVENT_TYPE_LABELS, ROLE_LABELS } from '../lib/notificationLabels';
import { fadeTween, pillTween } from '../lib/motion';

interface SettingsPageProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenAuth?: () => void;
}

const DEFAULT_PREF = { inAppEnabled: true, emailEnabled: true };

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'R';
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ language, onLanguageChange, onOpenAuth }) => {
  const isID = language === 'ID';
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const [prefs, setPrefs] = useState<Map<NotificationEventType, { inAppEnabled: boolean; emailEnabled: boolean }>>(new Map());
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [prefsError, setPrefsError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [activeGroupKey, setActiveGroupKey] = useState(GUEST_EVENT_GROUPS[0].title.en);

  useEffect(() => {
    if (!user) {
      setLoadingPrefs(false);
      return;
    }
    let cancelled = false;
    notificationPreferenceApi.list()
      .then((rows) => {
        if (cancelled) return;
        const map = new Map<NotificationEventType, { inAppEnabled: boolean; emailEnabled: boolean }>();
        rows.forEach((r: NotificationPreferenceResponse) => map.set(r.eventType, { inAppEnabled: r.inAppEnabled, emailEnabled: r.emailEnabled }));
        setPrefs(map);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Failed to load notification preferences', err);
        setPrefsError(isID ? 'Gagal memuat preferensi notifikasi.' : 'Failed to load notification preferences.');
      })
      .finally(() => { if (!cancelled) setLoadingPrefs(false); });
    return () => { cancelled = true; };
  }, [user, isID]);

  const getPref = (eventType: NotificationEventType) => prefs.get(eventType) || DEFAULT_PREF;

  const handleToggle = async (eventType: NotificationEventType, channel: 'inAppEnabled' | 'emailEnabled') => {
    const current = getPref(eventType);
    const next = { ...current, [channel]: !current[channel] };
    const key = `${eventType}:${channel}`;

    setPrefs((prev) => new Map(prev).set(eventType, next));
    setSavingKey(key);
    setPrefsError(null);
    try {
      await notificationPreferenceApi.update({ eventType, inAppEnabled: next.inAppEnabled, emailEnabled: next.emailEnabled });
    } catch (err) {
      console.error('Failed to update notification preference', err);
      setPrefs((prev) => new Map(prev).set(eventType, current));
      setPrefsError(isID ? 'Gagal menyimpan perubahan. Coba lagi.' : 'Failed to save the change. Please try again.');
    } finally {
      setSavingKey((k) => (k === key ? null : k));
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/');
    } finally {
      setLoggingOut(false);
    }
  };

  const roleLabel = user
    ? (ROLE_LABELS[user.role] ? (isID ? ROLE_LABELS[user.role].id : ROLE_LABELS[user.role].en) : user.role)
    : '';

  const profileFields = user
    ? [
        { icon: User, label: isID ? 'Nama lengkap' : 'Full name', value: user.fullName },
        { icon: Mail, label: 'Email', value: user.email },
        { icon: BadgeCheck, label: isID ? 'Peran' : 'Role', value: roleLabel },
        { icon: Hash, label: isID ? 'ID anggota' : 'Member ID', value: `#${user.userId}` },
      ]
    : [];

  return (
    <div className="settings-page max-w-3xl mx-auto space-y-6 sm:space-y-8 pb-20">
      <motion.header
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={fadeTween}
        className="space-y-1.5"
      >
        <p className="text-[12px] font-semibold tracking-[0.16em] uppercase text-gold">
          {isID ? 'Akun' : 'Account'}
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl text-navy tracking-tight leading-tight">
          {isID ? 'Pengaturan' : 'Settings'}
        </h1>
        <p className="text-[14px] text-slate-600 leading-relaxed">
          {isID ? 'Kelola profil, notifikasi, dan bahasa Anda.' : 'Manage your profile, notifications, and language.'}
        </p>
      </motion.header>

      <section className="rounded-3xl border border-navy-soft bg-white overflow-hidden shadow-[0_8px_28px_rgba(30,58,138,0.06)]">
        {!user ? (
          <div className="p-8 sm:p-10 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-navy mx-auto flex items-center justify-center">
              <User className="w-6 h-6 text-gold-light" aria-hidden />
            </div>
            <div className="space-y-1.5">
              <h2 className="font-serif text-xl text-navy">
                {isID ? 'Masuk untuk melihat profil' : 'Sign in to view your profile'}
              </h2>
              <p className="text-[14px] text-slate-600 max-w-sm mx-auto">
                {isID
                  ? 'Akun Roomly menyimpan reservasi, wishlist, dan preferensi notifikasi Anda.'
                  : 'Your Roomly account keeps bookings, wishlist, and notification preferences.'}
              </p>
            </div>
            {onOpenAuth && (
              <button
                type="button"
                onClick={onOpenAuth}
                className="inline-flex items-center justify-center gap-2 min-h-12 px-6 rounded-xl bg-gold hover:bg-gold-dark text-white text-[14px] font-semibold transition-colors duration-200 cursor-pointer"
              >
                <LogIn className="w-4 h-4" aria-hidden />
                {isID ? 'Masuk' : 'Sign in'}
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="relative bg-navy text-white p-6 sm:p-8 overflow-hidden">
              <div className="pointer-events-none absolute -bottom-16 -right-10 w-48 h-48 rounded-full bg-gold/20 blur-3xl" aria-hidden />
              <div className="relative flex items-center gap-4 sm:gap-5">
                <div className="w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem] rounded-2xl bg-white/10 text-gold-light font-serif text-xl sm:text-2xl flex items-center justify-center shrink-0">
                  {initials(user.fullName)}
                </div>
                <div className="min-w-0 space-y-2">
                  <h2 className="font-serif text-2xl sm:text-[1.75rem] leading-tight truncate">
                    {user.fullName}
                  </h2>
                  <p className="text-[14px] text-white/70 truncate">{user.email}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 text-[11px] font-semibold text-gold-light">
                      <BadgeCheck className="w-3 h-3" aria-hidden />
                      {roleLabel}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 text-[11px] font-medium text-white/80">
                      <Hash className="w-3 h-3" aria-hidden />
                      #{user.userId}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-navy-soft">
              {profileFields.map(({ icon: Icon, label, value }) => (
                <div key={label} className="p-4 sm:p-5 flex items-start gap-3 min-w-0">
                  <span className="w-10 h-10 rounded-xl bg-navy-soft flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-navy" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
                    <p className="text-[14px] font-semibold text-navy truncate mt-0.5">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {user && (
        <section className="p-5 sm:p-8 rounded-3xl bg-white border border-navy-soft shadow-[0_8px_28px_rgba(30,58,138,0.06)] space-y-5 sm:space-y-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-11 h-11 rounded-2xl bg-navy-soft flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 text-navy" aria-hidden />
              </span>
              <div>
                <h2 className="text-base font-semibold text-navy">
                  {isID ? 'Preferensi notifikasi' : 'Notification preferences'}
                </h2>
                <p className="text-[13px] text-slate-600">
                  {isID ? 'Atur App dan email per kategori.' : 'Set App and email per category.'}
                </p>
              </div>
            </div>
            {loadingPrefs && <Loader2 className="w-4 h-4 text-navy animate-spin shrink-0 mt-1" aria-label={isID ? 'Memuat' : 'Loading'} />}
          </div>

          {prefsError && (
            <div role="alert" className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-[13px] font-medium flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
              {prefsError}
            </div>
          )}

          {loadingPrefs ? (
            <div className="space-y-2" aria-hidden>
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-11 rounded-xl bg-navy-soft/70 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div
                className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1"
                role="tablist"
                aria-label={isID ? 'Kategori notifikasi' : 'Notification category'}
              >
                {GUEST_EVENT_GROUPS.map((group) => {
                  const active = activeGroupKey === group.title.en;
                  return (
                    <button
                      key={group.title.en}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setActiveGroupKey(group.title.en)}
                      className={`min-h-10 px-3.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition-colors duration-200 cursor-pointer shrink-0 ${
                        active
                          ? 'bg-navy text-white'
                          : 'bg-navy-soft text-slate-600 hover:text-navy'
                      }`}
                    >
                      {isID ? group.title.id : group.title.en}
                    </button>
                  );
                })}
              </div>

              <AnimatePresence mode="wait" initial={false}>
                {GUEST_EVENT_GROUPS.filter((g) => g.title.en === activeGroupKey).map((group) => (
                  <motion.div
                    key={group.title.en}
                    role="tabpanel"
                    initial={reduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={fadeTween}
                    className="rounded-2xl border border-navy-soft overflow-hidden"
                  >
                    <div className="flex items-center justify-end px-3.5 sm:px-4 py-1.5 bg-[#F8FAFC] border-b border-navy-soft text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      <span className="w-12 text-center">{isID ? 'App' : 'App'}</span>
                      <span className="w-12 text-center">Email</span>
                    </div>
                    <div className="divide-y divide-navy-soft">
                      {group.events.map((eventType) => {
                        const pref = getPref(eventType);
                        const inAppKey = `${eventType}:inAppEnabled`;
                        const emailKey = `${eventType}:emailEnabled`;
                        const eventLabel = isID ? EVENT_TYPE_LABELS[eventType].id : EVENT_TYPE_LABELS[eventType].en;
                        return (
                          <div
                            key={eventType}
                            className="flex items-center justify-between gap-3 px-3.5 py-1 sm:px-4"
                          >
                            <span className="text-[13px] font-medium text-navy leading-snug min-w-0 truncate">
                              {eventLabel}
                            </span>
                            <div className="flex items-center shrink-0">
                              <Toggle
                                checked={pref.inAppEnabled}
                                loading={savingKey === inAppKey}
                                onChange={() => handleToggle(eventType, 'inAppEnabled')}
                                ariaLabel={`${eventLabel} · ${isID ? 'Aplikasi' : 'App'}`}
                              />
                              <Toggle
                                checked={pref.emailEnabled}
                                loading={savingKey === emailKey}
                                onChange={() => handleToggle(eventType, 'emailEnabled')}
                                ariaLabel={`${eventLabel} · Email`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
      )}

      <section className="p-5 sm:p-8 rounded-3xl bg-white border border-navy-soft shadow-[0_8px_28px_rgba(30,58,138,0.06)] space-y-5">
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-2xl bg-navy-soft flex items-center justify-center shrink-0">
            <Languages className="w-5 h-5 text-navy" aria-hidden />
          </span>
          <div>
            <h2 className="text-base font-semibold text-navy">
              {isID ? 'Bahasa' : 'Language'}
            </h2>
            <p className="text-[13px] text-slate-600">
              {isID ? 'Pilih bahasa antarmuka.' : 'Choose your interface language.'}
            </p>
          </div>
        </div>

        <LayoutGroup id="settings-lang">
          <div
            className="flex items-center p-1 bg-navy-soft rounded-full w-full sm:w-fit"
            role="radiogroup"
            aria-label={isID ? 'Bahasa' : 'Language'}
          >
            {([
              { id: 'ID' as const, label: 'Bahasa Indonesia' },
              { id: 'EN' as const, label: 'English' },
            ]).map((opt) => (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-checked={language === opt.id}
                onClick={() => onLanguageChange(opt.id)}
                className={`relative z-10 flex-1 sm:flex-none min-h-11 px-5 rounded-full text-[13px] font-semibold transition-colors duration-200 cursor-pointer ${
                  language === opt.id ? 'text-white' : 'text-slate-600 hover:text-navy'
                }`}
              >
                {language === opt.id && (
                  reduceMotion ? (
                    <span className="absolute inset-0 z-0 bg-navy rounded-full" />
                  ) : (
                    <motion.span
                      layoutId="settings-lang-pill"
                      className="absolute inset-0 z-0 bg-navy rounded-full"
                      transition={pillTween}
                    />
                  )
                )}
                <span className="relative z-10">{opt.label}</span>
              </button>
            ))}
          </div>
        </LayoutGroup>
      </section>

      {user && (
        <section className="p-5 sm:p-6 rounded-3xl bg-white border border-navy-soft shadow-[0_8px_28px_rgba(30,58,138,0.06)]">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full min-h-12 inline-flex items-center justify-center gap-2 rounded-xl border border-rose-100 bg-rose-50/60 hover:bg-rose-50 text-rose-700 text-[14px] font-semibold transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loggingOut ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
            ) : (
              <LogOut className="w-4 h-4" aria-hidden />
            )}
            {isID ? 'Keluar dari akun' : 'Sign out'}
          </button>
        </section>
      )}
    </div>
  );
};

function Toggle({
  checked,
  loading,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  loading: boolean;
  onChange: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      aria-busy={loading}
      disabled={loading}
      onClick={onChange}
      className="relative w-12 min-h-10 inline-flex items-center justify-center cursor-pointer disabled:cursor-wait"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 text-navy animate-spin" aria-hidden />
      ) : (
        <span className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${checked ? 'bg-navy' : 'bg-slate-200'}`}>
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
              checked ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </span>
      )}
    </button>
  );
}
