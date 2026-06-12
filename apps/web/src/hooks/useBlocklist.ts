import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBlocklist, unblockUser } from "@/lib/api/blocklist";

const blocklistKeys = {
  byInvitation: (invitationId: string) => ["blocklist", invitationId] as const,
};

export function useBlocklist(invitationId: string, enabled: boolean) {
  return useQuery({
    queryKey: blocklistKeys.byInvitation(invitationId),
    queryFn: () => getBlocklist(invitationId),
    enabled,
  });
}

export function useUnblockUser(invitationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => unblockUser(invitationId, userId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: blocklistKeys.byInvitation(invitationId) }),
  });
}
