import { Injectable, Inject } from '@nestjs/common';
import { and, eq, isNull, lt, desc } from 'drizzle-orm';
import { DRIZZLE, DrizzleDB } from '../database/database.module';
import * as schema from '../database/schema';

interface SourceQuery {
  invitationId: string;
  before?: Date;
  limit: number;
}

// 각 소스 행의 공통 형태 (actor는 vote_confirmed에서 null).
export interface ActorRow {
  actorUserId: string | null;
  name: string | null;
  nickname: string | null;
  profileImageUrl: string | null;
}

@Injectable()
export class ActivityFeedRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  /** 참가자 합류 이벤트 */
  async findJoins(q: SourceQuery) {
    return this.db
      .select({
        id:              schema.participants.id,
        occurredAt:      schema.participants.createdAt,
        memberRole:      schema.participants.memberRole,
        actorUserId:     schema.users.id,
        name:            schema.users.name,
        nickname:        schema.users.nickname,
        profileImageUrl: schema.users.profileImageUrl,
      })
      .from(schema.participants)
      .innerJoin(schema.users, eq(schema.participants.userId, schema.users.id))
      .where(
        and(
          eq(schema.participants.invitationId, q.invitationId),
          eq(schema.participants.isHidden, false),
          q.before ? lt(schema.participants.createdAt, q.before) : undefined,
        ),
      )
      .orderBy(desc(schema.participants.createdAt))
      .limit(q.limit);
  }

  /** 사진 업로드 이벤트 */
  async findPhotoUploads(q: SourceQuery) {
    return this.db
      .select({
        id:              schema.photos.id,
        occurredAt:      schema.photos.createdAt,
        thumbnailKey:    schema.photos.thumbnailKey,
        actorUserId:     schema.users.id,
        name:            schema.users.name,
        nickname:        schema.users.nickname,
        profileImageUrl: schema.users.profileImageUrl,
      })
      .from(schema.photos)
      .innerJoin(schema.participants, eq(schema.photos.participantId, schema.participants.id))
      .innerJoin(schema.users, eq(schema.participants.userId, schema.users.id))
      .where(
        and(
          eq(schema.photos.invitationId, q.invitationId),
          isNull(schema.photos.deletedAt),
          isNull(schema.photos.hiddenAt),
          q.before ? lt(schema.photos.createdAt, q.before) : undefined,
        ),
      )
      .orderBy(desc(schema.photos.createdAt))
      .limit(q.limit);
  }

  /** 댓글 작성 이벤트 (초대장 소속 참가자의 피드백) */
  async findComments(q: SourceQuery) {
    return this.db
      .select({
        id:              schema.feedbacks.id,
        occurredAt:      schema.feedbacks.createdAt,
        content:         schema.feedbacks.content,
        photoId:         schema.feedbacks.photoId,
        actorUserId:     schema.users.id,
        name:            schema.users.name,
        nickname:        schema.users.nickname,
        profileImageUrl: schema.users.profileImageUrl,
      })
      .from(schema.feedbacks)
      .innerJoin(schema.participants, eq(schema.feedbacks.participantId, schema.participants.id))
      .innerJoin(schema.users, eq(schema.participants.userId, schema.users.id))
      .where(
        and(
          eq(schema.participants.invitationId, q.invitationId),
          isNull(schema.feedbacks.deletedAt),
          isNull(schema.feedbacks.hiddenAt),
          q.before ? lt(schema.feedbacks.createdAt, q.before) : undefined,
        ),
      )
      .orderBy(desc(schema.feedbacks.createdAt))
      .limit(q.limit);
  }

  /** 투표 확정 이벤트 */
  async findVoteConfirmations(q: SourceQuery) {
    return this.db
      .select({
        id:         schema.dateVotePolls.id,
        occurredAt: schema.dateVotePolls.updatedAt,
        title:      schema.dateVotePolls.title,
        voteType:   schema.dateVotePolls.voteType,
      })
      .from(schema.dateVotePolls)
      .where(
        and(
          eq(schema.dateVotePolls.invitationId, q.invitationId),
          eq(schema.dateVotePolls.status, 'confirmed'),
          isNull(schema.dateVotePolls.deletedAt),
          q.before ? lt(schema.dateVotePolls.updatedAt, q.before) : undefined,
        ),
      )
      .orderBy(desc(schema.dateVotePolls.updatedAt))
      .limit(q.limit);
  }
}
