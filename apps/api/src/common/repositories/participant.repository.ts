import { Injectable } from '@nestjs/common';
import { MemberRole } from '../enums/member-role.enum';

/**
 * 모임 참가자 조회 Repository (placeholder).
 *
 * 현재는 `NotImplemented`를 throw하는 placeholder.
 * 하림(`feature/auth-db`)의 Drizzle 구현으로 본문을 교체한다.
 *
 * - 의존 schema: `apps/api/drizzle/schema/invitations.ts` (participants 테이블)
 * - DI 등록 위치: `apps/api/src/auth/auth.module.ts`
 * - 사용처: `apps/api/src/common/guards/host.guard.ts`
 */
@Injectable()
export class ParticipantRepository {
  async findMemberRole(
    _userId: string,
    _invitationId: string,
  ): Promise<MemberRole | null> {
    throw new Error('ParticipantRepository.findMemberRole: NotImplemented');
  }
}
