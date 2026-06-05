import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    ],
  },
};

export default nextConfig;
