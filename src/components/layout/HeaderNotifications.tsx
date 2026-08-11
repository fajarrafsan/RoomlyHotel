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
        className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer relative shrink-0"
        title={isID ? 'Notifikasi' : 'Notifications'}
      >
        <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-2 h-2 bg-amber-500 rounded-full"
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
            className="absolute right-0 mt-3 w-80 sm:w-96 bg-white text-slate-900 rounded-2xl shadow-2xl shadow-slate-900/10 border border-slate-100 z-50 overflow-hidden origin-top-right"
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="font-semibold text-sm text-slate-900">
                {isID ? 'Notifikasi' : 'Notifications'}
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={onMarkNotificationsRead}
                  className="text-[11px] text-slate-500 hover:text-slate-900 font-medium cursor-pointer transition-colors"
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
                          ? 'bg-amber-50 text-amber-600'
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
