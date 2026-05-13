export const BLOCKLIST_REPOSITORY = Symbol('IBlocklistRepository');

export interface IBlocklistRepository {
  isBlocked(userId: string, invitationId: string): Promise<boolean>;
}
