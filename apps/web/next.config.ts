import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker 프로덕션 빌드 시 최소 실행 파일만 추출 (standalone 폴더 생성)
  output: "standalone",
};

export default nextConfig;
