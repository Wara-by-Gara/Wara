import { z } from 'zod';

export const UpdateNotificationSettingsSchema = z.object({
  isRemind: z.boolean().optional(),
  isFeedback: z.boolean().optional(),
  isInvitationDate: z.boolean().optional(),
  isPhoto: z.boolean().optional(),
  isMission: z.boolean().optional(),
  isMessage: z.boolean().optional(),
  isParticipant: z.boolean().optional(),
  isParticipantLocations: z.boolean().optional(),
  isEventLocations: z.boolean().optional(),
});

export type UpdateNotificationSettingsDto = z.infer<
  typeof UpdateNotificationSettingsSchema
>;
