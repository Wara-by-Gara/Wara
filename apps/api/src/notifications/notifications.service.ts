import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { NotificationsRepository } from './notifications.repository';
import { NotificationsGateway } from './notifications.gateway';
import { ErrorCode } from '../common/constants/error-codes';
import type { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';
import type {
  notificationTypeEnum,
  notificationTargetTypeEnum,
} from '../database/schema';

type NotificationType = (typeof notificationTypeEnum.enumValues)[number];
type NotificationTargetType =
  (typeof notificationTargetTypeEnum.enumValues)[number];

type NotificationSettingKey =
  | 'isRemind'
  | 'isFeedback'
  | 'isInvitationDate'
  | 'isPhoto'
  | 'isParticipantLocations'
  | 'isEventLocations';

const TYPE_TO_SETTING: Partial<
  Record<NotificationType, NotificationSettingKey>
> = {
  remind: 'isRemind',
  feedback: 'isFeedback',
  mention: 'isFeedback',
  invitation_date: 'isInvitationDate',
  photo: 'isPhoto',
  participantLocations: 'isParticipantLocations',
  eventLocations: 'isEventLocations',
  arrived: 'isParticipantLocations',
};

@Injectable()
export class NotificationsService {
  constructor(
    private readonly repository: NotificationsRepository,
    private readonly gateway: NotificationsGateway,
  ) {}

  async findAll(userId: string, cursor: string | undefined, limit: number) {
    const rows = await this.repository.findAllByUser(userId, cursor, limit);
    const hasNext = rows.length > limit;
    const items = hasNext ? rows.slice(0, limit) : rows;
    const nextCursor = hasNext ? (items.at(-1)?.id ?? null) : null;
    return { items, nextCursor, hasNext };
  }

  async getUnreadCount(userId: string) {
    const count = await this.repository.countUnreadByUser(userId);
    return { count };
  }

  async deleteNotification(userId: string, id: string) {
    const notification = await this.repository.findById(id);
    if (!notification) {
      throw new NotFoundException(ErrorCode.NOTIFICATION_NOT_FOUND);
    }
    if (notification.userId !== userId) {
      throw new ForbiddenException(ErrorCode.NOTIFICATION_FORBIDDEN);
    }
    await this.repository.deleteNotification(id);
  }

  async markAsRead(userId: string, id: string) {
    const notification = await this.repository.findById(id);
    if (!notification) {
      throw new NotFoundException(ErrorCode.NOTIFICATION_NOT_FOUND);
    }
    if (notification.userId !== userId) {
      throw new ForbiddenException(ErrorCode.NOTIFICATION_FORBIDDEN);
    }
    const result = await this.repository.markAsRead(id);
    this.gateway.sendReadToUser(userId, id);
    return result;
  }

  async markAllAsRead(userId: string) {
    await this.repository.markAllAsRead(userId);
    this.gateway.sendReadAllToUser(userId);
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
    invitationId?: string;
  }) {
    const settingKey = TYPE_TO_SETTING[data.type];
    if (settingKey) {
      const settings = await this.repository.findSettings(data.userId);
      if (settings && settings[settingKey] === false) return null;
    }
    const notification = await this.repository.create(data);
    this.gateway.sendToUser(data.userId, notification);
    return notification;
  }
}
