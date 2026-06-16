'use client';

import { useEffect, useState } from 'react';
import { BottomSheet } from '@wara/ui';

interface Props {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function NotificationSettingsSheet({ open, onClose, children }: Props) {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  if (isDesktop) {
    if (!open) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
        <div
          className="absolute inset-0 bg-black/48"
          onClick={onClose}
          aria-hidden
        />
        <div className="relative w-full max-w-sm rounded-lg bg-surface shadow-xl overflow-hidden">
          <div className="px-page pt-5 pb-2">
            <h2 className="text-[18px] font-bold text-text-primary">알림 설정</h2>
          </div>
          <div className="overflow-y-auto max-h-[70vh] pb-5">
            {children}
          </div>
        </div>
      </div>
    );
  }

  return (
    <BottomSheet
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
      title="알림 설정"
    >
      {children}
    </BottomSheet>
  );
}
