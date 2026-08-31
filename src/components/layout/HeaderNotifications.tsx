import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Tag, Clock, Receipt, ChevronRight } from 'lucide-react';
import { Notification } from '../../types';
import { parseNotificationMessage } from '../../lib/notificationFormatter';
import { NotificationDetailModal } from './NotificationDetailModal';

interface HeaderNotificationsProps {
  isID: boolean;
  notifications: Notification[];
  onMarkNotificationsRead: () => void;
  onMarkNotificationRead?: (notificationId: string) => void;
  onOpenInvoiceByCode?: (bookingCode: string) => void;
}

export const HeaderNotifications: React.FC<HeaderNotificationsProps> = ({
  isID,
  notifications,
  onMarkNotificationsRead,
  onMarkNotificationRead,
  onOpenInvoiceByCode,
}) => {
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setShowNotifMenu(!showNotifMenu)}
        type="button"
        aria-expanded={showNotifMenu}
        aria-haspopup="dialog"
        className="min-w-11 min-h-11 inline-flex items-center justify-center rounded-xl text-slate-500 hover:text-navy hover:bg-navy-soft transition-colors duration-200 cursor-pointer relative shrink-0"
        aria-label={isID ? 'Notifikasi' : 'Notifications'}
        title={isID ? 'Notifikasi' : 'Notifications'}
      >
        <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1.5 right-1.5 w-2 h-2 bg-gold rounded-full"
          />
        )}
      </button>

      <AnimatePresence>
        {showNotifMenu && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-label={isID ? 'Notifikasi' : 'Notifications'}
            className="absolute right-0 mt-3 w-80 sm:w-96 bg-white text-slate-900 rounded-2xl shadow-[0_16px_40px_rgba(30,58,138,0.14)] border border-navy-soft z-50 overflow-hidden origin-top-right"
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="font-semibold text-sm text-navy">
                {isID ? 'Notifikasi' : 'Notifications'}
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={onMarkNotificationsRead}
                  type="button"
                  className="text-[12px] text-slate-500 hover:text-navy font-medium cursor-pointer transition-colors duration-200"
                >
                  {isID ? 'Tandai dibaca' : 'Mark all read'}
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
              {notifications.length === 0 ? (
                <p className="p-8 text-center text-sm text-slate-400">
                  {isID ? 'Belum ada notifikasi.' : 'No notifications yet.'}
                </p>
              ) : (
                notifications.map((notif) => {
                  const parsed = parseNotificationMessage(notif.message);
                  return (
                    <div
                      key={notif.id}
                      onClick={() => {
                        setSelectedNotif(notif);
                        setShowNotifMenu(false);
                        onMarkNotificationRead?.(notif.id);
                      }}
                      className={`p-3.5 hover:bg-slate-50 transition-colors flex gap-3 cursor-pointer items-start ${
                        notif.unread ? 'bg-slate-50/60' : ''
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        notif.type === 'booking'
                          ? 'bg-emerald-50 text-emerald-600'
                          : notif.type === 'promo'
                          ? 'bg-gold-soft text-gold'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {notif.type === 'booking' ? (
                          <Receipt className="w-4 h-4" />
                        ) : notif.type === 'promo' ? (
                          <Tag className="w-4 h-4" />
                        ) : (
                          <Clock className="w-4 h-4" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-[12px] font-semibold text-slate-800 truncate leading-snug">
                            {notif.title}
                          </p>
                          <span className="text-[10px] text-slate-400 shrink-0">{notif.time}</span>
                        </div>

                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                          {parsed.cleanPreview}
                        </p>

                        {parsed.invoiceNumber && (
                          <span className="inline-block mt-1.5 px-2 py-0.5 rounded bg-teal-50 text-teal-700 text-[10px] font-mono font-medium border border-teal-100">
                            {parsed.invoiceNumber}
                          </span>
                        )}
                      </div>

                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0 self-center" />
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification Detail Modal */}
      <NotificationDetailModal
        notification={selectedNotif}
        onClose={() => setSelectedNotif(null)}
        isID={isID}
        onOpenInvoiceByCode={onOpenInvoiceByCode}
      />
    </div>
  );
};
