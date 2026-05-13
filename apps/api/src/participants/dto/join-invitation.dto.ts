import { z } from 'zod';

/**
 * 초대장 참가
 * POST /invitations/:invitationId/participants
 *
 * 빈 body: rsvpStatus는 항상 'undecided' 기본값으로 자동 설정
 */
export const JoinInvitationSchema = z.object({});

export type JoinInvitationDto = z.infer<typeof JoinInvitationSchema>;
