import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../../common/enums/role.enum';
import {
  AdminUserView,
  UserRepository,
} from '../repositories/user.repository';

@Injectable()
export class AdminBootstrapService {
  private readonly logger = new Logger(AdminBootstrapService.name);
  private readonly initialAdminIds: Set<string>;

  constructor(
    configService: ConfigService,
    private readonly userRepository: UserRepository,
  ) {
    const csv = configService.get<string>('INITIAL_ADMIN_USER_IDS', '');
    this.initialAdminIds = new Set(
      csv
        .split(',')
        .map((value) => value.trim())
        .filter((value) => value.length > 0),
    );
  }

  async ensureAdminRoleIfEligible(user: AdminUserView): Promise<AdminUserView> {
    if (!this.initialAdminIds.has(user.id)) return user;
    if (user.role === UserRole.ADMIN) return user;
    const promoted = await this.userRepository.updateRole(user.id, UserRole.ADMIN);
    this.logger.log(
      `Initial admin promoted via INITIAL_ADMIN_USER_IDS: user.id=${user.id}`,
    );
    return promoted;
  }
}
