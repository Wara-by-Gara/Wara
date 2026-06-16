import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, isNull, ne } from 'drizzle-orm';
import {
  participants,
  textBlasts,
  users,
  type NewTextBlast,
  type TextBlast,
} from '../database/schema';
import { DRIZZLE, DrizzleDB } from '../database/database.module';

export type TextBlastRow = TextBlast;

@Injectable()
export class TextBlastsRepository {
  constructor(@Inject(DRIZZLE) private db: DrizzleDB) {}

  async create(data: NewTextBlast) {
    const [result] = await this.db.insert(textBlasts).values(data).returning();
    return result!;
  }

  async findByInvitation(invitationId: string) {
    return this.db
      .select()
      .from(textBlasts)
      .where(
        and(
          eq(textBlasts.invitationId, invitationId),
          isNull(textBlasts.deletedAt),
        ),
      )
      .orderBy(desc(textBlasts.createdAt));
  }

  /** 발송 대상: 해당 초대장 참석자(탈퇴 유저 제외) 중 발송자 본인 제외 */
  async findRecipientUserIds(
    invitationId: string,
    excludeUserId: string,
  ): Promise<string[]> {
    const rows = await this.db
      .select({ userId: participants.userId })
      .from(participants)
      .innerJoin(users, eq(participants.userId, users.id))
      .where(
        and(
          eq(participants.invitationId, invitationId),
          ne(participants.userId, excludeUserId),
          isNull(users.deletedAt),
        ),
      );
    return rows.map((r) => r.userId);
  }

  async softDelete(id: string, invitationId: string) {
    const [result] = await this.db
      .update(textBlasts)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(textBlasts.id, id),
          eq(textBlasts.invitationId, invitationId),
          isNull(textBlasts.deletedAt),
        ),
      )
      .returning();
    return result ?? null;
  }
}
