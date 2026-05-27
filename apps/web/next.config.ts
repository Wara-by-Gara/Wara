import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker 프로덕션 빌드 시 최소 실행 파일만 추출 (standalone 폴더 생성)
  output: "standalone",
  images: {
    remotePatterns: [
      // AWS S3 (ap-northeast-2) — 사진 presigned URL
      { protocol: "https", hostname: "*.s3.ap-northeast-2.amazonaws.com" },
      // Unsplash — 개발용 목업 이미지
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
