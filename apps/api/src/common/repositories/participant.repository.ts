import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { participants, users, type Participant } from '../../database/schema';
import { DRIZZLE, DrizzleDB } from '../../database/database.module';
import { MemberRole } from '../enums/member-role.enum';

/**
 * 모임 참가자 조회 Repository.
 *
 * - DI 등록 위치: `apps/api/src/auth/auth.module.ts`
 * - 사용처: `apps/api/src/common/guards/host.guard.ts` — `@RequireMemberRole` 검증 시 조회
 * - 의존 schema: `apps/api/src/database/schema/invitations.ts` (participants 테이블,
 *   unique index `uq_participants_user_invitation`)
 *
 * Soft-deleted user 처리:
 * `users.deletedAt`이 set된 user의 participants row는 ON DELETE CASCADE로 자동
 * 삭제되지 않으므로 (CLAUDE.md "soft delete = deleted_at"), `users` INNER JOIN +
 * `isNull(users.deletedAt)` 조건으로 명시적 차단.
 */
@Injectable()
export class ParticipantRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findMemberRole(
    userId: string,
    invitationId: string,
  ): Promise<MemberRole | null> {
    const rows = await this.db
      .select({ memberRole: participants.memberRole })
      .from(participants)
      .innerJoin(users, eq(participants.userId, users.id))
      .where(
        and(
          eq(participants.userId, userId),
          eq(participants.invitationId, invitationId),
          isNull(users.deletedAt),
        ),
      )
      .limit(1);
    return (rows[0]?.memberRole as MemberRole | undefined) ?? null;
  }

  async findByUserAndInvitation(
    userId: string,
    invitationId: string,
  ): Promise<Participant | null> {
    const rows = await this.db
      .select()
      .from(participants)
      .innerJoin(users, eq(participants.userId, users.id))
      .where(
        and(
          eq(participants.userId, userId),
          eq(participants.invitationId, invitationId),
          isNull(users.deletedAt),
        ),
      )
      .limit(1);
    return rows[0]?.participants ?? null;
  }
}
