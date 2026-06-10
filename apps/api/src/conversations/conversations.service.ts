import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ErrorCode } from '../common/constants/error-codes';
import { ulid } from 'ulid';
import { S3Service } from '../s3/s3.service';
import type { MessageImagePresignedDto } from './dto/send-message.dto';
import { ConversationsRepository } from './conversations.repository';
import { ConversationsGateway } from './conversations.gateway';

export interface ConversationListItem {
  id: string;
  partner: { id: string; name: string | null; avatarUrl: string | null };
  lastMessageText: string | null;
  lastMessageAt: Date | null;
  unreadCount: number;
}

export type ReplyPreview = {
  id: string;
  senderId: string;
  content: string;
  deleted: boolean;
} | null;

export interface ReactionSummary {
  emoji: string;
  count: number;
}

export interface MessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  // 이미지 메시지의 조회용 presigned URL (텍스트 메시지는 null)
  imageUrl: string | null;
  createdAt: Date;
  deleted: boolean;
  edited: boolean;
  replyTo: ReplyPreview;
  // 이모지별 집계 + 내가 누른 이모지(없으면 null)
  reactions: ReactionSummary[];
  myReaction: string | null;
}

// 메시지 행을 클라이언트 응답 형태로 변환 (삭제된 메시지는 내용 숨김)
function toMessageItem(
  row: {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    createdAt: Date;
    deletedAt: Date | null;
    editedAt: Date | null;
  },
  replyTo: ReplyPreview = null,
  reactions: ReactionSummary[] = [],
  myReaction: string | null = null,
  imageUrl: string | null = null,
): MessageItem {
  const deleted = row.deletedAt != null;
  return {
    id: row.id,
    conversationId: row.conversationId,
    senderId: row.senderId,
    content: deleted ? '' : row.content,
    imageUrl: deleted ? null : imageUrl,
    createdAt: row.createdAt,
    deleted,
    edited: row.editedAt != null,
    replyTo,
    reactions,
    myReaction,
  };
}

// 리액션 행들을 이모지별 집계로 변환
function aggregateReactions(rows: { emoji: string }[]): ReactionSummary[] {
  const counts = new Map<string, number>();
  for (const r of rows) counts.set(r.emoji, (counts.get(r.emoji) ?? 0) + 1);
  return [...counts.entries()].map(([emoji, count]) => ({ emoji, count }));
}

@Injectable()
export class ConversationsService {
  constructor(
    private readonly repository: ConversationsRepository,
    private readonly gateway: ConversationsGateway,
    private readonly s3Service: S3Service,
  ) {}

  // 이미지 업로드용 presigned URL 발급 (대화 참여자만)
  async generateImagePresignedUrl(
    userId: string,
    conversationId: string,
    dto: MessageImagePresignedDto,
  ) {
    await this.assertMember(conversationId, userId);
    const key = `dm/${conversationId}/${ulid()}/${dto.fileName}`;
    return this.s3Service.getUploadPresignedUrl(key, dto.contentType);
  }

