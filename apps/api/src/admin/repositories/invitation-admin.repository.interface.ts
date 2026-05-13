export const INVITATION_ADMIN_REPOSITORY = Symbol('IInvitationAdminRepository');

export interface AdminInvitationView {
  id: string;
  userId: string;
  title: string;
  status: 'active' | 'closed';
  closedAt: Date | null;
  closedReason: string | null;
}

export interface IInvitationAdminRepository {
  findById(id: string): Promise<AdminInvitationView | null>;
  close(id: string, reason: string | null): Promise<AdminInvitationView>;
}
