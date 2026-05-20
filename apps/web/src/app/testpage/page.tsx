'use client';

import { MockProvider } from '@/mocks/mock-provider';
import { NotificationBell } from '@/features/notifications/components/notification-bell';

export default function TestPage() {
  return (
    <MockProvider>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b border-gray-200 px-6 h-14 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">WARA</span>
          <NotificationBell />
        </nav>

        <main className="max-w-lg mx-auto mt-20 px-6 text-center">
          <p className="text-gray-400 text-sm">
            우측 상단 벨 아이콘을 눌러 알림을 확인하세요
          </p>
        </main>
      </div>
    </MockProvider>
  );
}
