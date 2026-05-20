import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import type { Participant } from '../../database/schema';

export const CurrentParticipant = createParamDecorator(
  (_, ctx: ExecutionContext): Participant | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.participant;
  },
);
