export const INVITATION_REPOSITORY = Symbol('IInvitationRepository');

export interface IInvitationRepository {
  isPrivate(invitationId: string): Promise<boolean>;
}
