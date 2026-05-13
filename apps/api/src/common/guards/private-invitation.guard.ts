import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { InvitationRepository } from '../repositories/invitation.repository';

const INVITATION_ACCESS_TOKEN_HEADER = 'x-invitation-access-token';

type InvitationAccessPayload = {
  invitationId: string;
};

@Injectable()
export class PrivateInvitationGuard implements CanActivate {
  constructor(
    private readonly invitationRepository: InvitationRepository,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const invitationId = request.params?.invitationId;

    if (typeof invitationId !== 'string' || invitationId.length === 0) {
      throw new BadRequestException('INVITATION_ID_REQUIRED');
    }

    const isPrivate = await this.invitationRepository.isPrivate(invitationId);
    if (!isPrivate) return true;

    const accessToken = request.headers[INVITATION_ACCESS_TOKEN_HEADER];
    if (typeof accessToken !== 'string' || accessToken.length === 0) {
      throw new UnauthorizedException('PASSWORD_REQUIRED');
    }

    let payload: InvitationAccessPayload;
    try {
      payload = await this.jwtService.verifyAsync<InvitationAccessPayload>(
        accessToken,
      );
    } catch {
      throw new UnauthorizedException('PASSWORD_REQUIRED');
    }

    if (payload.invitationId !== invitationId) {
      throw new UnauthorizedException('PASSWORD_REQUIRED');
    }

    return true;
  }
}
