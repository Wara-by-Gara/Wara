import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Be_Vietnam_Pro, Noto_Serif } from 'next/font/google';
import Providers from '@/providers';
import { OAuthCallbackHandler } from '@/components/auth/oauth-callback-handler';
import { MainBottomNav } from '@/components/layout/MainBottomNav';
import { Toaster } from '@/components/molecules/Toast';
import './globals.css';

const beVietnamPro = Be_Vietnam_Pro({
  variable: '--font-be-vietnam-pro',
  subsets: ['latin'],
  weight: ['400', '600', '700'],
});

const notoSerif = Noto_Serif({
  variable: '--font-noto-serif',
  subsets: ['latin'],
  weight: ['400', '600', '700'],
});

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
      className={`${beVietnamPro.variable} ${notoSerif.variable} h-full antialiased`}
    >
      <body className="w-full max-w-[100vw] mx-auto flex flex-col min-h-full">
        <OAuthCallbackHandler />
        <Providers>
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
