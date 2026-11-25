import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowLeft, ArrowRight, Bell, BellOff, CheckCheck, ChevronRight, CreditCard, FileText, Receipt, Tag, X,
} from 'lucide-react';
import { fadeTween } from '../../lib/motion';
import { parseNotificationMessage } from '../../lib/notificationFormatter';
import { ADMIN_PATHS } from '../../lib/routes';
import type { Notification } from '../../types';
import { NotificationDetails } from './NotificationDetails';

interface HeaderNotificationsProps {
  isID: boolean;
  isAdmin?: boolean;
  onOpen?: () => void;
  notifications: Notification[];
  onMarkNotificationsRead: () => void;
  onMarkNotificationRead?: (notificationId: string) => void;
  onOpenInvoiceByCode?: (bookingCode: string) => void;
}

const mobileBreakpoint = '(max-width: 639px)';
const iconButton = 'inline-grid size-11 shrink-0 cursor-pointer place-items-center rounded-xl border border-slate-200 bg-white text-navy-dark hover:bg-navy-soft';

function NotificationIcon({ notification }: { notification: Notification }) {
  const type = notification.notificationType;
  const isInvoice = type.startsWith('INVOICE_') || notification.referenceType === 'INVOICE';
  const isPayment = type.startsWith('PAYMENT_') || type.startsWith('REFUND_');
  const Icon = isInvoice ? FileText : isPayment ? CreditCard : notification.type === 'booking' ? Receipt : notification.type === 'promo' ? Tag : Bell;
  const tone = isInvoice ? 'bg-[#eeeafa] text-[#5a477e]'
    : isPayment || notification.type === 'booking' ? 'bg-[#e5f2ec] text-[#27644d]'
      : notification.type === 'promo' ? 'bg-gold-soft text-gold-dark' : 'bg-navy-soft text-navy-dark';
  return <span className={`grid size-9 shrink-0 place-items-center rounded-[11px] ${tone}`}><Icon className="size-4" aria-hidden /></span>;
}

