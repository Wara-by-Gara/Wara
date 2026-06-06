"use client";

import { useReportWebVitals } from "next/web-vitals";

/**
 * Core Web Vitals(LCP/INP/CLS/FCP/TTFB) 수집 리포터.
 * - 개발: 콘솔에 지표·rating 출력 (성능 작업 시 before/after 측정 기준선)
 * - 프로덕션: 수집 엔드포인트(/api/vitals 등)로 전송하도록 확장 가능
 *
 * 백로그 0번(계측 인프라) — 모든 성능 개선의 before→after 수치 측정 전제.
 */
export function WebVitals() {
  useReportWebVitals((metric) => {
    const { name, value, rating, id } = metric;
    // CLS는 소수(누적 점수), 나머지는 ms
    const display = name === "CLS" ? value.toFixed(3) : `${Math.round(value)}ms`;

    if (process.env.NODE_ENV !== "production") {
      console.log(`[web-vitals] ${name}: ${display} (${rating})`, { id });
      return;
    }

    // 프로덕션 RUM 수집 — 엔드포인트 준비 시 활성화
    // navigator.sendBeacon?.("/api/vitals", JSON.stringify(metric));
  });

  return null;
}
