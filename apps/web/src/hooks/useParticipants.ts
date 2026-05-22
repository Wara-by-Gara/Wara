import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { getParticipants } from "@/lib/api/participants";

export function useParticipants(invitationId: string, token: string) {
  return useQuery({
    queryKey: QUERY_KEYS.invitations.participants(invitationId),
    queryFn: () => getParticipants(invitationId, token),
    enabled: !!invitationId && !!token,
  });
}
