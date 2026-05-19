import { z } from 'zod';

// 운영 안전: 분석 한 번 호출당 최대 366일까지만 허용.
// 풀스캔 비용 + 응답 페이로드 안전망. (인덱스 추가는 별도 마이그레이션 영역)
export const MAX_ANALYTICS_PERIOD_DAYS = 366;
const MS_PER_DAY = 86_400_000;

/**
 * 분석 endpoint 공통 쿼리 — 기간 필터.
 * 둘 다 생략 시 최근 30일 (service에서 기본값 적용).
 * 사용 예: `GET /admin/analytics/shares/channels?from=2026-05-01T00:00:00Z&to=2026-05-19T23:59:59Z`
 */
export const AnalyticsPeriodSchema = z
  .object({
    from: z.string().datetime({ offset: true }).optional(),
    to: z.string().datetime({ offset: true }).optional(),
  })
  .refine(
    (v) => !v.from || !v.to || new Date(v.from) <= new Date(v.to),
    { message: 'from은 to보다 이전이어야 합니다', path: ['from'] },
  )
  .refine(
    (v) => {
      if (!v.from || !v.to) return true;
      const diffDays =
        (new Date(v.to).getTime() - new Date(v.from).getTime()) / MS_PER_DAY;
      return diffDays <= MAX_ANALYTICS_PERIOD_DAYS;
    },
    {
      message: `분석 기간은 최대 ${MAX_ANALYTICS_PERIOD_DAYS}일까지 허용됩니다`,
      path: ['to'],
    },
  );

export type AnalyticsPeriodDto = z.infer<typeof AnalyticsPeriodSchema>;
