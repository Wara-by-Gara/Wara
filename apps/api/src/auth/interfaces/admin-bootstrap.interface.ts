export interface IAdminBootstrapService {
  ensureAdminRoleIfEligible(userId: string): Promise<void>;
}

export const ADMIN_BOOTSTRAP_SERVICE = Symbol('ADMIN_BOOTSTRAP_SERVICE');
