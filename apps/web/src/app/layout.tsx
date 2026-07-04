import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import { FRONTEND_ORIGIN } from '@/lib/env';
import Providers from '@/providers';
import { OAuthCallbackHandler } from '@/components/auth/oauth-callback-handler';
import { TermsComplianceRedirect } from '@/components/auth/terms-compliance-redirect';
import { NotificationSocketMount } from '@/components/notifications/notification-socket-mount';
import { DmSocketMount } from '@/components/chat/dm-socket-mount';
import { ServiceWorkerRegister } from '@/components/pwa/service-worker-register';
import { PushSubscriptionMount } from '@/components/pwa/push-subscription-mount';
import { MainBottomNav } from '@/components/layout/MainBottomNav';
import { TopNavigation } from '@/components/layout/TopNavigation';
import { Toaster } from "@wara/ui";
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(FRONTEND_ORIGIN),
  title: 'WARA',
  description: '요즘 모이는 방식',
  // iOS 홈 화면 설치(standalone) 지원 — apple-touch-icon은 src/app/apple-icon.png 컨벤션으로 제공
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'WARA',
  },
};

export const viewport: Viewport = {
  themeColor: '#14121A',
  width: 'device-width',
  initialScale: 1,
  // 노치/홈 인디케이터 영역까지 확장 (standalone 실행 시 safe-area-inset 사용 가능)
  viewportFit: 'cover',
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
      <body className="w-full max-w-[100vw] mx-auto flex flex-col min-h-full bg-background">
        <OAuthCallbackHandler />
        <Providers>
          <TermsComplianceRedirect />
          <NotificationSocketMount />
          <DmSocketMount />
          <ServiceWorkerRegister />
          <PushSubscriptionMount />
          <Suspense fallback={null}>
            <TopNavigation />
          </Suspense>
          {/* 데스크톱: 본문 영역이 헤더 아래 남은 높이를 채워 페이지 배경이 끝까지 차도록.
              모바일은 contents로 펼쳐져 기존 동작 그대로. */}
          <div className="contents lg:flex lg:w-full lg:flex-1 lg:flex-col">
            {children}
          </div>
          <Suspense fallback={null}>
            <MainBottomNav />
          </Suspense>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
