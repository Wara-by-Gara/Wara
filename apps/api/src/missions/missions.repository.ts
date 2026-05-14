import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { ErrorCode } from '../common/constants/error-codes';
import { MemberRole } from '../common/enums/member-role.enum';
import { DRIZZLE, DrizzleDB } from '../database/database.module';
import {
  invitations,
  missions,
  participants,
  users,
} from '../../drizzle/schema';

export type MissionRow = typeof missions.$inferSelect;

/**
 * 미션 도메인 데이터 접근 계층.
 *
 * - 스키마 참조: `apps/api/drizzle/schema/missions.ts`
 *   (id, invitation_id, participant_id, content, created_at, updated_at)
 * - mission 테이블에는 `deleted_at` 컬럼이 없어 hard delete로 동작.
 */
@Injectable()
export class MissionsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findInvitationMissionEnabled(
    invitationId: string,
  ): Promise<boolean | null> {
    const rows = await this.db
      .select({ isMissionEnabled: invitations.isMissionEnabled })
      .from(invitations)
      .where(eq(invitations.id, invitationId))
      .limit(1);
    return rows[0]?.isMissionEnabled ?? null;
  }

  /**
   * 호스트 유저의 participants row id를 조회한다.
   * soft-deleted 유저는 제외 (users.deletedAt IS NULL).
   */
  async findHostParticipantId(
    userId: string,
    invitationId: string,
  ): Promise<string | null> {
    const rows = await this.db
      .select({ id: participants.id })
      .from(participants)
      .innerJoin(users, eq(participants.userId, users.id))
      .where(
        and(
          eq(participants.userId, userId),
          eq(participants.invitationId, invitationId),
          eq(participants.memberRole, MemberRole.HOST),
          isNull(users.deletedAt),
        ),
      )
      .limit(1);
    return rows[0]?.id ?? null;
  }

  findManyByInvitationId(invitationId: string): Promise<MissionRow[]> {
    return this.db
      .select()
      .from(missions)
      .where(eq(missions.invitationId, invitationId))
      .orderBy(missions.createdAt);
  }

  async create(values: {
    invitationId: string;
    participantId: string;
    content: string;
  }): Promise<MissionRow> {
    const [row] = await this.db.insert(missions).values(values).returning();
    if (!row) {
      throw new InternalServerErrorException(ErrorCode.DB_TRANSACTION_FAILED);
    }
    return row;
  }

  async updateContent(
    invitationId: string,
    id: string,
    content: string,
  ): Promise<MissionRow | null> {
    const [row] = await this.db
      .update(missions)
      .set({ content, updatedAt: new Date() })
      .where(and(eq(missions.id, id), eq(missions.invitationId, invitationId)))
      .returning();
    return row ?? null;
  }

  async deleteByIdInInvitation(
    invitationId: string,
    id: string,
  ): Promise<boolean> {
    const rows = await this.db
      .delete(missions)
      .where(and(eq(missions.id, id), eq(missions.invitationId, invitationId)))
      .returning({ id: missions.id });
    return rows.length > 0;
  }
}
