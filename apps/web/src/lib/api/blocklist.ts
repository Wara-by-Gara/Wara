import { apiGet, apiDelete } from "./client";

export interface BlockedUser {
  userId: string;
  name: string | null;
  nickname: string | null;
  profileImageUrl: string | null;
  blockedAt: string;
}

export function getBlocklist(invitationId: string): Promise<{ data: BlockedUser[] }> {
  return apiGet(`/invitations/${invitationId}/blocklist`);
}

export function unblockUser(invitationId: string, userId: string): Promise<void> {
  return apiDelete(`/invitations/${invitationId}/blocklist/${userId}`);
}
