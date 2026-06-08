import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ErrorCode } from '../common/constants/error-codes';
import { ConversationsRepository } from './conversations.repository';
import { ConversationsGateway } from './conversations.gateway';

export interface ConversationListItem {
  id: string;
  partner: { id: string; name: string | null; avatarUrl: string | null };
  lastMessageText: string | null;
  lastMessageAt: Date | null;
  unreadCount: number;
}

export interface MessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: Date;
}

@Injectable()
export class ConversationsService {
  constructor(
    private readonly repository: ConversationsRepository,
    private readonly gateway: ConversationsGateway,
  ) {}

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
    await this.assertMember(conversationId, userId);

    const rows = await this.repository.listMessages(conversationId, cursor, limit);
    const hasMore = rows.length === limit;
    const nextCursor = hasMore ? rows[rows.length - 1]!.id : null;

    // 최신순으로 가져온 뒤 화면 표시용으로 오래된→최신 정렬
    return { messages: rows.reverse(), nextCursor };
  }

  async sendMessage(userId: string, conversationId: string, content: string) {
    await this.assertMember(conversationId, userId);

    const message = await this.repository.insertMessage(conversationId, userId, content);
    await this.repository.updateLastMessage(
      conversationId,
      content,
      message.createdAt,
    );
    // 보낸 사람은 자기 메시지를 읽은 것으로 처리
    await this.repository.updateLastRead(conversationId, userId, message.createdAt);

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
  }

  // 대화방 존재 + 내가 참가자인지 확인
  private async assertMember(conversationId: string, userId: string) {
    const conversation = await this.repository.findConversationById(conversationId);
    if (!conversation) {
      throw new NotFoundException(ErrorCode.CONVERSATION_NOT_FOUND);
    }
    const participant = await this.repository.findParticipant(conversationId, userId);
    if (!participant) {
      throw new ForbiddenException(ErrorCode.CONVERSATION_FORBIDDEN);
    }
  }

  private buildDirectKey(a: string, b: string): string {
    return a < b ? `${a}:${b}` : `${b}:${a}`;
  }
}
