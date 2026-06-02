'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TopAppBar } from '@/components/molecules/TopAppBar';
import { Settings, type SettingsScreen } from '@/screens/Settings';
import { NotificationSettingsForm } from '@/components/notifications/notification-settings-form';
import type { NotificationSettingKey } from '@/components/notifications/notification-settings-form';
import { useNotificationSettings, useUpdateNotificationSettings } from '@/hooks/useNotifications';
import { useTerms } from '@/hooks/useTerms';

export default function SettingsContainer() {
  const router = useRouter();
  const [screen, setScreen] = useState<SettingsScreen>('main');

  const { data: notifSettings, isLoading } = useNotificationSettings();
  const { mutate: updateNotif, isPending } = useUpdateNotificationSettings();
  const { data: terms } = useTerms();

  const handleToggle = (key: NotificationSettingKey, value: boolean) => {
    updateNotif({ [key]: value });
  };

  const handleBack = () => {
    if (screen === 'main') router.back();
    else setScreen('main');
  };

  if (screen === 'terms' || screen === 'privacy') {
    const termType = screen === 'terms' ? 'service' : 'privacy';
    const title = screen === 'terms' ? '이용약관' : '개인정보처리방침';
    const term = terms?.find((t) => t.termType === termType && t.isActive);

    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title={title} onBack={handleBack} />
        <main className="min-h-0 flex-1 overflow-y-auto px-5 py-6 text-[13px] leading-relaxed text-text-secondary whitespace-pre-wrap">
          {term ? term.content : '불러오는 중...'}
        </main>
      </div>
    );
  }

  if (screen === 'notification') {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background-soft">
        <TopAppBar className="shrink-0" title="알림 설정" onBack={handleBack} />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <NotificationSettingsForm
            settings={notifSettings}
            isLoading={isLoading}
            isPending={isPending}
            onToggle={handleToggle}
          />
        </main>
      </div>
    );
  }

  return (
    <Settings
      screen={screen}
      onBack={handleBack}
      onNavigate={setScreen}
    />
  );
}
