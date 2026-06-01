import { useQuery } from "@tanstack/react-query";
import { getInvitation } from "@/lib/api/invitations";
import { getMe } from "@/lib/api/users";
import { getMyParticipant, getParticipants } from "@/lib/api/participants";
import { useAuthStore } from "@/stores/authStore";
import { QUERY_KEYS } from "@/constants/queryKeys";

export function useInvitationDetail(invitationId: string) {
  const { isLoggedIn, hydrated } = useAuthStore();

  const { data: invitation, isLoading, isError } = useQuery({
    queryKey: QUERY_KEYS.invitations.detail(invitationId),
    queryFn: () => getInvitation(invitationId),
  });

  const { data: me } = useQuery({
    queryKey: QUERY_KEYS.users.me(),
    queryFn: getMe,
    enabled: hydrated && isLoggedIn,
  });

  const { data: myParticipant } = useQuery({
    queryKey: ["myParticipant", invitationId],
    queryFn: () => getMyParticipant(invitationId),
    enabled: hydrated && isLoggedIn,
  });

  const { data: participantsData } = useQuery({
    queryKey: QUERY_KEYS.invitations.participants(invitationId),
    queryFn: () => getParticipants(invitationId),
    enabled: hydrated && isLoggedIn,
  });

  return { invitation, isLoading, isError, me, myParticipant, participantsData };
}