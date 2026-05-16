import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE, DrizzleDB } from '../database/database.module';
import { eq, and, count } from 'drizzle-orm';
import { notifications, notificationSettings, type NewNotification } from '../../drizzle/schema';
import type { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';

@Injectable()
export class NotificationsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAllByUser(userId: string, page: number, limit: number) {
    const offset = (page - 1) * limit;
    return this.db.query.notifications.findMany({
      where: (t, { eq }) => eq(t.userId, userId),
      orderBy: (t, { desc }) => desc(t.createdAt),
      limit,
      offset,
    });
  }

  async countByUser(userId: string) {
    const [result] = await this.db
      .select({ total: count() })
      .from(notifications)
      .where(eq(notifications.userId, userId));
    return result?.total ?? 0;
  }

  async countUnreadByUser(userId: string) {
    const [result] = await this.db
      .select({ total: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
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

  async markAllAsRead(userId: string) {
    await this.db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  }

  async findSettings(userId: string) {
    return this.db.query.notificationSettings.findFirst({
      where: (t, { eq }) => eq(t.userId, userId),
    });
  }

  async create(data: Omit<NewNotification, 'id' | 'isRead' | 'readAt' | 'createdAt'>) {
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
