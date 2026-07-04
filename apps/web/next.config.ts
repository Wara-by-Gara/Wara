import type { NextConfig } from "next";
import path from "path";
import withSerwistInit from "@serwist/next";

// PWA — Serwist가 빌드 시 src/app/sw.ts → public/sw.js 생성 (프리캐시 매니페스트 주입).
// swDest를 기존 수동 SW와 동일 경로로 유지해 기존 사용자의 push 구독이 끊기지 않는다.
// register: false — 등록은 기존 ServiceWorkerRegister 컴포넌트가 담당 (푸시 구독 마운트 순서 보존).
// dev는 Turbopack이라 Serwist 플러그인이 동작하지 않으므로 비활성.
const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  register: false,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname, "../.."),
  },
  // 워크스페이스 디자인 시스템 패키지를 트랜스파일 (TS 소스 직접 소비)
  transpilePackages: ["@wara/tokens", "@wara/ui"],
  // Docker 프로덕션 빌드 시 최소 실행 파일만 추출 (standalone 폴더 생성)
  output: "standalone",
  // /api/* 를 백엔드로 프록시 → 프론트와 same-origin 으로 만들어
  // 인증 쿠키(httpOnly, SameSite=lax)가 정상 공유되게 한다.
  // 배열 반환(afterFiles)이라 Next 자체 라우트(/api/gifs/*)가 우선 매칭된다.
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
    return [
      { source: "/api/:path*", destination: `${apiUrl}/api/:path*` },
    ];
  },
  images: {
    remotePatterns: [
      // AWS S3 (ap-northeast-2) — 사진 presigned URL
      { protocol: "https", hostname: "*.s3.ap-northeast-2.amazonaws.com" },
      // Unsplash — 개발용 목업 이미지
      { protocol: "https", hostname: "images.unsplash.com" },
      // Picsum — 시드 데이터 placeholder 이미지
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      // Pravatar — 시드 데이터 프로필 아바타
      { protocol: "https", hostname: "i.pravatar.cc" },
      // Klipy GIF CDN
      { protocol: "https", hostname: "static.klipy.com" },
      // Placehold — Storybook / dev placeholder
      { protocol: "https", hostname: "placehold.co" },
      // localhost — 개발 환경 로컬 이미지
      ...(process.env.NODE_ENV === "development"
        ? [{ protocol: "http" as const, hostname: "localhost" }]
        : []),
    ],
  },
};

export default withSerwist(nextConfig);
