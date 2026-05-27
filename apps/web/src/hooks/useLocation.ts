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

export function useLocationSearch(query: string) {
  return useQuery({
    queryKey: ["locations", "search", query],
    queryFn: () => searchPlaces(query),
    enabled: query.trim().length >= 2,
    staleTime: 5 * 60 * 1000,
  });
}
