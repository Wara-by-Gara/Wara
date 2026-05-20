'use client';

import { useState, useRef, useEffect } from 'react';
import { useUnreadCount } from '../hooks/use-unread-count';
import { useNotificationSocket } from '../hooks/use-notification-socket';
import { NotificationDropdown } from './notification-dropdown';
import { NotificationSettingsSheet } from './notification-settings-sheet';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data } = useUnreadCount();
  const unreadCount = data?.count ?? 0;

  useNotificationSocket();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="알림"
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <NotificationDropdown onOpenSettings={() => setSettingsOpen(true)} />
      )}
      {settingsOpen && (
        <NotificationSettingsSheet onClose={() => setSettingsOpen(false)} />
      )}
    </div>
  );
}
