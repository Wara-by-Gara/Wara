import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '../../common/enums/role.enum';
import { UpdateUserStatusDto } from '../dto/update-user-status.dto';
import {
  AdminUserView,
  IUserRepository,
  USER_REPOSITORY,
} from '../repositories/user.repository.interface';

@Injectable()
export class AdminUsersService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
  ) {}

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
