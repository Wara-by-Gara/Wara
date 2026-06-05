import { useQuery } from "@tanstack/react-query";
import { getWeather } from "@/lib/api/weather";
import { QUERY_KEYS } from "@/constants/queryKeys";

const THREE_DAYS_MS = 72 * 60 * 60 * 1000;

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
    queryKey: QUERY_KEYS.invitations.weather(invitationId),
    queryFn: () => getWeather(invitationId),
    enabled: callerEnabled && within3Days,
    staleTime: 30 * 60 * 1000,
  });

  return { ...query, within3Days, isFuture };
}
