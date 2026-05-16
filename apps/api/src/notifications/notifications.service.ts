import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { NotificationsRepository } from './notifications.repository';
import { NotificationsGateway } from './notifications.gateway';
import { ErrorCode } from '../common/constants/error-codes';
import type { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';
import type { notificationTypeEnum, notificationTargetTypeEnum } from '../../drizzle/schema';

type NotificationType = (typeof notificationTypeEnum.enumValues)[number];
type NotificationTargetType = (typeof notificationTargetTypeEnum.enumValues)[number];

@Injectable()
export class NotificationsService {
  constructor(
    private readonly repository: NotificationsRepository,
    private readonly gateway: NotificationsGateway,
  ) {}

  async findAll(userId: string, page: number, limit: number) {
    const [items, total] = await Promise.all([
      this.repository.findAllByUser(userId, page, limit),
      this.repository.countByUser(userId),
    ]);
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUnreadCount(userId: string) {
    const count = await this.repository.countUnreadByUser(userId);
    return { count };
  }

  async markAsRead(userId: string, id: string) {
    const notification = await this.repository.findById(id);
    if (!notification) {
      throw new NotFoundException(ErrorCode.NOTIFICATION_NOT_FOUND);
    }
    if (notification.userId !== userId) {
      throw new ForbiddenException(ErrorCode.NOTIFICATION_FORBIDDEN);
    }
    return this.repository.markAsRead(id);
  }

  async markAllAsRead(userId: string) {
    await this.repository.markAllAsRead(userId);
  }

  async getSettings(userId: string) {
    return this.repository.findSettings(userId);
  }

  async updateSettings(userId: string, dto: UpdateNotificationSettingsDto) {
    return this.repository.upsertSettings(userId, dto);
  }

  async notify(data: {
    userId: string;
    actorUserId?: string;
    type: NotificationType;
    content: string;
    targetType?: NotificationTargetType;
    targetId?: string;
  }) {
    const notification = await this.repository.create(data);
    this.gateway.sendToUser(data.userId, notification);
    return notification;
  }
}
