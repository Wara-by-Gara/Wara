import {
  pgTable,
  text,
  timestamp,
  primaryKey,
  index,
  uniqueIndex,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { ulid } from 'ulid';
import { users } from './users';

export const conversations = pgTable('conversations', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => ulid()),
  // 'direct'(1:1) | 'group'(단톡방). 기존 행은 전부 direct.
  type: text('type').notNull().default('direct'),
  // 그룹 이름 (null이면 멤버 이름으로 자동 생성). direct는 항상 null.
  title: text('title'),
  // 1:1 대화 중복 방지용 정규화 키: min(userId):max(userId).
  // 그룹챗은 null (1:1만 유니크 보장).
  directKey: text('direct_key').unique(),
  // 비정규화 캐시 — 대화 목록 미리보기/정렬용. 메시지 전송 시 함께 갱신.
  lastMessageText: text('last_message_text'),
  lastMessageAt: timestamp('last_message_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const conversationParticipants = pgTable(
  'conversation_participants',
  {
    conversationId: text('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // 이 유저가 마지막으로 읽은 시각 → 안 읽음 수 계산 기준.
    lastReadAt: timestamp('last_read_at', { withTimezone: true }),
    // 채팅방 나가기 시각 (카톡식). 이 시각 이전 메시지는 내 화면에서 숨김.
    // 새 메시지(left_at 이후)가 오면 목록에 다시 등장 — 상대 기록은 유지.
    leftAt: timestamp('left_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.conversationId, t.userId] }),
    index('idx_conversation_participants_user').on(t.userId),
  ],
);

export const messages = pgTable(
  'messages',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => ulid()),
    conversationId: text('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    senderId: text('sender_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    // 이미지 메시지의 S3 key (텍스트 메시지는 null). 조회 시 view presigned URL로 변환.
    imageKey: text('image_key'),
    // 답장 대상 메시지 (자기 참조). 원본 삭제 시 null.
    replyToMessageId: text('reply_to_message_id').references(
      (): AnyPgColumn => messages.id,
      { onDelete: 'set null' },
    ),
    // 메시지 수정 시각 ("수정됨" 표시용)
    editedAt: timestamp('edited_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [
    // 대화방 메시지를 시간순으로 조회 (페이지네이션).
    index('idx_messages_conversation_created').on(t.conversationId, t.createdAt),
  ],
);

// 메시지 이모지 리액션. 유저당 메시지에 1개(다른 이모지로 교체, 같은 이모지면 취소).
export const messageReactions = pgTable(
  'message_reactions',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => ulid()),
    messageId: text('message_id')
      .notNull()
      .references(() => messages.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // 허용 키: heart | thumbsup | check | smile | surprise | cry
    emoji: text('emoji').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('uq_message_reactions_message_user').on(t.messageId, t.userId),
  ],
);

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type ConversationParticipant = typeof conversationParticipants.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type MessageReaction = typeof messageReactions.$inferSelect;
export type NewMessageReaction = typeof messageReactions.$inferInsert;
