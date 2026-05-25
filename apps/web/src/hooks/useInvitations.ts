import { useQuery } from "@tanstack/react-query";
import { getInvitation, getMyInvitations } from "@/lib/api/invitations";
import { QUERY_KEYS } from "@/constants/queryKeys";

export function useInvitation(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.invitations.detail(id),
    queryFn: () => getInvitation(id),
  });
}

export function useMyInvitations() {
  return useQuery({
    queryKey: QUERY_KEYS.invitations.all(),
    queryFn: () => {
      const token = localStorage.getItem('access_token') ?? '';
      return getMyInvitations(token);
    },
  });
}