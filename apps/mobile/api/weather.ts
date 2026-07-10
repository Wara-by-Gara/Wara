import { apiFetch } from './client';

// 웹 apps/web/src/lib/api/weather.ts와 계약 정합.
// GET /invitations/:id/weather — 모임 시간 기준 예보 요약 (3일 이내 예보만 제공).

/** 서버가 내려주는 한국어 날씨 상태. */
export type WeatherConditionKo =
  | '맑음'
  | '구름 조금'
  | '흐림'
  | '비'
  | '비/눈'
  | '소나기'
  | '눈';

export type WeatherSummary = {
  condition: WeatherConditionKo;
  temperature: number;
  precipProbability: number;
  message: string;
};

/** GET /invitations/:id/weather — 예보 범위 밖이면 data가 비어 올 수 있어 null로 정규화. */
export async function fetchWeather(
  invitationId: string,
  opts: { signal?: AbortSignal } = {},
): Promise<WeatherSummary | null> {
  const result = await apiFetch<WeatherSummary | null | undefined>(
    `/invitations/${invitationId}/weather`,
    { signal: opts.signal },
  );
  return result ?? null;
}

// ── Query keys ───────────────────────────────────────────────────────────────
export const weatherKeys = {
  detail: (invitationId: string) => ['invitations', 'weather', invitationId] as const,
};
