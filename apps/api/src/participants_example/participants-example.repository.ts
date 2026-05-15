import { Injectable, Inject } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DRIZZLE, DrizzleDB } from '../database/database.module';
import * as schema from '../../drizzle/schema';
import type { rsvpStatusEnum } from '../../drizzle/schema';

type RsvpStatus = (typeof rsvpStatusEnum.enumValues)[number];

/**
 * 참가자 레포지토리 — DB 쿼리만 담당
 *
 * Service에서는 이 메서드만 호출한다.
 * DB 문법(Drizzle)은 여기서만 사용하므로,
 * 나중에 쿼리를 바꾸거나 캐시를 추가할 때 이 파일만 수정하면 된다.
 */
@Injectable()
export class ParticipantsExampleRepository {
  constructor(@Inject(DRIZZLE) private db: DrizzleDB) {}

  async findAllByInvitation(invitationId: string) {
    return this.db
      .select({
        id: schema.participants.id,
        userId: schema.participants.userId,
        invitationId: schema.participants.invitationId,
        memberRole: schema.participants.memberRole,
        rsvpStatus: schema.participants.rsvpStatus,
        createdAt: schema.participants.createdAt,
      })
      .from(schema.participants)
      .where(eq(schema.participants.invitationId, invitationId));
  }

  async findById(id: string) {
    const result = await this.db
      .select()
      .from(schema.participants)
      .where(eq(schema.participants.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async findByUserAndInvitation(userId: string, invitationId: string) {
    const result = await this.db
      .select()
      .from(schema.participants)
      .where(
        and(
          eq(schema.participants.userId, userId),
          eq(schema.participants.invitationId, invitationId),
        ),
      )
      .limit(1);
    return result[0] ?? null;
  }

  async create(data: { userId: string; invitationId: string }) {
    const result = await this.db
      .insert(schema.participants)
      .values({ ...data, memberRole: 'GUEST' })
      .returning();
    return result[0];
  }

  async updateRsvpStatus(id: string, rsvpStatus: RsvpStatus) {
    const result = await this.db
      .update(schema.participants)
      .set({ rsvpStatus, updatedAt: new Date() })
      .where(eq(schema.participants.id, id))
      .returning();
    return result[0];
  }

  async softDelete(id: string) {
    // SKILL Rule: deletedAt 컬럼이 스키마에 추가되면 아래 코드로 대체
    // await this.db.update(schema.participants)
    //   .set({ deletedAt: new Date() })
    //   .where(eq(schema.participants.id, id));
    await this.db
      .delete(schema.participants)
      .where(eq(schema.participants.id, id));
  }
}
