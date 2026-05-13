import { Injectable } from '@nestjs/common';
import { UserRole } from '../../common/enums/role.enum';

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

/**
 * Admin이 사용하는 user 조회/수정 Repository.
 * 현재는 placeholder — Drizzle 구현이 들어오면 메서드 본문을 교체한다.
 */
@Injectable()
export class UserRepository {
  async findById(_id: string): Promise<AdminUserView | null> {
    throw new Error('UserRepository.findById: NotImplemented');
  }

  async countAdmins(): Promise<number> {
    throw new Error('UserRepository.countAdmins: NotImplemented');
  }

  async updateRole(_id: string, _role: UserRole): Promise<AdminUserView> {
    throw new Error('UserRepository.updateRole: NotImplemented');
  }

  async updateStatus(
    _id: string,
    _input: UpdateUserStatusInput,
  ): Promise<AdminUserView> {
    throw new Error('UserRepository.updateStatus: NotImplemented');
  }
}
