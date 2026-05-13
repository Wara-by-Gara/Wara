import { UserRole } from '../../common/enums/role.enum';

export const USER_REPOSITORY = Symbol('IUserRepository');

export interface AdminUserView {
  id: string;
  email: string | null;
  name: string | null;
  nickname: string | null;
  role: UserRole;
  deletedAt: Date | null;
  promotedBy: string | null;
  promotedAt: Date | null;
}

export interface UpdateUserStatusInput {
  role?: UserRole;
  deleted?: boolean;
  promotedBy?: string;
}

export interface IUserRepository {
  findById(id: string): Promise<AdminUserView | null>;
  countAdmins(): Promise<number>;
  updateRole(id: string, role: UserRole): Promise<AdminUserView>;
  updateStatus(id: string, input: UpdateUserStatusInput): Promise<AdminUserView>;
}