  // 1:1 대화방 생성 또는 기존 방 재사용 (directKey 멱등)
  async createOrGet(userId: string, targetUserId: string) {
    if (targetUserId === userId) {
      throw new BadRequestException(ErrorCode.CANNOT_MESSAGE_SELF);
    }

    const target = await this.repository.findUserById(targetUserId);
    if (!target) {
      throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
    }

    const directKey = this.buildDirectKey(userId, targetUserId);
    const existing = await this.repository.findByDirectKey(directKey);
    const conversation =
      existing ??
      (await this.repository.createDirectConversation(directKey, [userId, targetUserId]));

    return { id: conversation.id };
  }

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    return { count: await this.repository.unreadTotal(userId) };
  }

  async getDetail(userId: string, conversationId: string) {
    await this.assertMember(conversationId, userId);
    const partner = await this.repository.getPartner(conversationId, userId);
    return {
      id: conversationId,
      partner: partner
        ? { id: partner.id, name: partner.name, avatarUrl: partner.avatarUrl }
        : null,
      // 내가 보낸 메시지의 읽음 표시용 — 상대가 마지막으로 읽은 시각
      partnerLastReadAt: partner?.lastReadAt ?? null,
    };
  }

  async getConversations(userId: string): Promise<ConversationListItem[]> {
    const rows = await this.repository.listForUser(userId);
    const unread = await this.repository.unreadCounts(
      userId,
      rows.map((r) => r.id),
    );
    const unreadMap = new Map(unread.map((u) => [u.conversationId, u.count]));

    return rows.map((r) => ({
      id: r.id,
      partner: { id: r.partnerId, name: r.partnerName, avatarUrl: r.partnerAvatarUrl },
      lastMessageText: r.lastMessageText,
      lastMessageAt: r.lastMessageAt,
      unreadCount: unreadMap.get(r.id) ?? 0,
    }));
  }

  async getMessages(
    userId: string,
    conversationId: string,
    cursor: string | undefined,
    limit: number,
  ) {
    const participant = await this.assertMember(conversationId, userId);

    const rows = await this.repository.listMessages(
      conversationId,
      cursor,
      limit,
      participant.leftAt,
    );
    const hasMore = rows.length === limit;
    const nextCursor = hasMore ? rows[rows.length - 1]!.id : null;

    // 이 페이지 메시지들의 리액션을 한 번에 조회해 메시지별 집계/내 리액션 맵을 만든다.
    const reactionRows = await this.repository.getReactionsForMessages(
      rows.map((r) => r.id),
    );
    const byMessage = new Map<string, { emoji: string }[]>();
    const myReactionMap = new Map<string, string>();
    for (const r of reactionRows) {
      const list = byMessage.get(r.messageId) ?? [];
      list.push({ emoji: r.emoji });
      byMessage.set(r.messageId, list);
      if (r.userId === userId) myReactionMap.set(r.messageId, r.emoji);
    }

    // 이미지 메시지의 조회용 presigned URL 생성
    const imageUrlMap = new Map<string, string>();
    await Promise.all(
      rows
        .filter((r) => r.imageKey)
        .map(async (r) => {
          imageUrlMap.set(r.id, await this.s3Service.getViewPresignedUrl(r.imageKey!));
        }),
    );

    // 최신순으로 가져온 뒤 화면 표시용으로 오래된→최신 정렬
    const messages = rows.reverse().map((row) =>
      toMessageItem(
        row,
        row.replyToMessageId
          ? {
              id: row.replyToMessageId,
              senderId: row.replyToSenderId!,
              content: row.replyToDeletedAt ? '' : (row.replyToContent ?? ''),
              deleted: row.replyToDeletedAt != null,
            }
          : null,
        aggregateReactions(byMessage.get(row.id) ?? []),
        myReactionMap.get(row.id) ?? null,
        imageUrlMap.get(row.id) ?? null,
      ),
    );
    return { messages, nextCursor };
  }

  async sendMessage(
    userId: string,
    conversationId: string,
    content: string,
    replyToMessageId?: string,
    imageKey?: string,
  ) {
    await this.assertMember(conversationId, userId);

    const row = await this.repository.insertMessage(
      conversationId,
      userId,
      content,
      replyToMessageId,
      imageKey,
    );
    // 목록 미리보기: 이미지 메시지는 '사진'으로 표시
    const preview = content || (imageKey ? '사진' : '');
    await this.repository.updateLastMessage(conversationId, preview, row.createdAt);
    // 보낸 사람은 자기 메시지를 읽은 것으로 처리
    await this.repository.updateLastRead(conversationId, userId, row.createdAt);

    const imageUrl = imageKey
      ? await this.s3Service.getViewPresignedUrl(imageKey)
      : null;
    const message = toMessageItem(
      row,
      await this.resolveReply(replyToMessageId),
      [],
      null,
      imageUrl,
    );
    const others = await this.repository.otherParticipantIds(conversationId, userId);
    for (const otherId of others) {
      this.gateway.sendMessageToUser(otherId, message);
    }

    return message;
  }

  async markRead(userId: string, conversationId: string) {
    await this.assertMember(conversationId, userId);
    await this.repository.updateLastRead(conversationId, userId, new Date());

    const others = await this.repository.otherParticipantIds(conversationId, userId);
    for (const otherId of others) {
      this.gateway.sendReadToUser(otherId, conversationId, userId);
    }
  }

  async deleteMessage(userId: string, conversationId: string, messageId: string) {
    await this.assertMember(conversationId, userId);

    const message = await this.repository.findMessageById(messageId);
    if (!message || message.conversationId !== conversationId) {
      throw new NotFoundException(ErrorCode.MESSAGE_NOT_FOUND);
    }
    if (message.senderId !== userId) {
      throw new ForbiddenException(ErrorCode.MESSAGE_FORBIDDEN);
    }

    await this.repository.softDeleteMessage(messageId);

    // 목록 미리보기 재계산 — 마지막 메시지가 삭제됐으면 "삭제된 메시지입니다"로
    const latest = await this.repository.findLatestMessage(conversationId);
    if (latest) {
      await this.repository.updateLastMessage(
        conversationId,
        latest.deletedAt ? '삭제된 메시지입니다' : latest.content,
        latest.createdAt,
      );
    }

    const others = await this.repository.otherParticipantIds(conversationId, userId);
    for (const otherId of others) {
      this.gateway.sendMessageDeleted(otherId, conversationId, messageId);
    }
  }

  async editMessage(
    userId: string,
    conversationId: string,
    messageId: string,
    content: string,
  ) {
    await this.assertMember(conversationId, userId);

    const existing = await this.repository.findMessageById(messageId);
    if (!existing || existing.conversationId !== conversationId) {
      throw new NotFoundException(ErrorCode.MESSAGE_NOT_FOUND);
    }
    if (existing.senderId !== userId) {
      throw new ForbiddenException(ErrorCode.MESSAGE_FORBIDDEN);
    }

    const row = await this.repository.updateMessageContent(messageId, content);
    const message = toMessageItem(row, await this.resolveReply(row.replyToMessageId));

    // 마지막 메시지면 목록 미리보기도 갱신
    const latest = await this.repository.findLatestMessage(conversationId);
    if (latest && !latest.deletedAt && latest.createdAt.getTime() === row.createdAt.getTime()) {
      await this.repository.updateLastMessage(conversationId, content, row.createdAt);
    }

    const others = await this.repository.otherParticipantIds(conversationId, userId);
    for (const otherId of others) {
      this.gateway.sendMessageEdited(otherId, message);
    }

    return message;
  }

  // 메시지 이모지 리액션 토글 (유저당 1개: 같은 이모지면 취소, 다른 이모지면 교체)
  async toggleReaction(
    userId: string,
    conversationId: string,
    messageId: string,
    emoji: string,
  ) {
    await this.assertMember(conversationId, userId);

    const message = await this.repository.findMessageById(messageId);
    if (!message || message.conversationId !== conversationId) {
      throw new NotFoundException(ErrorCode.MESSAGE_NOT_FOUND);
    }

    const existing = await this.repository.findUserReaction(messageId, userId);
    let myReaction: string | null;
    if (existing && existing.emoji === emoji) {
      await this.repository.deleteUserReaction(messageId, userId);
      myReaction = null;
    } else {
      await this.repository.setUserReaction(messageId, userId, emoji);
      myReaction = emoji;
    }

    const reactions = aggregateReactions(
      await this.repository.getMessageReactions(messageId),
    );

    // 상대에게 집계 실시간 동기화 (수신자의 myReaction은 각자 유지되므로 집계만 전달)
    const others = await this.repository.otherParticipantIds(conversationId, userId);
    for (const otherId of others) {
      this.gateway.sendReactionToUser(otherId, { conversationId, messageId, reactions });
    }

    return { messageId, reactions, myReaction };
  }

  // 메시지 리액션 상세: 누가 어떤 이모지를 눌렀는지 (바텀시트용)
  async getMessageReactors(
    userId: string,
    conversationId: string,
    messageId: string,
  ) {
    await this.assertMember(conversationId, userId);

    const message = await this.repository.findMessageById(messageId);
    if (!message || message.conversationId !== conversationId) {
      throw new NotFoundException(ErrorCode.MESSAGE_NOT_FOUND);
    }

    const reactors = await this.repository.getMessageReactionsWithUsers(messageId);
    return { reactors };
  }

  // 대화방 참여자 목록 (멤버/초대 패널용)
  async getParticipants(userId: string, conversationId: string) {
    await this.assertMember(conversationId, userId);
    const participants = await this.repository.listParticipants(conversationId);
    return { participants };
  }

  // 대화방 사진 갤러리 — 이미지 메시지의 조회용 presigned URL 생성
  async getPhotos(userId: string, conversationId: string) {
    const participant = await this.assertMember(conversationId, userId);
    const rows = await this.repository.listPhotos(conversationId, participant.leftAt);
    const photos = await Promise.all(
      rows.map(async (r) => ({
        messageId: r.messageId,
        imageUrl: await this.s3Service.getViewPresignedUrl(r.imageKey!),
        createdAt: r.createdAt,
      })),
    );
    return { photos };
  }

  // 채팅방 나가기 (나만 — 상대 기록은 유지)
  async leaveConversation(userId: string, conversationId: string) {
    await this.assertMember(conversationId, userId);
    await this.repository.leaveConversation(conversationId, userId);
  }

  // 대화방 존재 + 내가 참가자인지 확인 → 내 참가자 행 반환
  private async assertMember(conversationId: string, userId: string) {
    const conversation = await this.repository.findConversationById(conversationId);
    if (!conversation) {
      throw new NotFoundException(ErrorCode.CONVERSATION_NOT_FOUND);
    }
    const participant = await this.repository.findParticipant(conversationId, userId);
    if (!participant) {
      throw new ForbiddenException(ErrorCode.CONVERSATION_FORBIDDEN);
    }
    return participant;
  }

  // 답장 대상 메시지 미리보기 해석 (삭제됐으면 내용 숨김)
  private async resolveReply(
    replyToMessageId: string | null | undefined,
  ): Promise<ReplyPreview> {
    if (!replyToMessageId) return null;
    const target = await this.repository.findMessageRaw(replyToMessageId);
    if (!target) return null;
    return {
      id: target.id,
      senderId: target.senderId,
      content: target.deletedAt ? '' : target.content,
      deleted: target.deletedAt != null,
    };
  }

  private buildDirectKey(a: string, b: string): string {
    return a < b ? `${a}:${b}` : `${b}:${a}`;
  }
}
