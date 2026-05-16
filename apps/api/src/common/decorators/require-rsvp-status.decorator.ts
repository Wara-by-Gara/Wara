import { SetMetadata } from '@nestjs/common';
import { RsvpStatus } from '../enums/rsvp-status.enum';

export const RSVP_STATUS_KEY = 'rsvpStatus';
export const RequireRsvpStatus = (...statuses: RsvpStatus[]) =>
  SetMetadata(RSVP_STATUS_KEY, statuses);
