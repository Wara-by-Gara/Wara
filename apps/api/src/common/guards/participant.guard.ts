import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { ErrorCode } from '../constants/error-codes';
import { ParticipantRepository } from '../repositories/participant.repository';

@Injectable()
export class ParticipantGuard implements CanActivate {
  constructor(private readonly participantRepository: ParticipantRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user!;
    const invitationId = request.params?.invitationId;

    if (typeof invitationId !== 'string' || invitationId.length === 0) {
      throw new ForbiddenException(ErrorCode.RSVP_PERMISSION_DENIED);
    }

    const participant = await this.participantRepository.findByUserAndInvitation(
      user.id,
      invitationId,
    );

    if (!participant) {
      throw new ForbiddenException(ErrorCode.RSVP_PERMISSION_DENIED);
    }

    request.participant = participant;
    return true;
  }
}
