import type { MetadataRoute } from 'next';

// PWA manifest — 홈화면 설치 + Web Push(SW) 사용 기반. App Router가 /manifest.webmanifest로 서빙.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'WARA',
    short_name: 'WARA',
    description: '요즘 모이는 방식',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFFFFF',
    theme_color: '#14121A',
    lang: 'ko',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
