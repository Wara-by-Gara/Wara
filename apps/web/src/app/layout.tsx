import type { Metadata } from 'next';
import { Suspense } from 'react';
import Providers from '@/providers';
import { OAuthCallbackHandler } from '@/components/auth/oauth-callback-handler';
import { TermsComplianceRedirect } from '@/components/auth/terms-compliance-redirect';
import { NotificationSocketMount } from '@/components/notifications/notification-socket-mount';
import { DmSocketMount } from '@/components/chat/dm-socket-mount';
import { MainBottomNav } from '@/components/layout/MainBottomNav';
import { Toaster } from '@/components/molecules/Toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'WARA',
  description: '요즘 모이는 방식',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className="h-full antialiased"
      // Trancy/Grammarly 등 번역·문법 확장이 hydration 전에 <html>에
      // attribute를 주입해 mismatch가 발생. <html>에만 한정하면 자식
      // 트리의 실제 hydration 버그는 그대로 노출된다.
      suppressHydrationWarning
    >
      <body className="w-full max-w-[100vw] mx-auto flex flex-col min-h-full">
        <OAuthCallbackHandler />
        <Providers>
          <TermsComplianceRedirect />
          <NotificationSocketMount />
          <DmSocketMount />
          {children}
          <Suspense fallback={null}>
            <MainBottomNav />
          </Suspense>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
