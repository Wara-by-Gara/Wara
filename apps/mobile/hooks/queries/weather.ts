import { useQuery } from '@tanstack/react-query';

import { fetchWeather, weatherKeys } from '@/api/weather';

const THREE_DAYS_MS = 72 * 60 * 60 * 1000;

/**
 * 모임 날씨 조회 — 이벤트가 미래이면서 3일 이내일 때만 요청한다.
 * (웹 apps/web/src/hooks/useWeather.ts 미러)
 */
export function useWeather(
  invitationId: string,
  eventStartAt: string | null | undefined,
  options?: { enabled?: boolean },
) {
  const diff = eventStartAt ? new Date(eventStartAt).getTime() - Date.now() : 0;
  const isFuture = diff > 0;
  const within3Days = isFuture && diff <= THREE_DAYS_MS;
  const callerEnabled = options?.enabled ?? true;

  const query = useQuery({
    queryKey: weatherKeys.detail(invitationId),
    queryFn: ({ signal }) => fetchWeather(invitationId, { signal }),
    enabled: callerEnabled && !!invitationId && within3Days,
    staleTime: 30 * 60 * 1000,
  });

  return { ...query, within3Days, isFuture };
}
