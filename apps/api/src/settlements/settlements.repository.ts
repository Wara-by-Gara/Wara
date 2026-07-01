import { Injectable, Inject } from '@nestjs/common';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { DRIZZLE, DrizzleDB } from '../database/database.module';
import * as schema from '../database/schema';

interface ShareInput {
  participantId: string;
  share: number;
}

@Injectable()
export class SettlementsRepository {
  constructor(@Inject(DRIZZLE) private db: DrizzleDB) {}

  async findByInvitationId(invitationId: string) {
    const [row] = await this.db
      .select()
      .from(schema.settlements)
      .where(and(eq(schema.settlements.invitationId, invitationId), isNull(schema.settlements.deletedAt)))
      .limit(1);
    return row ?? null;
  }

  async findByShareToken(token: string) {
    const [row] = await this.db
      .select()
      .from(schema.settlements)
      .where(and(eq(schema.settlements.shareToken, token), isNull(schema.settlements.deletedAt)))
      .limit(1);
    return row ?? null;
  }

  /** 초대장의 정산을 조회하거나 없으면 생성 (idempotent). */
  async getOrCreate(invitationId: string) {
    const existing = await this.findByInvitationId(invitationId);
    if (existing) return existing;
    const [row] = await this.db
      .insert(schema.settlements)
      .values({ invitationId })
      .onConflictDoNothing()
      .returning();
    // onConflict(동시 생성)로 비어 있으면 재조회
    return row ?? (await this.findByInvitationId(invitationId))!;
  }

  async updateSettlement(
    id: string,
    data: Partial<Pick<schema.Settlement, 'status' | 'isAnonymized' | 'shareToken'>>,
  ) {
    const [row] = await this.db
      .update(schema.settlements)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.settlements.id, id))
      .returning();
    return row!;
  }

  async findExpenseById(expenseId: string) {
    const [row] = await this.db
      .select()
      .from(schema.settlementExpenses)
      .where(and(eq(schema.settlementExpenses.id, expenseId), isNull(schema.settlementExpenses.deletedAt)))
      .limit(1);
    return row ?? null;
  }

  async findExpenses(settlementId: string) {
    return this.db
      .select()
      .from(schema.settlementExpenses)
      .where(and(eq(schema.settlementExpenses.settlementId, settlementId), isNull(schema.settlementExpenses.deletedAt)))
      .orderBy(schema.settlementExpenses.createdAt);
  }

  async findSharesByExpenseIds(expenseIds: string[]) {
    if (expenseIds.length === 0) return [];
    return this.db
      .select()
      .from(schema.settlementExpenseShares)
      .where(inArray(schema.settlementExpenseShares.expenseId, expenseIds));
  }

  async createExpenseWithShares(
    settlementId: string,
    data: { payerParticipantId: string; title: string; amount: number; splitType: 'equal' | 'custom' },
    shares: ShareInput[],
  ) {
    return this.db.transaction(async (tx) => {
      const [expense] = await tx
        .insert(schema.settlementExpenses)
        .values({ settlementId, ...data })
        .returning();
      if (shares.length > 0) {
        await tx.insert(schema.settlementExpenseShares).values(
          shares.map((s) => ({ expenseId: expense!.id, participantId: s.participantId, share: s.share })),
        );
      }
      return expense!;
    });
  }

  async replaceExpenseWithShares(
    expenseId: string,
    data: { payerParticipantId: string; title: string; amount: number; splitType: 'equal' | 'custom' },
    shares: ShareInput[],
  ) {
    return this.db.transaction(async (tx) => {
      const [expense] = await tx
        .update(schema.settlementExpenses)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(schema.settlementExpenses.id, expenseId))
        .returning();
      await tx.delete(schema.settlementExpenseShares).where(eq(schema.settlementExpenseShares.expenseId, expenseId));
      if (shares.length > 0) {
        await tx.insert(schema.settlementExpenseShares).values(
          shares.map((s) => ({ expenseId, participantId: s.participantId, share: s.share })),
        );
      }
      return expense!;
    });
  }

  async softDeleteExpense(expenseId: string) {
    await this.db
      .update(schema.settlementExpenses)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.settlementExpenses.id, expenseId));
  }

  /** 초대장 참가자 목록 (표시 이름 + 검증용). */
  async findParticipants(invitationId: string) {
    return this.db
      .select({
        participantId:   schema.participants.id,
        userId:          schema.participants.userId,
        name:            schema.users.name,
        nickname:        schema.users.nickname,
        profileImageUrl: schema.users.profileImageUrl,
      })
      .from(schema.participants)
      .innerJoin(schema.users, eq(schema.participants.userId, schema.users.id))
      .where(eq(schema.participants.invitationId, invitationId));
  }
}