export function HeaderNotifications({ isID, isAdmin, onOpen, notifications, onMarkNotificationsRead, onMarkNotificationRead, onOpenInvoiceByCode }: HeaderNotificationsProps) {
  const [open, setOpen] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobile, setMobile] = useState(() => window.matchMedia(mobileBreakpoint).matches);
  const [position, setPosition] = useState({ top: 76, right: 16, width: 420, maxHeight: 560 });
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const detailHeading = useRef<HTMLHeadingElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const filter = useRef<HTMLButtonElement>(null);
  const lastItem = useRef<string | null>(null);
  const scrollTop = useRef(0);
  const panelId = useId();
  const titleId = useId();
  const reduceMotion = useReducedMotion();
  const { key: locationKey } = useLocation();
  const unread = notifications.filter(item => item.unread);
  const rows = unreadOnly ? unread : notifications;
  const selected = notifications.find(item => item.id === selectedId);
  const parsed = selected ? parseNotificationMessage(selected.message) : null;
  const invoiceBooking = parsed?.bookingCode && (parsed.invoiceNumber || selected?.referenceType === 'INVOICE'
    || selected?.notificationType === 'INVOICE_ISSUED') ? parsed.bookingCode : null;
  const label = isID ? 'Notifikasi' : 'Notifications';
  const unreadText = isID ? `${unread.length} belum dibaca` : `${unread.length} unread`;

  const updatePosition = useCallback(() => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    const isMobile = window.matchMedia(mobileBreakpoint).matches;
    setMobile(isMobile);
    const anchor = trigger.current?.getBoundingClientRect();
    if (!anchor || isMobile) return;
    const width = Math.min(420, viewportWidth - 24);
    const top = Math.min(anchor.bottom + 10, Math.max(12, viewportHeight - 300));
    setPosition({
      width, top,
      right: Math.max(12, Math.min(viewportWidth - anchor.right, viewportWidth - width - 12)),
      maxHeight: Math.min(580, viewportHeight - top - 12),
    });
  }, []);

  const closePanel = useCallback(() => {
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => { setOpen(false); }, [locationKey]);

  useLayoutEffect(() => {
    if (!open) return;
    if (selected) {
      detailHeading.current?.focus({ preventScroll: true });
      return;
    }
    if (list.current) list.current.scrollTop = scrollTop.current;
    if (lastItem.current) {
      const item = list.current?.querySelector<HTMLButtonElement>(`[data-notification-id="${CSS.escape(lastItem.current)}"]`);
      (item ?? filter.current ?? panel.current)?.focus({ preventScroll: true });
      lastItem.current = null;
    } else {
      panel.current?.focus({ preventScroll: true });
    }
  }, [open, selected?.id]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    if (mobile) document.body.style.overflow = 'hidden';
    const onOutsidePointer = (event: PointerEvent) => {
      if (!mobile && event.target instanceof Node && !panel.current?.contains(event.target) && !trigger.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    const onFocus = (event: FocusEvent) => {
      if (!mobile && event.target instanceof Node && !panel.current?.contains(event.target) && !trigger.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopImmediatePropagation();
        closePanel();
      }
      if (event.key !== 'Tab' || !mobile || !panel.current) return;
      const controls = Array.from(panel.current.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], [tabindex="0"]'));
      const first = controls[0];
      const last = controls.at(-1);
      const active = document.activeElement as HTMLElement | null;
      if (!active || !controls.includes(active) || (event.shiftKey ? active === first : active === last)) {
        event.preventDefault();
        (event.shiftKey ? last : first)?.focus();
      }
    };
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, { passive: true });
    window.visualViewport?.addEventListener('resize', updatePosition);
    window.addEventListener('keydown', onKey, true);
    document.addEventListener('pointerdown', onOutsidePointer);
    document.addEventListener('focusin', onFocus);
    return () => {
      if (mobile) document.body.style.overflow = previousOverflow;
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
      window.visualViewport?.removeEventListener('resize', updatePosition);
      window.removeEventListener('keydown', onKey, true);
      document.removeEventListener('pointerdown', onOutsidePointer);
      document.removeEventListener('focusin', onFocus);
    };
  }, [open, mobile, closePanel, updatePosition]);

  const selectFilter = (onlyUnread: boolean) => {
    scrollTop.current = 0;
    if (list.current) list.current.scrollTop = 0;
    setUnreadOnly(onlyUnread);
  };
  const openDetails = (notification: Notification) => {
    lastItem.current = notification.id;
    scrollTop.current = list.current?.scrollTop ?? 0;
    setSelectedId(notification.id);
    if (notification.unread) onMarkNotificationRead?.(notification.id);
  };
  const transition = reduceMotion ? { duration: 0 } : fadeTween;

  return (
    <div className="relative shrink-0">
      <button ref={trigger} type="button" onClick={() => {
        if (open) {
          closePanel();
          return;
        }
        updatePosition();
        onOpen?.();
        scrollTop.current = 0;
        lastItem.current = null;
        setUnreadOnly(false);
        setSelectedId(null);
        setOpen(true);
      }} aria-expanded={open} aria-controls={open ? panelId : undefined} aria-haspopup="dialog"
        aria-label={label} title={label}
        className={`relative inline-flex size-11 shrink-0 cursor-pointer items-center justify-center border transition-colors ${isAdmin
          ? `rounded-xl border-white/20 text-white ${open ? 'bg-white/20' : 'bg-white/5 hover:bg-white/15'}`
          : `rounded-full ${open ? 'border-navy/25 bg-navy-soft/60 text-navy-dark' : 'border-[#e4e7ec] bg-white text-slate-500 hover:border-navy/25 hover:bg-slate-50 hover:text-navy-dark'}`}`}>
        <Bell className="size-[18px]" aria-hidden />
        {unread.length > 0 && (
          <span aria-hidden className={`absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 px-1 text-[9px] font-bold leading-none ${isAdmin ? 'border-[#172953] bg-gold-soft text-navy-dark' : 'border-white bg-gold text-white'}`}>
            {unread.length > 9 ? '9+' : unread.length}
          </span>
        )}
      </button>

      {createPortal(
        <AnimatePresence>
          {open && mobile && <motion.div key="scrim" aria-hidden onClick={closePanel} className="fixed inset-0 z-[69] bg-slate-950/50 backdrop-blur-[2px]"
            initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, pointerEvents: 'none' }} transition={transition} />}
          {open && (
            <motion.div key="notifications" ref={panel} id={panelId} role="dialog" aria-modal={mobile || undefined} aria-labelledby={titleId} tabIndex={-1}
              initial={reduceMotion ? false : { opacity: 0, y: mobile ? 24 : -5 }}
              animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: mobile ? 16 : -4, pointerEvents: 'none' }} transition={transition}
              style={mobile ? undefined : position}
              className={`notification-panel fixed z-[70] flex min-w-0 flex-col overflow-hidden border border-slate-200 bg-white text-slate-800 shadow-[0_20px_60px_rgba(10,27,59,0.2)] outline-none
                ${mobile ? 'inset-x-0 bottom-0 max-h-[min(86dvh,40rem)] rounded-t-[24px] pb-[env(safe-area-inset-bottom)]' : 'rounded-[21px]'}`}>
              <header className="flex shrink-0 items-center gap-2.5 border-b border-slate-200 bg-[#fafbfd] px-3.5 py-3 sm:px-4">
                {selected ? <button type="button" onClick={() => setSelectedId(null)} aria-label={isID ? 'Kembali ke notifikasi' : 'Back to notifications'} className={iconButton}>
                  <ArrowLeft className="size-4" aria-hidden />
                </button> : <span className="hidden size-10 shrink-0 place-items-center rounded-xl border border-[#eadbc0] bg-[#fbf5e8] text-[#885d1e] min-[360px]:grid">
                  <Bell className="size-[17px]" aria-hidden />
                </span>}
                <div className="min-w-0 flex-1">
                  <h2 id={titleId} className="font-serif text-[23px] leading-tight tracking-tight text-[#162951]">
                    {selected ? (isID ? 'Detail notifikasi' : 'Notification details') : label}
                  </h2>
                  {!selected && <p aria-live="polite" className="mt-0.5 text-xs font-medium text-slate-600">{unreadText}</p>}
                </div>
                <button type="button" onClick={closePanel} aria-label={isID ? 'Tutup notifikasi' : 'Close notifications'} className={iconButton}>
                  <X className="size-[17px]" aria-hidden />
                </button>
              </header>

              {selected && parsed ? (
                <>
                  <div key={selected.id} role="region" aria-label={isID ? 'Isi notifikasi' : 'Notification content'} tabIndex={0}
                    className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 focus-visible:-outline-offset-2 sm:px-5">
                    <NotificationDetails notification={selected} message={parsed} isID={isID} headingRef={detailHeading} icon={<NotificationIcon notification={selected} />} />
                  </div>
                  {invoiceBooking && onOpenInvoiceByCode && (
                    <footer className="shrink-0 border-t border-slate-200 bg-white p-3 sm:px-4">
                      <button type="button" onClick={() => { closePanel(); onOpenInvoiceByCode(invoiceBooking); }}
                        className="flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#162951] px-3 text-sm font-semibold text-white hover:bg-navy">
                        <FileText className="size-4" aria-hidden />{isID ? 'Lihat invoice' : 'View invoice'}<ArrowRight className="size-4" aria-hidden />
                      </button>
                    </footer>
                  )}
                </>
              ) : (
                <>
                  {notifications.length > 0 && (
                    <div className="flex shrink-0 flex-wrap items-stretch justify-between gap-x-1 gap-y-0.5 border-b border-slate-200 px-3.5 sm:px-4">
                      <div className="flex min-w-0 gap-2.5" role="group" aria-label={isID ? 'Filter notifikasi' : 'Filter notifications'}>
                        {[false, true].map(value => (
                          <button key={String(value)} ref={unreadOnly === value ? filter : undefined} type="button" aria-pressed={unreadOnly === value}
                            onClick={() => selectFilter(value)}
                            className="-mb-px min-h-11 cursor-pointer border-b-2 border-transparent px-1 text-sm font-semibold text-slate-600 hover:text-navy-dark aria-pressed:border-[#af792f] aria-pressed:text-[#162951]">
                            {value ? (isID ? 'Belum dibaca' : 'Unread') : (isID ? 'Semua' : 'All')}
                          </button>
                        ))}
                      </div>
                      <button type="button" disabled={unread.length === 0}
                        onClick={() => { filter.current?.focus({ preventScroll: true }); onMarkNotificationsRead(); }}
                        aria-label={isID ? 'Tandai semua sudah dibaca' : 'Mark all as read'}
                        className="flex min-h-11 cursor-pointer items-center gap-1.5 rounded-lg px-1 text-xs font-bold text-navy hover:text-navy-dark disabled:cursor-default disabled:text-slate-500">
                        <CheckCheck className="hidden size-4 shrink-0 min-[370px]:block" aria-hidden />{isID ? 'Baca semua' : 'Mark all read'}
                      </button>
                    </div>
                  )}
                  <div ref={list} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                    {rows.length === 0 ? (
                      <div className="flex flex-col items-center gap-2 px-5 py-9 text-center">
                        <span className="grid size-12 place-items-center rounded-2xl bg-navy-soft text-navy-dark">
                          {unreadOnly ? <CheckCheck className="size-5" aria-hidden /> : <BellOff className="size-5" aria-hidden />}
                        </span>
                        <p role="status" className="text-sm font-bold text-[#162951]">{unreadOnly
                          ? (isID ? 'Semua sudah dibaca' : 'You’re all caught up')
                          : (isID ? 'Belum ada notifikasi' : 'No notifications yet')}</p>
                        {!unreadOnly && <p className="text-sm text-slate-600">{isID ? 'Pembaruan akun dan pesanan akan muncul di sini.' : 'Account and booking updates will appear here.'}</p>}
                      </div>
                    ) : (
                      <ul className="divide-y divide-slate-200">
                        {rows.map(notification => {
                          const summary = parseNotificationMessage(notification.message).cleanPreview;
                          return (
                            <li key={notification.id}>
                              <button type="button" data-notification-id={notification.id} onClick={() => openDetails(notification)}
                                className={`flex min-h-20 w-full cursor-pointer items-start gap-2.5 px-3.5 py-3 text-left hover:bg-[#edf2fa] focus-visible:-outline-offset-2 sm:px-4 ${notification.unread ? 'bg-[#f1f5fb]' : 'bg-white'}`}>
                                <NotificationIcon notification={notification} />
                                <span className="min-w-0 flex-1">
                                  <span className="flex items-start gap-2">
                                    <span className="line-clamp-2 flex-1 text-sm font-bold leading-[1.25rem] text-[#162951] [overflow-wrap:anywhere]">{notification.title}</span>
                                    {notification.unread && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-[#a87025]" aria-hidden />}
                                  </span>
                                  {notification.unread && <span className="sr-only">{isID ? 'Belum dibaca' : 'Unread'}</span>}
                                  {summary && <span className="mt-1 line-clamp-2 text-[13px] leading-5 text-slate-600 [overflow-wrap:anywhere]">{summary}</span>}
                                  {notification.time && <span className="mt-1 block text-xs font-medium text-slate-600">{notification.time}</span>}
                                </span>
                                <ChevronRight className="size-4 shrink-0 self-center text-slate-500" aria-hidden />
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                  {isAdmin && (
                    <footer className="shrink-0 border-t border-slate-200 bg-white p-2 sm:px-3">
                      <Link to={ADMIN_PATHS.notifications} onClick={() => setOpen(false)}
                        className="flex min-h-11 items-center justify-between gap-2 rounded-xl px-2.5 text-sm font-bold text-navy-dark hover:bg-navy-soft">
                        {isID ? 'Lihat semua notifikasi' : 'View all notifications'}<ArrowRight className="size-4 shrink-0" aria-hidden />
                      </Link>
                    </footer>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}
