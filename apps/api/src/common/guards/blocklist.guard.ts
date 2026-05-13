import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { UserRole } from '../enums/role.enum';
import {
  BLOCKLIST_REPOSITORY,
  IBlocklistRepository,
} from '../repositories/blocklist.repository.interface';

@Injectable()
export class BlocklistGuard implements CanActivate {
  constructor(
    @Inject(BLOCKLIST_REPOSITORY)
    private readonly blocklistRepository: IBlocklistRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('TOKEN_INVALID');
    }

    if (user.role === UserRole.ADMIN) {
      return true;
    }

    const invitationId = request.params?.invitationId;
    if (typeof invitationId !== 'string' || invitationId.length === 0) {
      throw new BadRequestException('INVITATION_ID_REQUIRED');
    }

    const blocked = await this.blocklistRepository.isBlocked(
      user.id,
      invitationId,
    );

    if (blocked) {
      throw new ForbiddenException('ACCESS_REVOKED');
    }

    return true;
  }
}
