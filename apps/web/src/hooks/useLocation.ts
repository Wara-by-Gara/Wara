import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/queryKeys";
import {
  getEventLocation,
  setEventLocation,
  deleteEventLocation,
  getParticipantLocations,
  searchPlaces,
  type SetEventLocationPayload,
} from "@/lib/api/locations";

export function useEventLocation(invitationId: string, token: string) {
  return useQuery({
    queryKey: QUERY_KEYS.invitations.location(invitationId),
    queryFn: () => getEventLocation(invitationId, token),
    enabled: !!invitationId && !!token,
  });
}

export function useSetEventLocation(invitationId: string, token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SetEventLocationPayload) =>
      setEventLocation(invitationId, payload, token),
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.invitations.location(invitationId), data);
    },
  });
}

export function useDeleteEventLocation(invitationId: string, token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deleteEventLocation(invitationId, token),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: QUERY_KEYS.invitations.location(invitationId) });
    },
  });
}

export function useParticipantLocations(invitationId: string, token: string) {
  return useQuery({
    queryKey: QUERY_KEYS.invitations.participantLocations(invitationId),
    queryFn: () => getParticipantLocations(invitationId, token),
    enabled: !!invitationId && !!token,
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
