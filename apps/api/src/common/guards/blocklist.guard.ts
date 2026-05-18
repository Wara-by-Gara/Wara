import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { ErrorCode } from '../constants/error-codes';
import { UserRole } from '../enums/role.enum';
import { BlocklistRepository } from '../repositories/blocklist.repository';

@Injectable()
export class BlocklistGuard implements CanActivate {
  constructor(private readonly blocklistRepository: BlocklistRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException(ErrorCode.TOKEN_INVALID);
    }

    if (user.role === UserRole.ADMIN) {
      return true;
    }

    const invitationId = request.params?.invitationId;
    if (typeof invitationId !== 'string' || invitationId.length === 0) {
      throw new BadRequestException(ErrorCode.INVITATION_ID_REQUIRED);
    }

    const blocked = await this.blocklistRepository.isBlocked(
      user.id,
      invitationId,
    );

    if (blocked) {
      throw new ForbiddenException(ErrorCode.INVITATION_ACCESS_REVOKED);
    }

    return true;
  }
}
