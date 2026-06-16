import { Injectable, Inject } from '@nestjs/common';
import { ulid } from 'ulid';
import { DRIZZLE, DrizzleDB } from '../database/database.module';
import { eq, and, count, isNull } from 'drizzle-orm';
import {
  notifications,
  notificationSettings,
  type NewNotification,
} from '../database/schema';
import type { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';

@Injectable()
export class NotificationsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAllByUser(
    userId: string,
    cursor: string | undefined,
    limit: number,
  ) {
    return this.db.query.notifications.findMany({
      where: (t, { eq, and, lt, isNull }) =>
        cursor
          ? and(eq(t.userId, userId), isNull(t.deletedAt), lt(t.id, cursor))
          : and(eq(t.userId, userId), isNull(t.deletedAt)),
      orderBy: (t, { desc }) => desc(t.id),
      limit: limit + 1,
    });
  }

  async countUnreadByUser(userId: string) {
    const [result] = await this.db
      .select({ total: count() })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false),
          isNull(notifications.deletedAt),
        ),
      );
    return result?.total ?? 0;
  }

  async findById(id: string) {
    return this.db.query.notifications.findFirst({
      where: (t, { eq, and, isNull }) => and(eq(t.id, id), isNull(t.deletedAt)),
    });
  }

  async markAsRead(id: string) {
    const [result] = await this.db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(notifications.id, id))
      .returning();
    return result!;
  }

  async deleteNotification(id: string) {
    await this.db
      .update(notifications)
      .set({ deletedAt: new Date() })
      .where(eq(notifications.id, id));
  }

  async deleteAllByUser(userId: string) {
    await this.db
      .update(notifications)
      .set({ deletedAt: new Date() })
      .where(
        and(eq(notifications.userId, userId), isNull(notifications.deletedAt)),
      );
  }

  async markAllAsRead(userId: string) {
    await this.db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false),
          isNull(notifications.deletedAt),
        ),
      );
  }

  async findSettings(userId: string) {
    return this.db.query.notificationSettings.findFirst({
      where: (t, { eq }) => eq(t.userId, userId),
    });
  }

  async create(
    data: Omit<NewNotification, 'id' | 'isRead' | 'readAt' | 'createdAt'>,
  ) {
    const [result] = await this.db
      .insert(notifications)
      .values(data)
      .returning();
    return result!;
  }

  // DM 알림: 대화방당 미읽음 1건만 유지 (피드 스팸 방지).
  // 기존 미읽음 알림이 있으면 새 ULID로 id를 갱신해 피드 상단으로 끌어올리고
  // 최신 메시지 내용/시각을 반영한다. 없으면 새로 생성.
  async upsertMessageNotification(data: {
    userId: string;
    actorUserId?: string;
    content: string;
    conversationId: string;
  }) {
    const existing = await this.db.query.notifications.findFirst({
      where: (t, { eq, and, isNull }) =>
        and(
          eq(t.userId, data.userId),
          eq(t.type, 'message'),
          eq(t.targetId, data.conversationId),
          eq(t.isRead, false),
          isNull(t.deletedAt),
        ),
    });
    if (existing) {
      const [result] = await this.db
        .update(notifications)
        .set({
          id: ulid(),
          content: data.content,
          actorUserId: data.actorUserId ?? null,
          createdAt: new Date(),
        })
        .where(eq(notifications.id, existing.id))
        .returning();
      return result!;
    }
    return this.create({
      userId: data.userId,
      actorUserId: data.actorUserId,
      type: 'message',
      content: data.content,
      targetType: 'conversation',
      targetId: data.conversationId,
    });
  }

  // 대화방 메시지 알림을 읽음 처리 (방 입장 시). 갱신된 알림 id 목록 반환.
  async markMessageNotificationRead(userId: string, conversationId: string) {
    const rows = await this.db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.type, 'message'),
          eq(notifications.targetId, conversationId),
          eq(notifications.isRead, false),
          isNull(notifications.deletedAt),
        ),
      )
      .returning({ id: notifications.id });
    return rows.map((r) => r.id);
  }

  async upsertSettings(userId: string, data: UpdateNotificationSettingsDto) {
    const [result] = await this.db
      .insert(notificationSettings)
      .values({ userId, ...data })
      .onConflictDoUpdate({
        target: notificationSettings.userId,
        set: { ...data, updatedAt: new Date() },
      })
      .returning();
    return result!;
  }
}
