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
import { FriendsRepository } from '../friends/friends.repository';
import { ConversationsRepository } from './conversations.repository';
import { ConversationsGateway } from './conversations.gateway';

export interface ConversationListItem {
  id: string;
  type: 'direct' | 'group';
  // 표시용 이름/이미지 (direct=상대, group=그룹명/기본). 멤버에서 계산해 내려준다.
  title: string;
  avatarUrl: string | null;
  memberCount: number;
  lastMessageText: string | null;
  lastMessageAt: Date | null;
  unreadCount: number;
}

// 단톡방 최대 인원 (트레이드오프 고려한 실질 상한). 늘리려면 이 값만 변경.
const MAX_GROUP_MEMBERS = 30;

// 그룹명이 없을 때 멤버 이름으로 자동 생성 ("송지안, 임지아 외 1명")
function autoGroupTitle(names: string[]): string {
  if (names.length === 0) return '그룹 대화';
  const head = names.slice(0, 3).join(', ');
  return names.length > 3 ? `${head} 외 ${names.length - 3}명` : head;
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
  // 'user' | 'system' (입장/퇴장 안내)
  type: string;
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
  // 이 메시지를 아직 안 읽은 다른 참여자 수 (보낸 사람 제외). 카톡식 숫자.
  unreadCount: number;
}

