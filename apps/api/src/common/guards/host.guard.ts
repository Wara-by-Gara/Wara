import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ErrorCode } from '../constants/error-codes';
import { MEMBER_ROLE_KEY } from '../decorators/member-role.decorator';
import { MemberRole } from '../enums/member-role.enum';
import { ParticipantRepository } from '../repositories/participant.repository';

@Injectable()
export class HostGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly participantRepository: ParticipantRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<MemberRole[]>(
      MEMBER_ROLE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('TOKEN_INVALID');
    }

    const invitationId = request.params?.invitationId;
    if (typeof invitationId !== 'string' || invitationId.length === 0) {
      throw new BadRequestException(ErrorCode.INVITATION_ID_REQUIRED);
    }

    const memberRole = await this.participantRepository.findMemberRole(
      user.id,
      invitationId,
    );

    if (!memberRole || !requiredRoles.includes(memberRole)) {
      throw new ForbiddenException(ErrorCode.INSUFFICIENT_ROLE);
    }

    return true;
  }
}
