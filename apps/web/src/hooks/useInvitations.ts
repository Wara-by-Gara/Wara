import { useQuery } from "@tanstack/react-query";
import { getInvitation } from "@/lib/api/invitations";
import { QUERY_KEYS } from "@/constants/queryKeys";

export function useInvitation(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.invitations.detail(id),
    queryFn: () => getInvitation(id),
  });
}