import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '../../common/enums/role.enum';
import { UpdateUserStatusDto } from '../dto/update-user-status.dto';
import {
  AdminUserView,
  UserRepository,
} from '../repositories/user.repository';

@Injectable()
export class AdminUsersService {
  constructor(private readonly userRepository: UserRepository) {}

  async updateStatus(
    actorId: string,
    targetUserId: string,
    dto: UpdateUserStatusDto,
  ): Promise<AdminUserView> {
    const target = await this.userRepository.findById(targetUserId);
    if (!target) throw new NotFoundException('USER_NOT_FOUND');

    const demotingToMember = dto.role === UserRole.MEMBER;

    if (demotingToMember && actorId === targetUserId) {
      throw new ForbiddenException('CANNOT_DEMOTE_SELF');
    }

    if (demotingToMember && target.role === UserRole.ADMIN) {
      // TODO(drizzle): countAdmins + updateStatus를 트랜잭션 + SELECT FOR UPDATE
      // (또는 advisory lock)로 묶어야 LAST_ADMIN TOCTOU race 방지 가능.
      // 두 동시 강등 요청이 모두 count=2 본 후 둘 다 통과해 admin=0이 될 수 있음.
      const adminCount = await this.userRepository.countAdmins();
      if (adminCount <= 1) {
        throw new ForbiddenException('CANNOT_DEMOTE_LAST_ADMIN');
      }
    }

    return this.userRepository.updateStatus(targetUserId, {
      role: dto.role,
      deleted: dto.deleted,
      promotedBy: dto.role === UserRole.ADMIN ? actorId : undefined,
    });
  }
}
