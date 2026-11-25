import React, { useEffect, useId, useRef, useState } from 'react';
import { motion, AnimatePresence, LayoutGroup, useReducedMotion } from 'motion/react';
import {
  AlertCircle, Bell, CalendarCheck, Check, CreditCard, KeyRound, Loader2, LogIn, LogOut, LucideIcon, ReceiptText, Star, Undo2,
} from 'lucide-react';
import { Language } from '../types';
import { NotificationEventType, NotificationPreferenceResponse } from '../types/api';
import { LOGOUT_REQUEST_EVENT, useAuth } from '../context/AuthContext';
import { notificationPreferenceApi } from '../api/notifications';
import { GUEST_EVENT_GROUPS, EVENT_TYPE_LABELS, ROLE_LABELS } from '../lib/notificationLabels';
import { fadeTween, pillTween } from '../lib/motion';

interface SettingsPageProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenAuth?: () => void;
}

const DEFAULT_PREF = { inAppEnabled: true, emailEnabled: true };
const SAVED_NOTICE_MS = 2500;

const GROUP_ICONS: Record<string, LucideIcon> = {
  Booking: CalendarCheck,
  Payment: CreditCard,
  Refunds: Undo2,
  Invoices: ReceiptText,
  'Check-in & Check-out': KeyRound,
  Reviews: Star,
};

