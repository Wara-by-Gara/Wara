import { z } from 'zod';

/**
 * 초대장 참가 요청 스키마
 * POST /invitations/:invitationId/participants-example
 *
 * 빈 body: rsvpStatus는 항상 'undecided' 기본값으로 자동 설정
 * 사용자는 이후 PATCH로 RSVP 상태를 변경한다.
 */
export const JoinInvitationSchema = z.object({});

export type JoinInvitationDto = z.infer<typeof JoinInvitationSchema>;
