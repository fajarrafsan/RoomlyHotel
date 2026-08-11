import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  User, Bell, Mail, Languages, Loader2, AlertCircle, BadgeCheck, Hash
} from 'lucide-react';
import { Language } from '../../types';
import { NotificationEventType, NotificationPreferenceResponse } from '../../types/api';
import { useAuth } from '../../context/AuthContext';
  import { notificationPreferenceApi } from '../../api/notifications';
import { GUEST_EVENT_GROUPS, EVENT_TYPE_LABELS, ROLE_LABELS, NotificationEventGroup } from '../../lib/notificationLabels';

interface SettingsViewProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

const DEFAULT_PREF = { inAppEnabled: true, emailEnabled: true };

export const SettingsView: React.FC<SettingsViewProps> = ({ language, onLanguageChange }) => {
  const isID = language === 'ID';
  const { user } = useAuth();

  const [prefs, setPrefs] = useState<Map<NotificationEventType, { inAppEnabled: boolean; emailEnabled: boolean }>>(new Map());
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [prefsError, setPrefsError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

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

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20 px-4 sm:px-0">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-2"
      >
        <h1 className="text-3xl font-semibold text-slate-950 tracking-tight">
          {isID ? 'Pengaturan' : 'Settings'}
        </h1>
        <p className="text-[14px] text-slate-400 font-light">
          {isID ? 'Kelola profil, notifikasi, dan bahasa Anda.' : 'Manage your profile, notifications, and language.'}
        </p>
      </motion.div>

      {/* Profile */}
      <section className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-6">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center">
            <User className="w-5 h-5 text-slate-500" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {isID ? 'Informasi Akun' : 'Account Information'}
            </h2>
            <p className="text-[12px] text-slate-400 font-light">
              {isID ? 'Detail profil Roomly Anda' : 'Your Roomly profile details'}
            </p>
          </div>
        </div>

        {!user ? (
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 text-center">
            <p className="text-[13px] text-slate-400 font-light">
              {isID ? 'Masuk untuk melihat data akun Anda.' : 'Sign in to see your account data.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                {isID ? 'Nama Lengkap' : 'Full Name'}
              </span>
              <span className="text-[14px] font-semibold text-slate-900 block">{user.fullName}</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Email</span>
              <span className="text-[14px] font-semibold text-slate-900 block">{user.email}</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <BadgeCheck className="w-3 h-3" />{isID ? 'Peran' : 'Role'}
              </span>
              <span className="text-[14px] font-semibold text-slate-900 block">
                {ROLE_LABELS[user.role] ? (isID ? ROLE_LABELS[user.role].id : ROLE_LABELS[user.role].en) : user.role}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Hash className="w-3 h-3" />{isID ? 'ID Anggota' : 'Member ID'}
              </span>
              <span className="text-[14px] font-semibold text-slate-900 block">#{user.userId}</span>
            </div>
          </div>
        )}
      </section>

      {/* Notifications */}
      {user && (
        <section className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center">
                <Bell className="w-5 h-5 text-slate-500" />
              </span>
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  {isID ? 'Preferensi Notifikasi' : 'Notification Preferences'}
                </h2>
                <p className="text-[12px] text-slate-400 font-light">
                  {isID ? 'Pilih channel notifikasi yang Anda inginkan' : 'Choose which channels you want'}
                </p>
              </div>
            </div>
            {loadingPrefs && <Loader2 className="w-4 h-4 text-slate-300 animate-spin" />}
          </div>

          {prefsError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-[12px] font-medium flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {prefsError}
            </div>
          )}

          {!loadingPrefs && (
            <div className="space-y-8">
              {/* Column headers */}
              <div className="hidden sm:flex items-center justify-end gap-6 pr-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                <span className="w-16 flex items-center justify-center gap-1.5">
                  <Bell className="w-3 h-3" />{isID ? 'App' : 'App'}
                </span>
                <span className="w-16 flex items-center justify-center gap-1.5">
                  <Mail className="w-3 h-3" />Email
                </span>
              </div>

              {GUEST_EVENT_GROUPS.map((group: NotificationEventGroup) => (
                <div key={group.title.en} className="space-y-3">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.12em]">
                    {isID ? group.title.id : group.title.en}
                  </p>
                  <div className="rounded-2xl border border-slate-100 divide-y divide-slate-50 overflow-hidden">
                    {group.events.map((eventType: NotificationEventType) => {
                      const pref = getPref(eventType);
                      const inAppKey = `${eventType}:inAppEnabled`;
                      const emailKey = `${eventType}:emailEnabled`;
                      return (
                        <div
                          key={eventType}
                          className="flex items-center justify-between px-5 py-4 hover:bg-slate-50/50 transition-colors"
                        >
                          <span className="text-[13px] font-medium text-slate-700">
                            {isID ? EVENT_TYPE_LABELS[eventType].id : EVENT_TYPE_LABELS[eventType].en}
                          </span>
                          <div className="flex items-center gap-6 sm:gap-6">
                            <Toggle
                              checked={pref.inAppEnabled}
                              loading={savingKey === inAppKey}
                              onChange={() => handleToggle(eventType, 'inAppEnabled')}
                              label={isID ? 'App' : 'App'}
                            />
                            <Toggle
                              checked={pref.emailEnabled}
                              loading={savingKey === emailKey}
                              onChange={() => handleToggle(eventType, 'emailEnabled')}
                              label="Email"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Language */}
      <section className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-6">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center">
            <Languages className="w-5 h-5 text-slate-500" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {isID ? 'Bahasa' : 'Language'}
            </h2>
            <p className="text-[12px] text-slate-400 font-light">
              {isID ? 'Pilih bahasa antarmuka' : 'Choose your interface language'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-1.5 bg-slate-50 rounded-2xl border border-slate-100 w-fit">
          <button
            onClick={() => onLanguageChange('ID')}
            className={`px-6 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 ${
              language === 'ID'
                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Bahasa Indonesia
          </button>
          <button
            onClick={() => onLanguageChange('EN')}
            className={`px-6 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 ${
              language === 'EN'
                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            English
          </button>
        </div>
      </section>
    </div>
  );
};

// ─── Custom Toggle Switch ───
function Toggle({
  checked,
  loading,
  onChange,
  label
}: {
  checked: boolean;
  loading: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 sm:w-16">
      <span className="sm:hidden text-[10px] font-medium text-slate-400">{label}</span>
      {loading ? (
        <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
      ) : (
        <button
          onClick={onChange}
          className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
            checked ? 'bg-slate-900' : 'bg-slate-200'
          }`}
          aria-checked={checked}
          role="switch"
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
              checked ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      )}
    </div>
  );
}