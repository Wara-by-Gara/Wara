import { useQuery } from "@tanstack/react-query";
import { getWeather } from "@/lib/api/weather";
import { QUERY_KEYS } from "@/constants/queryKeys";

const THREE_DAYS_MS = 72 * 60 * 60 * 1000;

export function useWeather(invitationId: string, eventStartAt: string | null | undefined) {
  const within3Days =
    !!eventStartAt && new Date(eventStartAt).getTime() - Date.now() <= THREE_DAYS_MS;

  return useQuery({
    queryKey: QUERY_KEYS.invitations.weather(invitationId),
    queryFn: () => getWeather(invitationId),
    enabled: within3Days,
    staleTime: 30 * 60 * 1000,
  });
}