const cardClass = 'rounded-[26px] border border-slate-200/80 bg-white shadow-[0_12px_36px_rgba(15,35,68,0.06)]';
const accountGridClass = 'relative z-10 mx-auto -mt-16 grid max-w-[1180px] items-start gap-4 px-4 sm:gap-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:grid-rows-[auto_1fr] lg:gap-6 lg:px-10';
const pulseClass = 'animate-pulse motion-reduce:animate-none';

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'R';
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ language, onLanguageChange, onOpenAuth }) => {
  const isID = language === 'ID';
  const { user, isLoading: authLoading, requestLogout, isLoggingOut, logoutRequested } = useAuth();
  const reduceMotion = useReducedMotion();
  const tabsId = useId();

  const [prefs, setPrefs] = useState<Map<NotificationEventType, { inAppEnabled: boolean; emailEnabled: boolean }>>(new Map());
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [prefsError, setPrefsError] = useState<'load' | 'save' | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const savedTimer = useRef<number | undefined>(undefined);
  const mounted = useRef(false);
  const currentUser = useRef(user);
  currentUser.current = user;
  const prefsRequest = useRef(0);
  const saveInFlight = useRef(false);
  const queuedLogout = useRef(false);
  const [logoutQueued, setLogoutQueued] = useState(false);
  const [prefsReload, setPrefsReload] = useState(0);
  const [activeGroupKey, setActiveGroupKey] = useState(GUEST_EVENT_GROUPS[0].title.en);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      prefsRequest.current += 1;
      saveInFlight.current = false;
      queuedLogout.current = false;
      window.clearTimeout(savedTimer.current);
    };
  }, []);

  useEffect(() => {
    const request = ++prefsRequest.current;
    const account = user;
    let cancelled = false;
    const isCurrent = () => !cancelled && mounted.current && currentUser.current === account && prefsRequest.current === request;
    window.clearTimeout(savedTimer.current);
    saveInFlight.current = false;
    queuedLogout.current = false;
    setLogoutQueued(false);
    setSavingKey(null);
    setJustSaved(false);
    setPrefs(new Map());
    setPrefsError(null);
    if (!user) {
      setLoadingPrefs(false);
      return;
    }
    setLoadingPrefs(true);
    notificationPreferenceApi.list()
      .then((rows) => {
        if (!isCurrent()) return;
        const map = new Map<NotificationEventType, { inAppEnabled: boolean; emailEnabled: boolean }>();
        rows.forEach((r: NotificationPreferenceResponse) => map.set(r.eventType, { inAppEnabled: r.inAppEnabled, emailEnabled: r.emailEnabled }));
        setPrefs(map);
      })
      .catch((err) => {
        if (!isCurrent()) return;
        console.error('Failed to load notification preferences', err);
        setPrefsError('load');
      })
      .finally(() => { if (isCurrent()) setLoadingPrefs(false); });
    return () => { cancelled = true; };
  }, [user, prefsReload]);

  useEffect(() => {
    const holdLogoutDuringSave = (event: Event) => {
      if (!saveInFlight.current) return;
      event.preventDefault();
      queuedLogout.current = true;
      setLogoutQueued(true);
    };
    window.addEventListener(LOGOUT_REQUEST_EVENT, holdLogoutDuringSave);
    return () => window.removeEventListener(LOGOUT_REQUEST_EVENT, holdLogoutDuringSave);
  }, []);

  const getPref = (eventType: NotificationEventType) => prefs.get(eventType) || DEFAULT_PREF;

  const handleToggle = async (eventType: NotificationEventType, channel: 'inAppEnabled' | 'emailEnabled') => {
    if (!user || loadingPrefs || prefsError === 'load' || saveInFlight.current || isLoggingOut || logoutRequested) return;
    const account = user;
    const request = prefsRequest.current;
    const isCurrent = () => mounted.current && currentUser.current === account && prefsRequest.current === request;
    const current = getPref(eventType);
    const next = { ...current, [channel]: !current[channel] };
    const key = `${eventType}:${channel}`;

    saveInFlight.current = true;
    window.clearTimeout(savedTimer.current);
    setPrefs((prev) => new Map(prev).set(eventType, next));
    setSavingKey(key);
    setPrefsError(null);
    setJustSaved(false);
    try {
      const saved = await notificationPreferenceApi.update({ eventType, inAppEnabled: next.inAppEnabled, emailEnabled: next.emailEnabled });
      if (!isCurrent()) return;
      setPrefs((prev) => new Map(prev).set(eventType, { inAppEnabled: saved.inAppEnabled, emailEnabled: saved.emailEnabled }));
      setJustSaved(true);
      savedTimer.current = window.setTimeout(() => { if (isCurrent()) setJustSaved(false); }, SAVED_NOTICE_MS);
    } catch (err) {
      if (!isCurrent()) return;
      console.error('Failed to update notification preference', err);
      setPrefs((prev) => new Map(prev).set(eventType, current));
      setPrefsError('save');
    } finally {
      if (isCurrent()) {
        saveInFlight.current = false;
        setSavingKey(null);
        if (queuedLogout.current) {
          queuedLogout.current = false;
          setLogoutQueued(false);
          requestLogout();
        }
      }
    }
  };

  const roleLabel = user
    ? (ROLE_LABELS[user.role] ? (isID ? ROLE_LABELS[user.role].id : ROLE_LABELS[user.role].en) : user.role)
    : '';

  const profileFields = user
    ? [
        { label: isID ? 'Nama lengkap' : 'Full name', value: user.fullName },
        { label: 'Email', value: user.email },
        { label: isID ? 'Peran' : 'Role', value: roleLabel },
        { label: isID ? 'ID anggota' : 'Member ID', value: `#${user.userId}` },
      ]
    : [];

  const activeIndex = Math.max(0, GUEST_EVENT_GROUPS.findIndex((group) => group.title.en === activeGroupKey));
  const activeGroup = GUEST_EVENT_GROUPS[activeIndex];

  const onTabKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const forward = event.key === 'ArrowDown' || event.key === 'ArrowRight';
    const backward = event.key === 'ArrowUp' || event.key === 'ArrowLeft';
    if (!forward && !backward) return;
    event.preventDefault();
    const count = GUEST_EVENT_GROUPS.length;
    const nextIndex = (activeIndex + (forward ? 1 : -1) + count) % count;
    setActiveGroupKey(GUEST_EVENT_GROUPS[nextIndex].title.en);
    document.getElementById(`${tabsId}-tab-${nextIndex}`)?.focus();
  };

  const languageSection = (className: string) => (
    <section className={`${cardClass} p-5 sm:p-6 ${className}`} aria-labelledby="settings-language" data-settings-language>
      <h2 id="settings-language" className="font-serif text-[21px] leading-tight tracking-[-0.02em] text-navy-dark">{isID ? 'Bahasa' : 'Language'}</h2>
      <p className="mb-4 mt-1 text-sm leading-5 text-slate-600">{isID ? 'Pilih bahasa tampilan Roomly.' : 'Choose the language Roomly uses.'}</p>
      <LayoutGroup id="settings-lang">
        <div className="flex gap-0.5 rounded-xl bg-slate-100 p-1" role="radiogroup" aria-label={isID ? 'Bahasa' : 'Language'}>
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
              className={`relative min-h-11 flex-1 cursor-pointer rounded-[10px] px-2 text-[13.5px] font-semibold transition-colors duration-200 ${language === opt.id ? 'text-navy-dark' : 'text-slate-500 hover:text-navy-dark'}`}
            >
              {language === opt.id && (
                reduceMotion
                  ? <span className="absolute inset-0 rounded-[10px] bg-white shadow-[0_1px_4px_rgba(21,42,102,0.16)]" />
                  : <motion.span layoutId="settings-lang-pill" className="absolute inset-0 rounded-[10px] bg-white shadow-[0_1px_4px_rgba(21,42,102,0.16)]" transition={pillTween} />
              )}
              <span className="relative">{opt.label}</span>
            </button>
          ))}
        </div>
      </LayoutGroup>
    </section>
  );

  return (
    <div className="settings-page -mx-4 -mt-6 min-h-screen bg-slate-50 pb-16 sm:-mx-6 lg:-mx-8" data-settings-page>
      <section
        className="relative isolate overflow-hidden rounded-b-[28px] bg-[#10253f] bg-[radial-gradient(110%_90%_at_88%_-20%,rgba(228,192,120,0.16),transparent_62%),radial-gradient(85%_80%_at_-5%_118%,rgba(30,58,138,0.42),transparent_64%)] sm:rounded-b-[36px]"
        aria-labelledby="settings-heading"
        data-settings-hero
      >
        <motion.div
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={fadeTween}
          className="mx-auto flex max-w-[1180px] items-center gap-4 px-5 pb-[96px] pt-8 sm:gap-6 sm:px-8 sm:pb-[104px] sm:pt-11 lg:px-10"
        >
          {user && (
            <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-white/10 font-serif text-[22px] text-gold-light ring-1 ring-inset ring-gold-light/40 sm:size-20 sm:text-[27px]" aria-hidden>
              {initials(user.fullName)}
            </div>
          )}
          <div className="min-w-0">
            <p className="mb-2 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.19em] text-gold-light">
              <span className="h-px w-7 bg-gold-light/60" aria-hidden />
              {isID ? 'Pengaturan akun' : 'Account settings'}
            </p>
            <h1 id="settings-heading" className="break-words font-serif text-[32px] leading-[1.14] tracking-[-0.035em] text-white sm:text-[42px]">
              {user
                ? <>{isID ? 'Halo,' : 'Hello,'} <span className="italic text-gold-light">{user.fullName.trim().split(/\s+/)[0]}.</span></>
                : isID
                  ? <>Pengaturan <span className="italic text-gold-light">akunmu.</span></>
                  : <>Your account <span className="italic text-gold-light">settings.</span></>}
            </h1>
            {!authLoading && (
              <p className="mt-2 max-w-[520px] text-sm leading-6 text-white/80 sm:text-[15px]">
                {user
                  ? (isID ? 'Atur kabar yang ingin kamu terima dan bahasa yang kamu pakai.' : 'Choose what you hear about and the language you use.')
                  : (isID ? 'Masuk untuk melihat profil dan mengatur notifikasimu.' : 'Sign in to see your profile and manage notifications.')}
              </p>
            )}
            {!authLoading && !user && onOpenAuth && (
              <button
                type="button"
                onClick={onOpenAuth}
                className="mt-4 inline-flex min-h-12 cursor-pointer items-center justify-center gap-2.5 rounded-xl bg-gold px-6 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(161,98,7,0.15)] transition-colors duration-200 hover:bg-gold-dark"
              >
                <LogIn className="size-4" aria-hidden />
                {isID ? 'Masuk' : 'Sign in'}
              </button>
            )}
          </div>
        </motion.div>
      </section>

      {authLoading ? (
        <div className={accountGridClass} role="status" aria-busy="true" aria-label={isID ? 'Memuat pengaturan' : 'Loading settings'}>
          <div className={`${cardClass} ${pulseClass} h-[372px] lg:col-start-2 lg:row-start-1`} />
          <div className={`${cardClass} ${pulseClass} h-[480px] lg:col-start-1 lg:row-span-2 lg:row-start-1`} />
          <div className={`${cardClass} ${pulseClass} h-[168px] lg:col-start-2 lg:row-start-2`} />
        </div>
      ) : user ? (
        <div className={accountGridClass}>
          <section className={`${cardClass} p-5 sm:p-6 lg:col-start-2 lg:row-start-1`} aria-labelledby="settings-profile" data-settings-profile>
            <h2 id="settings-profile" className="font-serif text-[21px] leading-tight tracking-[-0.02em] text-navy-dark">{isID ? 'Profil' : 'Profile'}</h2>
            <dl className="mt-2 divide-y divide-slate-100">
              {profileFields.map(({ label, value }) => (
                <div key={label} className="py-2.5">
                  <dt className="text-xs leading-5 text-slate-500">{label}</dt>
                  <dd className="truncate text-[15px] font-semibold leading-6 text-navy-dark" title={value}>{value}</dd>
                </div>
              ))}
            </dl>
            <button
              type="button"
              onClick={requestLogout}
              disabled={isLoggingOut || !!savingKey || logoutRequested}
              className="mt-2 inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-semibold text-rose-700 transition-colors duration-200 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoggingOut ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <LogOut className="size-4" aria-hidden />}
              {isLoggingOut ? (isID ? 'Sedang keluar...' : 'Signing out...') : (isID ? 'Keluar dari akun' : 'Sign out')}
            </button>
            {!!savingKey && <p className="mt-1 text-center text-xs leading-5 text-slate-500" role="status" aria-live="polite" data-settings-logout-wait>{logoutQueued
              ? (isID ? 'Pengaturan sedang disimpan. Konfirmasi keluar akan muncul setelah selesai.' : 'Your settings are being saved. Sign-out confirmation will appear once that finishes.')
              : (isID ? 'Tunggu pengaturan selesai disimpan sebelum keluar.' : 'Wait for your settings to finish saving before signing out.')}</p>}
          </section>

          <section className={`${cardClass} overflow-hidden lg:col-start-1 lg:row-span-2 lg:row-start-1`} aria-labelledby="settings-notifications" data-settings-notifications>
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5">
              <div className="min-w-0">
                <h2 id="settings-notifications" className="font-serif text-[22px] leading-tight tracking-[-0.02em] text-navy-dark">{isID ? 'Preferensi notifikasi' : 'Notification preferences'}</h2>
                <p className="mt-1 text-sm leading-5 text-slate-600">{isID ? 'Pilih kabar yang ingin kamu terima, di aplikasi atau lewat email.' : 'Choose what you hear about, in the app or by email.'}</p>
              </div>
              <p className="flex min-h-6 shrink-0 items-center gap-1.5 whitespace-nowrap text-xs font-medium text-slate-500" role="status" aria-live="polite" data-settings-save-status>
                {loadingPrefs
                  ? <><Loader2 className="size-3.5 animate-spin" aria-hidden />{isID ? 'Memuat...' : 'Loading...'}</>
                  : prefsError === 'load'
                    ? <span>{isID ? 'Belum dimuat' : 'Not loaded'}</span>
                  : savingKey
                  ? <><Loader2 className="size-3.5 animate-spin" aria-hidden />{isID ? 'Menyimpan...' : 'Saving...'}</>
                  : justSaved
                    ? <><Check className="size-3.5 text-emerald-600" aria-hidden />{isID ? 'Tersimpan' : 'Saved'}</>
                    : <span className="max-sm:hidden">{isID ? 'Tersimpan otomatis' : 'Saves automatically'}</span>}
              </p>
            </div>

            {prefsError && (
              <div role="alert" className="mx-4 mt-4 flex items-start gap-2.5 rounded-xl border border-rose-100 bg-rose-50 p-3.5 text-[13px] font-medium text-rose-700 sm:mx-6">
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                <div className="min-w-0">
                  <p>{prefsError === 'load'
                    ? (isID ? 'Gagal memuat preferensi notifikasi. Pilihan belum dapat ditampilkan.' : 'Notification preferences could not be loaded. Your choices cannot be displayed yet.')
                    : (isID ? 'Perubahan belum tersimpan. Pilihan sebelumnya sudah dikembalikan. Coba lagi.' : 'The change was not saved. Your previous choice has been restored. Please try again.')}</p>
                  {prefsError === 'load' && <button type="button" onClick={() => setPrefsReload(value => value + 1)} className="mt-2 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-rose-200 bg-white px-3 font-semibold transition-colors hover:bg-rose-100"><Undo2 className="size-3.5" aria-hidden />{isID ? 'Muat ulang preferensi' : 'Reload preferences'}</button>}
                </div>
              </div>
            )}

            {loadingPrefs ? (
              <div className="space-y-2.5 p-4 sm:p-6" aria-hidden>
                {[0, 1, 2, 3].map((i) => <div key={i} className={`${pulseClass} h-12 rounded-xl bg-slate-100`} />)}
              </div>
            ) : prefsError === 'load' ? (
              <div className="px-5 pb-6 pt-4 text-sm leading-6 text-slate-500 sm:px-6">{isID ? 'Pengaturan notifikasi hanya dapat diubah setelah data akun berhasil dimuat.' : 'Notification settings can be changed once your account preferences have loaded.'}</div>
            ) : (
              <div className="md:flex">
                <div
                  className="explore-no-scrollbar flex gap-2 overflow-x-auto border-b border-slate-100 px-4 py-3 sm:px-6 md:w-[232px] md:shrink-0 md:flex-col md:gap-1 md:overflow-visible md:border-b-0 md:border-r md:p-3"
                  role="tablist"
                  aria-label={isID ? 'Kategori notifikasi' : 'Notification category'}
                  onKeyDown={onTabKeyDown}
                >
                  {GUEST_EVENT_GROUPS.map((group, index) => {
                    const active = index === activeIndex;
                    const Icon = GROUP_ICONS[group.title.en] ?? Bell;
                    const enabled = group.events.filter((eventType) => {
                      const pref = getPref(eventType);
                      return pref.inAppEnabled || pref.emailEnabled;
                    }).length;
                    return (
                      <button
                        key={group.title.en}
                        id={`${tabsId}-tab-${index}`}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        aria-controls={`${tabsId}-panel`}
                        tabIndex={active ? 0 : -1}
                        onClick={() => setActiveGroupKey(group.title.en)}
                        className={`flex shrink-0 cursor-pointer items-center text-left transition-colors duration-200 max-md:min-h-11 max-md:gap-2 max-md:rounded-full max-md:border max-md:px-3.5 md:min-h-[60px] md:w-full md:gap-3 md:rounded-2xl md:px-2.5 md:py-2 ${active ? 'max-md:border-navy-dark max-md:bg-navy-dark max-md:text-white md:bg-navy-soft/60 md:text-navy-dark' : 'max-md:border-slate-200 max-md:text-slate-600 md:text-slate-600 md:hover:bg-slate-50 md:hover:text-navy-dark'}`}
                      >
                        <span className={`flex shrink-0 items-center justify-center transition-colors duration-200 md:size-9 md:rounded-full ${active ? 'text-gold-light md:bg-navy-dark' : 'text-gold md:bg-slate-100 md:text-slate-500'}`}>
                          <Icon className="size-4" aria-hidden />
                        </span>
                        <span className="min-w-0">
                          <span className="block whitespace-nowrap text-[13.5px] font-semibold leading-5 md:whitespace-normal md:text-sm">{isID ? group.title.id : group.title.en}</span>
                          <span className="hidden text-xs leading-4 text-slate-500 md:block">{enabled} {isID ? 'dari' : 'of'} {group.events.length} {isID ? 'aktif' : 'on'}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>

                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={activeGroup.title.en}
                    id={`${tabsId}-panel`}
                    role="tabpanel"
                    aria-labelledby={`${tabsId}-tab-${activeIndex}`}
                    initial={reduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={reduceMotion ? { duration: 0 } : fadeTween}
                    className="min-w-0 flex-1 px-4 pb-2 sm:px-6 max-md:min-h-[340px]"
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-2.5">
                      <h3 className="min-w-0 font-serif text-lg tracking-[-0.01em] text-navy-dark">{isID ? activeGroup.title.id : activeGroup.title.en}</h3>
                      <div className="flex shrink-0 text-center text-xs font-semibold text-slate-500" aria-hidden>
                        <span className="w-[60px]">{isID ? 'Aplikasi' : 'App'}</span>
                        <span className="w-[60px]">Email</span>
                      </div>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {activeGroup.events.map((eventType) => {
                        const pref = getPref(eventType);
                        const inAppKey = `${eventType}:inAppEnabled`;
                        const emailKey = `${eventType}:emailEnabled`;
                        const eventLabel = isID ? EVENT_TYPE_LABELS[eventType].id : EVENT_TYPE_LABELS[eventType].en;
                        return (
                          <div key={eventType} className="flex min-h-14 items-center justify-between gap-2 py-1">
                            <span className="min-w-0 text-[14.5px] font-medium leading-snug text-navy-dark">{eventLabel}</span>
                            <div className="flex shrink-0 items-center">
                              <Toggle
                                checked={pref.inAppEnabled}
                                loading={savingKey === inAppKey}
                                disabled={!!savingKey || isLoggingOut || logoutRequested}
                                onChange={() => handleToggle(eventType, 'inAppEnabled')}
                                ariaLabel={`${eventLabel} · ${isID ? 'Aplikasi' : 'App'}`}
                              />
                              <Toggle
                                checked={pref.emailEnabled}
                                loading={savingKey === emailKey}
                                disabled={!!savingKey || isLoggingOut || logoutRequested}
                                onChange={() => handleToggle(eventType, 'emailEnabled')}
                                ariaLabel={`${eventLabel} · Email`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            )}
          </section>

          {languageSection('lg:col-start-2 lg:row-start-2')}
        </div>
      ) : (
        <div className="relative z-10 mx-auto -mt-16 max-w-[560px] px-4 sm:px-8">
          {languageSection('')}
        </div>
      )}
    </div>
  );
};

function Toggle({
  checked,
  loading,
  disabled = false,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  loading: boolean;
  disabled?: boolean;
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
      disabled={loading || disabled}
      onClick={onChange}
      className={`group/toggle relative inline-flex min-h-11 w-[60px] cursor-pointer items-center justify-center disabled:cursor-not-allowed ${disabled && !loading ? 'opacity-45' : ''}`}
    >
      <span className={`relative h-6 w-11 rounded-full transition-colors duration-200 motion-reduce:transition-none ${checked ? 'bg-navy-dark' : 'bg-slate-400 group-hover/toggle:bg-slate-500'}`}>
        <span className={`absolute left-0.5 top-0.5 flex size-5 items-center justify-center rounded-full bg-white shadow-[0_1px_3px_rgba(15,35,68,0.3)] transition-transform duration-200 motion-reduce:transition-none ${checked ? 'translate-x-5' : 'translate-x-0'}`}>
          {loading
            ? <Loader2 className="size-3 animate-spin text-navy" aria-hidden />
            : checked && <Check className="size-3 text-navy-dark" strokeWidth={3} aria-hidden />}
        </span>
      </span>
    </button>
  );
}
