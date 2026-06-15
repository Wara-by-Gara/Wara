import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE, DrizzleDB } from '../database/database.module';
import { eq, and, count } from 'drizzle-orm';
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
      where: (t, { eq, and, lt }) =>
        cursor
          ? and(eq(t.userId, userId), lt(t.id, cursor))
          : eq(t.userId, userId),
      orderBy: (t, { desc }) => desc(t.id),
      limit: limit + 1,
    });
  }

  async countUnreadByUser(userId: string) {
    const [result] = await this.db
      .select({ total: count() })
      .from(notifications)
      .where(
        and(eq(notifications.userId, userId), eq(notifications.isRead, false)),
      );
    return result?.total ?? 0;
  }

  async findById(id: string) {
    return this.db.query.notifications.findFirst({
      where: (t, { eq }) => eq(t.id, id),
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
    await this.db.delete(notifications).where(eq(notifications.id, id));
  }

  async deleteAllByUser(userId: string) {
    await this.db.delete(notifications).where(eq(notifications.userId, userId));
  }

  async markAllAsRead(userId: string) {
    await this.db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(
        and(eq(notifications.userId, userId), eq(notifications.isRead, false)),
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
