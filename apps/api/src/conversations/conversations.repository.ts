import { Injectable, Inject } from '@nestjs/common';
import { and, eq, ne, lt, gt, desc, isNull, inArray, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import {
  conversations,
  conversationParticipants,
  messages,
  messageReactions,
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
      .where(
        and(
          isNull(conversations.deletedAt),
          // 나간 방은 숨김 — 단, 나간 이후 새 메시지가 오면 다시 표시
          or(isNull(myP.leftAt), gt(conversations.lastMessageAt, myP.leftAt)),
        ),
      )
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
          // 나간 이후 메시지만 카운트
          or(
            isNull(conversationParticipants.leftAt),
            gt(messages.createdAt, conversationParticipants.leftAt),
          ),
        ),
      )
      .groupBy(messages.conversationId);
  }

  // 대화방 메시지 — cursor(ULID)보다 오래된 것부터 최신순으로 limit개.
  // leftAt 이후 메시지만 (나간 뒤 재진입 시 이전 기록 숨김).
  async listMessages(
    conversationId: string,
    cursor: string | undefined,
    limit: number,
    leftAt: Date | null,
  ) {
    const reply = alias(messages, 'reply');
    return this.db
      .select({
        id: messages.id,
        conversationId: messages.conversationId,
        senderId: messages.senderId,
        content: messages.content,
        imageKey: messages.imageKey,
        createdAt: messages.createdAt,
        deletedAt: messages.deletedAt,
        editedAt: messages.editedAt,
        replyToMessageId: messages.replyToMessageId,
        replyToSenderId: reply.senderId,
        replyToContent: reply.content,
        replyToDeletedAt: reply.deletedAt,
      })
      .from(messages)
      .leftJoin(reply, eq(reply.id, messages.replyToMessageId))
      .where(
        and(
          eq(messages.conversationId, conversationId),
          // 삭제된 메시지도 포함 ("삭제된 메시지입니다" 표시용)
          cursor ? lt(messages.id, cursor) : undefined,
          leftAt ? gt(messages.createdAt, leftAt) : undefined,
        ),
      )
      .orderBy(desc(messages.id))
      .limit(limit);
  }

  // 채팅방 나가기 — 내 leftAt 갱신 (상대는 유지)
  async leaveConversation(conversationId: string, userId: string) {
    await this.db
      .update(conversationParticipants)
      .set({ leftAt: new Date() })
      .where(
        and(
          eq(conversationParticipants.conversationId, conversationId),
          eq(conversationParticipants.userId, userId),
        ),
      );
  }

  async insertMessage(
    conversationId: string,
    senderId: string,
    content: string,
    replyToMessageId?: string,
    imageKey?: string,
  ) {
    const rows = await this.db
      .insert(messages)
      .values({ conversationId, senderId, content, replyToMessageId, imageKey })
      .returning();
    return rows[0]!;
  }

  // 삭제 여부 무관하게 메시지 조회 (답장 미리보기 해석용)
  async findMessageRaw(messageId: string) {
    const rows = await this.db
      .select({
        id: messages.id,
        senderId: messages.senderId,
        content: messages.content,
        deletedAt: messages.deletedAt,
      })
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);
    return rows[0] ?? null;
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

  // 전체 안읽음 DM 메시지 수 (내가 참여 + 나간 이후 + 안 읽은 + 내가 보낸 게 아닌)
  async unreadTotal(userId: string): Promise<number> {
    const rows = await this.db
      .select({ count: sql<number>`count(*)::int` })
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
          ne(messages.senderId, userId),
          isNull(messages.deletedAt),
          or(
            isNull(conversationParticipants.lastReadAt),
            gt(messages.createdAt, conversationParticipants.lastReadAt),
          ),
          or(
            isNull(conversationParticipants.leftAt),
            gt(messages.createdAt, conversationParticipants.leftAt),
          ),
        ),
      );
    return rows[0]?.count ?? 0;
  }

  // 대화방의 가장 최근 메시지 (삭제 포함) — 목록 미리보기 재계산용
  async findLatestMessage(conversationId: string) {
    const rows = await this.db
      .select({
        content: messages.content,
        createdAt: messages.createdAt,
        deletedAt: messages.deletedAt,
      })
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.id))
      .limit(1);
    return rows[0] ?? null;
  }

  async findMessageById(messageId: string) {
    const rows = await this.db
      .select()
      .from(messages)
      .where(and(eq(messages.id, messageId), isNull(messages.deletedAt)))
      .limit(1);
    return rows[0] ?? null;
  }

  async updateMessageContent(messageId: string, content: string) {
    const rows = await this.db
      .update(messages)
      .set({ content, editedAt: new Date() })
      .where(eq(messages.id, messageId))
      .returning();
    return rows[0]!;
  }

  // ---- 메시지 이모지 리액션 ----

  // 여러 메시지의 리액션을 한 번에 (리스트 응답 조립용)
  async getReactionsForMessages(messageIds: string[]) {
    if (messageIds.length === 0) return [];
    return this.db
      .select({
        messageId: messageReactions.messageId,
        emoji: messageReactions.emoji,
        userId: messageReactions.userId,
      })
      .from(messageReactions)
      .where(inArray(messageReactions.messageId, messageIds));
  }

  async getMessageReactions(messageId: string) {
    return this.db
      .select({ emoji: messageReactions.emoji, userId: messageReactions.userId })
      .from(messageReactions)
      .where(eq(messageReactions.messageId, messageId));
  }

  // 리액션 상세(누가 어떤 이모지) — 유저 표시정보 조인, 먼저 누른 순
  async getMessageReactionsWithUsers(messageId: string) {
    return this.db
      .select({
        userId: messageReactions.userId,
        name: users.name,
        avatarUrl: users.profileImageUrl,
        emoji: messageReactions.emoji,
      })
      .from(messageReactions)
      .innerJoin(users, eq(users.id, messageReactions.userId))
      .where(eq(messageReactions.messageId, messageId))
      .orderBy(messageReactions.createdAt);
  }

  async findUserReaction(messageId: string, userId: string) {
    const rows = await this.db
      .select({ emoji: messageReactions.emoji })
      .from(messageReactions)
      .where(
        and(eq(messageReactions.messageId, messageId), eq(messageReactions.userId, userId)),
      )
      .limit(1);
    return rows[0] ?? null;
  }

  // 유저당 메시지 1개 — 있으면 이모지 교체, 없으면 추가 (unique(message_id,user_id))
  async setUserReaction(messageId: string, userId: string, emoji: string) {
    await this.db
      .insert(messageReactions)
      .values({ messageId, userId, emoji })
      .onConflictDoUpdate({
        target: [messageReactions.messageId, messageReactions.userId],
        set: { emoji },
      });
  }

  async deleteUserReaction(messageId: string, userId: string) {
    await this.db
      .delete(messageReactions)
      .where(
        and(eq(messageReactions.messageId, messageId), eq(messageReactions.userId, userId)),
      );
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
