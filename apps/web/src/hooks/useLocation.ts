import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/queryKeys";
import {
  getEventLocation,
  setEventLocation,
  getParticipantLocations,
  searchPlaces,
  type SetEventLocationPayload,
} from "@/lib/api/locations";

export function useEventLocation(invitationId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.invitations.location(invitationId),
    queryFn: () => getEventLocation(invitationId),
    enabled: !!invitationId,
  });
}

export function useSetEventLocation(invitationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SetEventLocationPayload) =>
      setEventLocation(invitationId, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.invitations.location(invitationId), data);
    },
  });
}

export function useParticipantLocations(invitationId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.invitations.participantLocations(invitationId),
    queryFn: () => getParticipantLocations(invitationId),
    enabled: !!invitationId,
  });
}

// 카카오 장소 검색은 사용자 위치 기반 거리 정렬이 가능 — 위치가 바뀌면 결과도 바뀌므로
// queryKey에 좌표를 포함하되, 약 100m(소수점 3자리) 라운드로 캐시 hit rate를 유지한다.
function roundCoord(v: number | undefined): number | undefined {
  return v === undefined ? undefined : Math.round(v * 1000) / 1000;
}

export function useLocationSearch(
  query: string,
  origin?: { lat: number; lng: number },
) {
  const rLat = roundCoord(origin?.lat);
  const rLng = roundCoord(origin?.lng);
  return useQuery({
    queryKey: ["locations", "search", query, rLat, rLng],
    queryFn: () => searchPlaces(query),
    enabled: query.trim().length >= 2,
    staleTime: 60 * 1000,
  });
}
