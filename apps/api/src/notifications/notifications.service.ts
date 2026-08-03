import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { NotificationsRepository } from './notifications.repository';
import { NotificationsGateway } from './notifications.gateway';
import { PushService } from '../push/push.service';
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
  | 'isParticipant'
  | 'isParticipantLocations'
  | 'isEventLocations'
  | 'isMessage'
  | 'isInquiryAnswer';

const TYPE_TO_SETTING: Partial<
  Record<NotificationType, NotificationSettingKey>
> = {
  remind: 'isRemind',
  feedback: 'isFeedback',
  mention: 'isFeedback',
  invitation_date: 'isInvitationDate',
  photo: 'isPhoto',
  participant_joined: 'isParticipant',
  participantLocations: 'isParticipantLocations',
  eventLocations: 'isEventLocations',
  arrived: 'isParticipantLocations',
  message: 'isMessage',
  // 투표 독촉/시작은 '리마인드'로 묶어 끌 수 있게 함 (별도 컬럼 없이 단순화).
  // 단, 날짜 확정(vote_confirmed)·마감 동점(vote_tied)은 필수라 게이트 없음.
  vote_reminder: 'isRemind',
  inquiry_answer: 'isInquiryAnswer',
};

// 푸시 알림 제목 — 타입별 사람이 읽는 라벨 (body는 notification.content 그대로).
const TYPE_TO_PUSH_TITLE: Partial<Record<NotificationType, string>> = {
  message: '새 메시지',
  feedback: '새 댓글',
  mention: '새 댓글',
  photo: '새 사진',
  participant_joined: '새 참가자',
  arrived: '도착 알림',
  remind: '모임 알림',
  vote_reminder: '모임 알림',
  vote_confirmed: '모임 알림',
  vote_tied: '모임 알림',
  participantLocations: '위치 공유',
  eventLocations: '위치 공유',
  ai_complete: 'AI 이미지',
  nudge: '모임 알림',
  text_blast: '공지',
  inquiry_answer: '문의 답변',
};

// 푸시/표시용 body — 대부분 content 그대로지만, content가 JSON인 ai_complete는
// 사람이 읽는 문구로 치환한다 (content는 클라 socket 파싱용이라 그대로 유지).
function resolvePushBody(data: { type: NotificationType; content: string }): string {
  if (data.type === 'ai_complete') {
    try {
      const parsed = JSON.parse(data.content) as { success?: boolean };
      return parsed.success
        ? 'AI 커버 이미지가 완성됐어요!'
        : 'AI 커버 이미지 생성에 실패했어요. 다시 시도해주세요.';
    } catch {
      return 'AI 커버 이미지 생성이 완료됐어요.';
    }
  }
  return data.content;
}

const VOTE_TYPES: ReadonlySet<NotificationType> = new Set<NotificationType>([
  'vote_reminder',
  'vote_confirmed',
  'vote_tied',
]);

// 알림 → 앱 내 딥링크 (NotificationsContainer 라우팅 로직과 동일하게 맞춤).
function buildPushUrl(data: {
  type: NotificationType;
  targetType?: NotificationTargetType;
  targetId?: string;
  invitationId?: string;
}): string {
  if (data.targetType === 'conversation' && data.targetId) {
    return `/chats/${data.targetId}`;
  }
  if (data.targetType === 'invitation' && data.targetId) {
    return VOTE_TYPES.has(data.type)
      ? `/invitations/${data.targetId}/vote`
      : `/invitations/${data.targetId}`;
  }
  if (data.invitationId) {
    if (data.targetType === 'feedback') {
      return `/invitations/${data.invitationId}?focus=comments`;
    }
    if (data.targetType === 'photo' || data.targetType === 'mission') {
      return `/invitations/${data.invitationId}`;
    }
  }
  return '/notifications';
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly repository: NotificationsRepository,
    private readonly gateway: NotificationsGateway,
    private readonly pushService: PushService,
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

  async deleteAllNotifications(userId: string) {
    await this.repository.deleteAllByUser(userId);
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

    // 백그라운드/앱 닫힘 상태용 Web Push (best-effort — 실패해도 알림 생성은 성공).
    // 같은 설정 게이트를 이미 통과했으므로 off면 위에서 return된 상태.
    void this.pushService.send(data.userId, {
      title: TYPE_TO_PUSH_TITLE[data.type] ?? 'WARA',
      body: resolvePushBody(data),
      url: buildPushUrl(data),
      tag:
        data.targetType === 'conversation' && data.targetId
          ? `dm-${data.targetId}`
          : data.type,
    });

    return notification;
  }

  // DM 전용 알림 — 대화방당 미읽음 1건 upsert + 실시간 emit + 푸시.
  async notifyMessage(data: {
    userId: string;
    actorUserId?: string;
    conversationId: string;
    content: string;
  }) {
    const settings = await this.repository.findSettings(data.userId);
    if (settings && settings.isMessage === false) return null;

    const notification = await this.repository.upsertMessageNotification(data);
    this.gateway.sendToUser(data.userId, notification);

    void this.pushService.send(data.userId, {
      title: '새 메시지',
      body: data.content,
      url: `/chats/${data.conversationId}`,
      tag: `dm-${data.conversationId}`,
    });

    return notification;
  }

  // 대화방 입장 시 해당 방의 DM 알림을 읽음 처리 + 실시간 동기화.
  async markConversationRead(userId: string, conversationId: string) {
    const ids = await this.repository.markMessageNotificationRead(
      userId,
      conversationId,
    );
    for (const id of ids) this.gateway.sendReadToUser(userId, id);
  }
}
