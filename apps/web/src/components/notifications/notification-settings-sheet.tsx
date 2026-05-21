'use client';

import { BottomSheet, BottomSheetContent } from '@/components/molecules/BottomSheet';

interface Props {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function NotificationSettingsSheet({ open, onClose, children }: Props) {
  return (
    <BottomSheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <BottomSheetContent title="알림 설정">
        {children}
      </BottomSheetContent>
    </BottomSheet>
  );
}
