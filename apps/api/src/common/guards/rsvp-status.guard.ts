import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ErrorCode } from '../constants/error-codes';
import { RSVP_STATUS_KEY } from '../decorators/require-rsvp-status.decorator';
import { RsvpStatus } from '../enums/rsvp-status.enum';

@Injectable()
export class RsvpStatusGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredStatuses = this.reflector.getAllAndOverride<RsvpStatus[]>(
      RSVP_STATUS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredStatuses || requiredStatuses.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const participant = request.participant!;

    if (participant.memberRole === 'HOST') {
      return true;
    }

    if (!requiredStatuses.includes(participant.rsvpStatus as RsvpStatus)) {
      throw new ForbiddenException(ErrorCode.RSVP_PERMISSION_DENIED);
    }

    return true;
  }
}
