import { Injectable, Inject } from '@nestjs/common';
import { and, eq, ne, lt, desc, isNull, inArray, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import {
  conversations,
  conversationParticipants,
  messages,
  users,
} from '../database/schema';
import { DRIZZLE, DrizzleDB } from '../database/database.module';

@Injectable()
export class ConversationsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findByDirectKey(directKey: string) {
    const rows = await this.db
      .select()
      .from(conversations)
      .where(
        and(eq(conversations.directKey, directKey), isNull(conversations.deletedAt)),
      )
      .limit(1);
    return rows[0] ?? null;
  }

  // 대화방 + 두 참가자를 한 트랜잭션으로 생성. directKey 중복 시 기존 방 재사용(멱등).
  async createDirectConversation(directKey: string, userIds: [string, string]) {
    return this.db.transaction(async (tx) => {
      const inserted = await tx
        .insert(conversations)
        .values({ directKey })
        .onConflictDoNothing({ target: conversations.directKey })
        .returning();

      // 동시 요청으로 이미 생성된 경우 → 기존 방 조회
      const conversation =
        inserted[0] ??
        (
          await tx
            .select()
            .from(conversations)
            .where(eq(conversations.directKey, directKey))
            .limit(1)
        )[0];

      if (inserted[0]) {
        await tx.insert(conversationParticipants).values([
          { conversationId: conversation!.id, userId: userIds[0] },
          { conversationId: conversation!.id, userId: userIds[1] },
        ]);
      }

      return conversation!;
    });
  }

  async findConversationById(id: string) {
    const rows = await this.db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, id), isNull(conversations.deletedAt)))
      .limit(1);
    return rows[0] ?? null;
  }

  async findParticipant(conversationId: string, userId: string) {
    const rows = await this.db
      .select()
      .from(conversationParticipants)
      .where(
        and(
          eq(conversationParticipants.conversationId, conversationId),
          eq(conversationParticipants.userId, userId),
        ),
      )
      .limit(1);
    return rows[0] ?? null;
  }

  // 내 대화 목록 — 상대 참가자 정보 + 내 lastReadAt 포함, 최근 메시지 순.
  async listForUser(userId: string) {
    const myP = alias(conversationParticipants, 'my_p');
    const otherP = alias(conversationParticipants, 'other_p');

    return this.db
      .select({
        id: conversations.id,
        lastMessageText: conversations.lastMessageText,
        lastMessageAt: conversations.lastMessageAt,
        myLastReadAt: myP.lastReadAt,
        partnerId: users.id,
        partnerName: users.name,
        partnerAvatarUrl: users.profileImageUrl,
      })
      .from(conversations)
      .innerJoin(
        myP,
        and(eq(myP.conversationId, conversations.id), eq(myP.userId, userId)),
      )
      .innerJoin(
        otherP,
        and(
          eq(otherP.conversationId, conversations.id),
          ne(otherP.userId, userId),
        ),
      )
      .innerJoin(users, eq(users.id, otherP.userId))
      .where(isNull(conversations.deletedAt))
      .orderBy(desc(conversations.lastMessageAt));
  }

  // 주어진 대화방들에서 내가 안 읽은 메시지 수 (내 lastReadAt 이후 + 내가 보낸 게 아닌 것).
  async unreadCounts(userId: string, conversationIds: string[]) {
    if (conversationIds.length === 0) return [];
    return this.db
      .select({
        conversationId: messages.conversationId,
        count: sql<number>`count(*)::int`,
      })
      .from(messages)
      .innerJoin(
        conversationParticipants,
        and(
          eq(conversationParticipants.conversationId, messages.conversationId),
          eq(conversationParticipants.userId, userId),
        ),
      )
      .where(
        and(
          inArray(messages.conversationId, conversationIds),
          ne(messages.senderId, userId),
          isNull(messages.deletedAt),
          or(
            isNull(conversationParticipants.lastReadAt),
            sql`${messages.createdAt} > ${conversationParticipants.lastReadAt}`,
          ),
        ),
      )
      .groupBy(messages.conversationId);
  }

  // 대화방 메시지 — cursor(ULID)보다 오래된 것부터 최신순으로 limit개.
  async listMessages(conversationId: string, cursor: string | undefined, limit: number) {
    return this.db
      .select({
        id: messages.id,
        conversationId: messages.conversationId,
        senderId: messages.senderId,
        content: messages.content,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(
        and(
          eq(messages.conversationId, conversationId),
          isNull(messages.deletedAt),
          cursor ? lt(messages.id, cursor) : undefined,
        ),
      )
      .orderBy(desc(messages.id))
      .limit(limit);
  }

  async insertMessage(conversationId: string, senderId: string, content: string) {
    const rows = await this.db
      .insert(messages)
      .values({ conversationId, senderId, content })
      .returning();
    return rows[0]!;
  }

  async updateLastMessage(conversationId: string, text: string, at: Date) {
    await this.db
      .update(conversations)
      .set({ lastMessageText: text, lastMessageAt: at, updatedAt: at })
      .where(eq(conversations.id, conversationId));
  }

  async updateLastRead(conversationId: string, userId: string, at: Date) {
    await this.db
      .update(conversationParticipants)
      .set({ lastReadAt: at })
      .where(
        and(
          eq(conversationParticipants.conversationId, conversationId),
          eq(conversationParticipants.userId, userId),
        ),
      );
  }

  async findMessageById(messageId: string) {
    const rows = await this.db
      .select()
      .from(messages)
      .where(and(eq(messages.id, messageId), isNull(messages.deletedAt)))
      .limit(1);
    return rows[0] ?? null;
  }

  async softDeleteMessage(messageId: string) {
    await this.db
      .update(messages)
      .set({ deletedAt: new Date() })
      .where(eq(messages.id, messageId));
  }

  // 대화방의 상대 참가자 정보 (1:1 헤더용) + 상대의 읽음 시각.
  async getPartner(conversationId: string, userId: string) {
    const rows = await this.db
      .select({
        id: users.id,
        name: users.name,
        avatarUrl: users.profileImageUrl,
        lastReadAt: conversationParticipants.lastReadAt,
      })
      .from(conversationParticipants)
      .innerJoin(users, eq(users.id, conversationParticipants.userId))
      .where(
        and(
          eq(conversationParticipants.conversationId, conversationId),
          ne(conversationParticipants.userId, userId),
          isNull(users.deletedAt),
        ),
      )
      .limit(1);
    return rows[0] ?? null;
  }

  // 대화방의 나를 제외한 참가자 id들 (1:1이면 1명, 그룹 대비 배열).
  async otherParticipantIds(conversationId: string, exceptUserId: string) {
    const rows = await this.db
      .select({ userId: conversationParticipants.userId })
      .from(conversationParticipants)
      .where(
        and(
          eq(conversationParticipants.conversationId, conversationId),
          ne(conversationParticipants.userId, exceptUserId),
        ),
      );
    return rows.map((r) => r.userId);
  }

  async findUserById(userId: string) {
    const rows = await this.db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .limit(1);
    return rows[0] ?? null;
  }
}