// 메시지 행을 클라이언트 응답 형태로 변환 (삭제된 메시지는 내용 숨김)
function toMessageItem(
  row: {
    id: string;
    conversationId: string;
    senderId: string;
    type?: string;
    content: string;
    createdAt: Date;
    deletedAt: Date | null;
    editedAt: Date | null;
  },
  replyTo: ReplyPreview = null,
  reactions: ReactionSummary[] = [],
  myReaction: string | null = null,
  imageUrl: string | null = null,
  unreadCount = 0,
): MessageItem {
  const deleted = row.deletedAt != null;
  return {
    id: row.id,
    conversationId: row.conversationId,
    senderId: row.senderId,
    type: row.type ?? 'user',
    content: deleted ? '' : row.content,
    imageUrl: deleted ? null : imageUrl,
    createdAt: row.createdAt,
    deleted,
    edited: row.editedAt != null,
    replyTo,
    reactions,
    myReaction,
    unreadCount,
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
    private readonly friendsRepository: FriendsRepository,
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
    if (existing) {
      return { id: existing.id };
    }

    const shared = await this.friendsRepository.findSharedInvitations(userId, targetUserId);
    if (shared.length === 0) {
      throw new NotFoundException(ErrorCode.FRIEND_NOT_FOUND);
    }

    const conversation = await this.repository.createDirectConversation(directKey, [
      userId,
      targetUserId,
    ]);
    return { id: conversation.id };
  }

  // 내 개인 방 별명 설정 (빈 문자열이면 해제 -> 기본 이름)
  async setAlias(userId: string, conversationId: string, alias: string) {
    await this.assertMember(conversationId, userId);
    const trimmed = alias.trim();
    await this.repository.setParticipantAlias(
      conversationId,
      userId,
      trimmed.length > 0 ? trimmed : null,
    );
    return { conversationId };
  }

  // 시스템 메시지 1건 삽입 + 미리보기 갱신 + 남은 멤버에게 실시간 전송
  private async postSystemMessage(
    conversationId: string,
    actorId: string,
    text: string,
  ) {
    const row = await this.repository.insertSystemMessage(conversationId, actorId, text);
    await this.repository.updateLastMessage(conversationId, text, row.createdAt);
    const message = toMessageItem(row);
    const others = await this.repository.otherParticipantIds(conversationId, actorId);
    for (const otherId of others) {
      this.gateway.sendMessageToUser(otherId, message);
    }
  }

  // "OOO님, OOO님이 들어왔습니다" 입장 안내
  private async postJoinMessage(
    conversationId: string,
    inviterId: string,
    inviteeIds: string[],
  ) {
    const rows = await this.repository.getUserNames(inviteeIds);
    const nameMap = new Map(rows.map((r) => [r.id, r.name]));
    const names = inviteeIds.map((id) => nameMap.get(id) ?? '사용자');
    await this.postSystemMessage(
      conversationId,
      inviterId,
      `${names.join('님, ')}님이 들어왔습니다.`,
    );
  }

  // 초대: direct에서 부르면 새 group 생성(1:1 유지), group에서 부르면 멤버 추가.
  // title은 direct->group 최초 생성 시 방장(생성자)이 정하는 공유 이름.
  async invite(
    userId: string,
    conversationId: string,
    inviteeIds: string[],
    title?: string,
  ) {
    await this.assertMember(conversationId, userId);
    const conversation = await this.repository.findConversationById(conversationId);
    if (!conversation) {
      throw new NotFoundException(ErrorCode.CONVERSATION_NOT_FOUND);
    }

    // 현재 멤버 = 나 + 나머지 참가자(leftAt 무관 — direct→group 시 상대/생성자 보존용)
    const others = await this.repository.otherParticipantIds(conversationId, userId);
    const memberSet = new Set([userId, ...others]);

    // "이미 멤버"는 활성 참가자(leftAt null)만 — 나간 사람은 다시 초대할 수 있어야 함
    const activeIds = new Set(
      (await this.repository.listParticipants(conversationId)).map((p) => p.userId),
    );
    activeIds.add(userId);

    // 활성멤버/중복 제외 후 실제 존재하는 유저만
    const candidates = [...new Set(inviteeIds)].filter((id) => !activeIds.has(id));
    const invitees = await this.repository.filterActiveUserIds(candidates);
    if (invitees.length === 0) {
      throw new BadRequestException(ErrorCode.GROUP_NO_VALID_INVITEES);
    }

    if (conversation.type === 'group') {
      // 정원은 활성 멤버 + 신규(재초대 포함) 기준
      if (activeIds.size + invitees.length > MAX_GROUP_MEMBERS) {
        throw new BadRequestException(ErrorCode.GROUP_MEMBER_LIMIT_EXCEEDED);
      }
      await this.repository.addParticipants(conversationId, invitees);
      await this.postJoinMessage(conversationId, userId, invitees);
      return { conversationId };
    }

    // direct -> [나, 상대, ...초대]로 새 group 생성
    const groupMembers = [...memberSet, ...invitees];
    if (groupMembers.length > MAX_GROUP_MEMBERS) {
      throw new BadRequestException(ErrorCode.GROUP_MEMBER_LIMIT_EXCEEDED);
    }
    const cleanTitle = title?.trim();
    const group = await this.repository.createGroupConversation(
      cleanTitle && cleanTitle.length > 0 ? cleanTitle : null,
      groupMembers,
    );
    await this.postJoinMessage(group.id, userId, invitees);
    return { conversationId: group.id };
  }

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    return { count: await this.repository.unreadTotal(userId) };
  }

  async getDetail(userId: string, conversationId: string) {
    const me = await this.assertMember(conversationId, userId);
    const conversation = await this.repository.findConversationById(conversationId);
    const isGroup = conversation?.type === 'group';

    if (isGroup) {
      const members = await this.repository.listParticipants(conversationId);
      const others = members.filter((m) => m.userId !== userId);
      // 우선순위: 내 별명 > 공유 이름 > 멤버 자동 이름
      const title =
        me.alias ??
        conversation?.title ??
        autoGroupTitle(others.map((m) => m.name ?? '사용자'));
      return {
        id: conversationId,
        type: 'group' as const,
        title,
        memberCount: members.length,
        partner: null,
        partnerLastReadAt: null,
      };
    }

    const partner = await this.repository.getPartner(conversationId, userId);
    return {
      id: conversationId,
      type: 'direct' as const,
      title: me.alias ?? partner?.name ?? '상대',
      memberCount: 2,
      partner: partner
        ? { id: partner.id, name: partner.name, avatarUrl: partner.avatarUrl }
        : null,
      // 내가 보낸 메시지의 읽음 표시용 — 상대가 마지막으로 읽은 시각
      partnerLastReadAt: partner?.lastReadAt ?? null,
    };
  }

  async getConversations(userId: string): Promise<ConversationListItem[]> {
    const rows = await this.repository.listForUser(userId);
    const ids = rows.map((r) => r.id);
    const unread = await this.repository.unreadCounts(userId, ids);
    const unreadMap = new Map(unread.map((u) => [u.conversationId, u.count]));

    // 모든 방의 참가자를 한 번에 조회해 방별로 묶는다 (표시 이름/이미지/인원 계산용)
    const participants = await this.repository.listParticipantsForConversations(ids);
    const byConv = new Map<
      string,
      {
        userId: string;
        name: string | null;
        avatarUrl: string | null;
        leftAt: Date | null;
      }[]
    >();
    for (const p of participants) {
      const list = byConv.get(p.conversationId) ?? [];
      list.push({
        userId: p.userId,
        name: p.name,
        avatarUrl: p.avatarUrl,
        leftAt: p.leftAt,
      });
      byConv.set(p.conversationId, list);
    }

    return rows.map((r) => {
      const members = byConv.get(r.id) ?? [];
      const others = members.filter((m) => m.userId !== userId);
      const isGroup = r.type === 'group';
      // 그룹 인원/자동이름은 나간 멤버 제외 (1:1 상대는 leftAt 무관 표시)
      const activeOthers = others.filter((m) => !m.leftAt);
      const base = isGroup
        ? (r.title ?? autoGroupTitle(activeOthers.map((m) => m.name ?? '사용자')))
        : (others[0]?.name ?? '상대');
      // 방의 마지막 메시지가 내 (재)입장 시점 이전이면 내겐 아직 볼 메시지가 없음
      // → 미리보기를 비운다 (재입장 직후 입장 전 대화가 미리보기로 새던 문제 방지).
      const anchor = this.visibilityAnchor({
        joinedAt: r.myJoinedAt,
        leftAt: r.myLeftAt,
      });
      const hasVisible = !!r.lastMessageAt && r.lastMessageAt > anchor;
      return {
        id: r.id,
        type: isGroup ? ('group' as const) : ('direct' as const),
        // 우선순위: 내 별명 > (그룹) 공유 이름/자동 · (1:1) 상대 이름
        title: r.alias ?? base,
        avatarUrl: isGroup ? null : (others[0]?.avatarUrl ?? null),
        memberCount: isGroup
          ? members.filter((m) => !m.leftAt).length
          : members.length,
        lastMessageText: hasVisible ? r.lastMessageText : null,
        lastMessageAt: hasVisible ? r.lastMessageAt : null,
        unreadCount: unreadMap.get(r.id) ?? 0,
      };
    });
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
      this.visibilityAnchor(participant),
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

    // 메시지별 안읽음 수: (보낸 사람 제외) 활성 참여자 중 lastReadAt이 메시지 이전인 수
    const reads = (await this.repository.listParticipantsRead(conversationId)).filter(
      (p) => !p.leftAt,
    );
    const unreadCountFor = (senderId: string, createdAt: Date) =>
      reads.filter(
        (p) =>
          p.userId !== senderId &&
          // 입장(joinedAt) 전 메시지는 그 멤버에게 안 보이므로 카운트 제외
          p.joinedAt < createdAt &&
          (!p.lastReadAt || p.lastReadAt < createdAt),
      ).length;

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
        row.type === 'system' ? 0 : unreadCountFor(row.senderId, row.createdAt),
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

    // 이미지 키 검증: 이 대화방 prefix + 실제 업로드 완료된 객체만 허용
    // (클라가 다른 방 key나 업로드 안 된 key를 등록하는 것 방지)
    if (imageKey) {
      let exists = false;
      if (imageKey.startsWith(`dm/${conversationId}/`)) {
        try {
          await this.s3Service.headObject(imageKey);
          exists = true;
        } catch {
          exists = false;
        }
      }
      if (!exists) {
        throw new BadRequestException(ErrorCode.MESSAGE_IMAGE_INVALID);
      }
    }

    // 답장 대상이 이 대화방 메시지인지 검증
    if (replyToMessageId) {
      const replyTarget = await this.repository.findMessageRaw(replyToMessageId);
      if (!replyTarget || replyTarget.conversationId !== conversationId) {
        throw new NotFoundException(ErrorCode.MESSAGE_NOT_FOUND);
      }
    }

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
    // 방금 보낸 메시지의 안읽음 수 = 나 제외 활성 참여자 (아직 아무도 안 읽음)
    const unreadCount = (
      await this.repository.listParticipantsRead(conversationId)
    ).filter((p) => !p.leftAt && p.userId !== userId).length;
    const message = toMessageItem(
      row,
      await this.resolveReply(replyToMessageId),
      [],
      null,
      imageUrl,
      unreadCount,
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

    // 목록 미리보기 재계산 — 삭제됐으면 "삭제된 메시지입니다", 이미지면 "사진"
    const latest = await this.repository.findLatestMessage(conversationId);
    if (latest) {
      const preview = latest.deletedAt
        ? '삭제된 메시지입니다'
        : latest.content || (latest.imageKey ? '사진' : '');
      await this.repository.updateLastMessage(
        conversationId,
        preview,
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
    const rows = await this.repository.listPhotos(
      conversationId,
      this.visibilityAnchor(participant),
    );
    const photos = await Promise.all(
      rows.map(async (r) => ({
        messageId: r.messageId,
        imageUrl: await this.s3Service.getViewPresignedUrl(r.imageKey!),
        createdAt: r.createdAt,
        uploaderName: r.uploaderName,
      })),
    );
    return { photos };
  }

  // 채팅방 나가기 (나만 — 상대 기록은 유지)
  async leaveConversation(userId: string, conversationId: string) {
    await this.assertMember(conversationId, userId);
    const conversation = await this.repository.findConversationById(conversationId);
    await this.repository.leaveConversation(conversationId, userId);

    // 그룹이면 남은 멤버에게 "OOO님이 나갔습니다" 시스템 메시지
    if (conversation?.type === 'group') {
      const user = await this.repository.findUserById(userId);
      await this.postSystemMessage(
        conversationId,
        userId,
        `${user?.name ?? '사용자'}님이 나갔습니다.`,
      );
    }
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

  // 내 화면에 보일 메시지 시작 시각 = (재)입장 시각과 나가기 시각 중 더 늦은 쪽.
  // 입장 전·나간 뒤 대화는 숨기고, 재입장하면 재입장 시점부터 보이게 한다.
  private visibilityAnchor(p: { joinedAt: Date; leftAt: Date | null }): Date {
    return p.leftAt && p.leftAt > p.joinedAt ? p.leftAt : p.joinedAt;
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
