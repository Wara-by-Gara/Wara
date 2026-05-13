import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '../../common/enums/role.enum';
import {
  AdminUserView,
  IUserRepository,
  UpdateUserStatusInput,
} from './user.repository.interface';

@Injectable()
export class MockUserRepository implements IUserRepository {
  private readonly store = new Map<string, AdminUserView>();

  seed(user: AdminUserView): void {
    this.store.set(user.id, user);
  }

  clear(): void {
    this.store.clear();
  }

  async findById(id: string): Promise<AdminUserView | null> {
    return this.store.get(id) ?? null;
  }

  async countAdmins(): Promise<number> {
    let count = 0;
    for (const user of this.store.values()) {
      if (user.role === UserRole.ADMIN && user.deletedAt === null) count += 1;
    }
    return count;
  }

  async updateRole(id: string, role: UserRole): Promise<AdminUserView> {
    const user = this.store.get(id);
    if (!user) throw new NotFoundException('USER_NOT_FOUND');
    const next: AdminUserView = { ...user, role };
    this.store.set(id, next);
    return next;
  }

  async updateStatus(
    id: string,
    input: UpdateUserStatusInput,
  ): Promise<AdminUserView> {
    const user = this.store.get(id);
    if (!user) throw new NotFoundException('USER_NOT_FOUND');
    const next: AdminUserView = {
      ...user,
      role: input.role ?? user.role,
      deletedAt: input.deleted === true ? new Date() : input.deleted === false ? null : user.deletedAt,
      promotedBy:
        input.role === UserRole.ADMIN && input.promotedBy
          ? input.promotedBy
          : user.promotedBy,
      promotedAt:
        input.role === UserRole.ADMIN && input.promotedBy ? new Date() : user.promotedAt,
    };
    this.store.set(id, next);
    return next;
  }
}
