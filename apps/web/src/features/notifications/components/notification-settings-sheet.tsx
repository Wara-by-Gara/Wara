'use client';

import { NotificationSettingsForm } from './notification-settings-form';

interface Props {
  onClose: () => void;
}

export function NotificationSettingsSheet({ onClose }: Props) {
  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 z-50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl z-50 w-[360px] max-h-[80vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="text-sm font-semibold">알림 설정</span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            닫기
          </button>
        </div>
        <div className="overflow-y-auto flex-1">
          <NotificationSettingsForm />
        </div>
      </div>
    </>
  );
}
