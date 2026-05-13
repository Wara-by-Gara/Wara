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

    const accessToken = request.headers['x-access-token'];
    if (typeof accessToken !== 'string' || accessToken.length === 0) {
      throw new UnauthorizedException('PASSWORD_REQUIRED');
    }

    try {
      await this.jwtService.verifyAsync(accessToken);
      return true;
    } catch {
      throw new UnauthorizedException('PASSWORD_REQUIRED');
    }
  }
}
