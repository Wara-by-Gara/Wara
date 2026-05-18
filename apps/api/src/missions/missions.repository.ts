import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import {
  invitations,
  missionAssignments,
  missionTemplates,
  missions,
  participants,
  users,
} from '../../drizzle/schema';
import { ErrorCode } from '../common/constants/error-codes';
import { MemberRole } from '../common/enums/member-role.enum';
import { DRIZZLE, DrizzleDB, DrizzleTx } from '../database/database.module';

export type MissionRow = typeof missions.$inferSelect;
export type MissionTemplateRow = typeof missionTemplates.$inferSelect;
export type MissionAssignmentRow = typeof missionAssignments.$inferSelect;
type DbExecutor = DrizzleDB | DrizzleTx;

@Injectable()
export class MissionsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  withTransaction<T>(fn: (tx: DrizzleTx) => Promise<T>): Promise<T> {
    return this.db.transaction(fn);
  }

  async findInvitationMissionEnabled(
    invitationId: string,
    tx?: DrizzleTx,
  ): Promise<boolean | null> {
    const exec: DbExecutor = tx ?? this.db;
    const rows = await exec
      .select({ isMissionEnabled: invitations.isMissionEnabled })
      .from(invitations)
      .where(
        and(eq(invitations.id, invitationId), isNull(invitations.deletedAt)),
      )
      .limit(1);
    return rows[0]?.isMissionEnabled ?? null;
  }

  // assignMissions 동시 호출 race를 막기 위한 invitation row 잠금.
  // 같은 invitationId에 대해 다른 트랜잭션이 끝날 때까지 대기.
  async lockInvitationMissionEnabled(
    invitationId: string,
    tx: DrizzleTx,
  ): Promise<boolean | null> {
    const rows = await tx
      .select({ isMissionEnabled: invitations.isMissionEnabled })
      .from(invitations)
      .where(
        and(eq(invitations.id, invitationId), isNull(invitations.deletedAt)),
      )
      .for('update')
      .limit(1);
    return rows[0]?.isMissionEnabled ?? null;
  }

  async findHostParticipantId(
    userId: string,
    invitationId: string,
    tx?: DrizzleTx,
  ): Promise<string | null> {
    const exec: DbExecutor = tx ?? this.db;
    const rows = await exec
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

  async findManyByInvitationId(
    invitationId: string,
    tx?: DrizzleTx,
  ): Promise<MissionRow[]> {
    const exec: DbExecutor = tx ?? this.db;
    return exec
      .select()
      .from(missions)
      .where(eq(missions.invitationId, invitationId))
      .orderBy(missions.createdAt);
  }

  async create(
    values: {
      invitationId: string;
      participantId: string;
      content: string;
    },
    tx?: DrizzleTx,
  ): Promise<MissionRow> {
    const exec: DbExecutor = tx ?? this.db;
    const [row] = await exec.insert(missions).values(values).returning();
    if (!row) {
      throw new InternalServerErrorException(ErrorCode.DB_TRANSACTION_FAILED);
    }
    return row;
  }

  async updateContent(
    invitationId: string,
    id: string,
    content: string,
    tx?: DrizzleTx,
  ): Promise<MissionRow | null> {
    const exec: DbExecutor = tx ?? this.db;
    const [row] = await exec
      .update(missions)
      .set({ content, updatedAt: new Date() })
      .where(and(eq(missions.id, id), eq(missions.invitationId, invitationId)))
      .returning();
    return row ?? null;
  }

  async deleteByIdInInvitation(
    invitationId: string,
    id: string,
    tx?: DrizzleTx,
  ): Promise<boolean> {
    const exec: DbExecutor = tx ?? this.db;
    const rows = await exec
      .delete(missions)
      .where(and(eq(missions.id, id), eq(missions.invitationId, invitationId)))
      .returning({ id: missions.id });
    return rows.length > 0;
  }

  // ── Mission Templates ──────────────────────────────────────────────────────

  listActiveTemplates(): Promise<MissionTemplateRow[]> {
    return this.db
      .select()
      .from(missionTemplates)
      .where(eq(missionTemplates.isActive, true))
      .orderBy(missionTemplates.createdAt);
  }

  async findActiveTemplateById(
    templateId: string,
    tx?: DrizzleTx,
  ): Promise<MissionTemplateRow | null> {
    const exec: DbExecutor = tx ?? this.db;
    const rows = await exec
      .select()
      .from(missionTemplates)
      .where(
        and(
          eq(missionTemplates.id, templateId),
          eq(missionTemplates.isActive, true),
        ),
      )
      .limit(1);
    return rows[0] ?? null;
  }

  // ── Assignment ─────────────────────────────────────────────────────────────

  // 게스트(GUEST)만 배정 대상. HOST는 미션 작성자라 본인 배정 제외.
  // FOR SHARE로 참가자 row 잠금 — assign 트랜잭션 중간에 CASCADE로 사라지는 race 방어.
  async findAttendingParticipantIds(
    invitationId: string,
    tx: DrizzleTx,
  ): Promise<string[]> {
    const rows = await tx
      .select({ id: participants.id })
      .from(participants)
      .innerJoin(users, eq(participants.userId, users.id))
      .where(
        and(
          eq(participants.invitationId, invitationId),
          eq(participants.rsvpStatus, 'attending'),
          eq(participants.memberRole, MemberRole.GUEST),
          isNull(users.deletedAt),
        ),
      )
      .for('share');
    return rows.map((r) => r.id);
  }

  async deleteAssignmentsByMissionIds(
    missionIds: string[],
    tx: DrizzleTx,
  ): Promise<void> {
    if (missionIds.length === 0) return;
    await tx
      .delete(missionAssignments)
      .where(inArray(missionAssignments.missionId, missionIds));
  }

  async bulkInsertAssignments(
    rows: Array<{ missionId: string; participantId: string }>,
    tx: DrizzleTx,
  ): Promise<MissionAssignmentRow[]> {
    if (rows.length === 0) return [];
    return tx.insert(missionAssignments).values(rows).returning();
  }

  async findAssignedMissionForParticipant(
    invitationId: string,
    participantId: string,
  ): Promise<{ mission: MissionRow; assignment: MissionAssignmentRow } | null> {
    // soft-deleted invitation은 노출 금지 (다른 경로는 enabled 체크에서 차단됨)
    const rows = await this.db
      .select({ mission: missions, assignment: missionAssignments })
      .from(missionAssignments)
      .innerJoin(missions, eq(missionAssignments.missionId, missions.id))
      .innerJoin(invitations, eq(missions.invitationId, invitations.id))
      .where(
        and(
          eq(missionAssignments.participantId, participantId),
          eq(missions.invitationId, invitationId),
          isNull(invitations.deletedAt),
        ),
      )
      .orderBy(missionAssignments.assignedAt, missionAssignments.id)
      .limit(1);
    return rows[0] ?? null;
  }

  async findParticipantIdByUser(
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
          isNull(users.deletedAt),
        ),
      )
      .limit(1);
    return rows[0]?.id ?? null;
  }
}
