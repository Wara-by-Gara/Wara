import { MemberRole } from '../enums/member-role.enum';

export const PARTICIPANT_REPOSITORY = Symbol('IParticipantRepository');

export interface IParticipantRepository {
  findMemberRole(userId: string, invitationId: string): Promise<MemberRole | null>;
}
