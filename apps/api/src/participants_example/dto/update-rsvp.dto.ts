import { z } from 'zod';

/**
 * RSVP 상태 업데이트 스키마
 * PATCH /invitations/:invitationId/participants-example/:id
 *
 * z.enum(): 배열 값 외 입력 시 자동 400 반환
 * z.infer<>: 별도 타입 선언 없이 TS 타입 자동 생성
 */
export const UpdateRsvpSchema = z.object({
  rsvpStatus: z.enum(['attending', 'undecided', 'absent']),
});

export type UpdateRsvpDto = z.infer<typeof UpdateRsvpSchema>;
