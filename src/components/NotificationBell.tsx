'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CalendarCheck,
  CalendarX,
  CalendarPlus,
  MessageSquare,
  Star,
  XCircle,
} from 'lucide-react';

const POLL_FAST = 5_000;
const POLL_SLOW = 30_000;

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  bookingId: string | null;
  isRead: boolean;
  createdAt: string;
}

const typeIcon: Record<string, typeof Bell> = {
  BOOKING_NEW: CalendarPlus,
  BOOKING_ACCEPTED: CalendarCheck,
  BOOKING_REJECTED: CalendarX,
  BOOKING_CANCELLED: XCircle,
  MESSAGE_NEW: MessageSquare,
  REVIEW_NEW: Star,
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'acum';
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}z`;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch { /* retry on next poll */ }
  }, []);

  useEffect(() => {
    fetchNotifications();

    const startPolling = (interval: number) => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(fetchNotifications, interval);
    };

    startPolling(POLL_FAST);

    const onVisibility = () => {
      if (document.hidden) {
        startPolling(POLL_SLOW);
      } else {
        fetchNotifications();
        startPolling(POLL_FAST);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const markAllRead = async () => {
    await fetch('/api/notifications', { method: 'PATCH' });
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handleClick = async (n: Notification) => {
    if (!n.isRead) {
      fetch(`/api/notifications/${n.id}`, { method: 'PATCH' });
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, isRead: true } : x));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setOpen(false);
    if (n.bookingId) {
      // Determine role-based route — for simplicity use guest bookings
      // The booking detail page handles access control server-side
      router.push(`/dashboard/guest/bookings/${n.bookingId}`);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-1.5 text-gray-600 hover:text-gray-900 transition"
        aria-label="Notificări"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-sm">Notificări</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-primary-600 hover:underline"
              >
                Marchează toate ca citite
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Nicio notificare</p>
            ) : (
              notifications.map(n => {
                const Icon = typeIcon[n.type] || Bell;
                return (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-gray-50 transition border-b border-gray-50 ${!n.isRead ? 'bg-primary-50/50' : ''}`}
                  >
                    <Icon size={18} className={`mt-0.5 flex-shrink-0 ${!n.isRead ? 'text-primary-600' : 'text-gray-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!n.isRead ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{n.message}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.isRead && (
                      <span className="w-2 h-2 bg-primary-500 rounded-full mt-1.5 flex-shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
