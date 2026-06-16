import { and, eq, inArray, isNull, ne, or, SQL, sql } from 'drizzle-orm';
import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE, DrizzleDB } from '../database/database.module';
import {
  feedbackLikes,
  feedbacks,
  NewFeedback,
  participants,
  photos,
  users,
} from '../database/schema';
import { ListFeedbacksDto } from './dto/list-feedbacks.dto';

@Injectable()
export class FeedbacksRepository {
  constructor(@Inject(DRIZZLE) private db: DrizzleDB) {}

  //페이지네이션 헬퍼
  private paginate<T extends { id: string }>(rows: T[], limit: number) {
    const hasNext = rows.length > limit;
    const paged = hasNext ? rows.slice(0, limit) : rows;
    return {
      rows: paged,
      nextCursor: hasNext && paged.length > 0 ? (paged.at(-1)!.id) : null,
    };
  }

  // cursor 조건 + LIMIT — (created_at, id) 튜플 비교로 JS Date 바인딩 정밀도 이슈 방지
  private getCursorCondition(dto: ListFeedbacksDto) {
    const { cursor, limit } = dto;
    const LIMIT = limit ?? 10;
    const cursorConditions: SQL[] = [];

    if (cursor) {
      cursorConditions.push(
        sql`(${feedbacks.createdAt}, ${feedbacks.id}) < (
          SELECT ${feedbacks.createdAt}, ${feedbacks.id}
          FROM ${feedbacks}
          WHERE ${feedbacks.id} = ${cursor}
          LIMIT 1
        )`,
      );
    }
    return { LIMIT, cursorConditions };
  }

  //초대장댓글 + 사진 댓글 통합 목록
async findAllByInvitation(invitationId: string, dto: ListFeedbacksDto, participantId?: string) {
  const { LIMIT, cursorConditions } = this.getCursorCondition(dto);

  const photoIds = await this.db
    .select({ id: photos.id })
    .from(photos)
    .where(eq(photos.invitationId, invitationId))
    .then((rows) => rows.map((r) => r.id));

  const baseConditions = [
    or(
      eq(feedbacks.invitationId, invitationId),
      photoIds.length > 0 ? inArray(feedbacks.photoId, photoIds) : sql`false`,
    ),
    isNull(feedbacks.parentId),
    isNull(feedbacks.deletedAt),
  ];

  const [countRow] = await this.db
    .select({ total: sql<number>`count(*)::int` })
    .from(feedbacks)
    .where(and(...baseConditions));

  const total = countRow?.total ?? 0;

  const conditions = [...baseConditions, ...cursorConditions];

  const rawRows = await this.db.query.feedbacks.findMany({
    where: and(...conditions),
    with: {
      participant: {
        with: {
          user: {
            columns: {
              name: true,
              nickname: true,
              profileImageUrl: true,
              deletedAt: true,
            },
          },
        },
      },
      photo: true,
      attachedPhoto: true,
      replies: {
        with: {
          participant: {
            with: {
              user: {
                columns: {
                  name: true,
                  nickname: true,
                  profileImageUrl: true,
                },
              },
            },
          },
          attachedPhoto: true,
        },
        orderBy: (t, { asc }) => [asc(t.createdAt)],
      },
    },
    orderBy: (t, { desc }) => [desc(t.createdAt), desc(t.id)],
    limit: LIMIT + 1,
  });

  const { rows: paged, nextCursor } = this.paginate(rawRows, LIMIT);
  if (!participantId || paged.length === 0) return { rows: paged, nextCursor, total };

  const allIds = paged.flatMap(r => [r.id, ...r.replies.map(rep => rep.id)]);
  const likes = await this.db
    .select({ feedbackId: feedbackLikes.feedbackId })
    .from(feedbackLikes)
    .where(and(inArray(feedbackLikes.feedbackId, allIds), eq(feedbackLikes.participantId, participantId)));
  const likedSet = new Set(likes.map(l => l.feedbackId));

  const rows = paged.map(r => ({
    ...r,
    likedByMe: likedSet.has(r.id),
    replies: r.replies.map(rep => ({ ...rep, likedByMe: likedSet.has(rep.id) })),
  }));
  return { rows, nextCursor, total };
}

  //사진 댓글 목록
  async findAllByPhoto(photoId: string, dto: ListFeedbacksDto, participantId?: string) {
    const { LIMIT, cursorConditions } = this.getCursorCondition(dto);

    const conditions = [
      or(
        eq(feedbacks.photoId, photoId),
        eq(feedbacks.attachedPhotoId, photoId),
      ) as SQL,
      isNull(feedbacks.parentId),
      ...cursorConditions,
    ];

    const rawRows = await this.db.query.feedbacks.findMany({
      where: and(...conditions),
      with: {
        participant: {
          with: {
            user: {
              columns: {
                name: true,
                nickname: true,
                profileImageUrl: true,
              },
            },
          },
        },
        photo: true,
        attachedPhoto: true,
        replies: {
          with: {
            participant: {
              with: {
                user: {
                  columns: {
                    name: true,
                    nickname: true,
                    profileImageUrl: true,
                  },
                },
              },
            },
            attachedPhoto: true,
          },
          orderBy: (t, { asc }) => [asc(t.createdAt)],
        },
      },
      orderBy: (t, { desc }) => [desc(t.createdAt), desc(t.id)],
      limit: LIMIT + 1,
    });

    const { rows: paged, nextCursor } = this.paginate(rawRows, LIMIT);
    if (!participantId || paged.length === 0) return { rows: paged, nextCursor };

    const allIds = paged.flatMap(r => [r.id, ...r.replies.map(rep => rep.id)]);
    const likes = await this.db
      .select({ feedbackId: feedbackLikes.feedbackId })
      .from(feedbackLikes)
      .where(and(inArray(feedbackLikes.feedbackId, allIds), eq(feedbackLikes.participantId, participantId)));
    const likedSet = new Set(likes.map(l => l.feedbackId));

    const rows = paged.map(r => ({
      ...r,
      likedByMe: likedSet.has(r.id),
      replies: r.replies.map(rep => ({ ...rep, likedByMe: likedSet.has(rep.id) })),
    }));
    return { rows, nextCursor };
  }

  //댓글 단건 조회
  async findById(id: string) {
    return this.db.query.feedbacks.findFirst({
      where: (t, { eq, isNull, and }) => and(eq(t.id, id), isNull(t.deletedAt)),
      with: { participant: true },
    });
  }

  //참여자 인지 확인용
  async findParticipant(userId: string, invitationId: string) {
    return this.db.query.participants.findFirst({
      where: (t, { eq, and }) =>
        and(eq(t.userId, userId), eq(t.invitationId, invitationId)),
    });
  }

  //사진 댓글 단건 조회
  async findPhotoById(photoId: string) {
    return this.db.query.photos.findFirst({
      where: (t, { eq, and, isNull }) =>
        and(eq(t.id, photoId), isNull(t.deletedAt)),
    });
  }

  //댓글 알림 fan-out 대상 — 작성자(excludeUserId) 제외한 참여자 userId 목록
  async findParticipantUserIds(invitationId: string, excludeUserId: string): Promise<string[]> {
    const rows = await this.db
      .select({ userId: participants.userId })
      .from(participants)
      .innerJoin(users, eq(participants.userId, users.id))
      .where(
        and(
          eq(participants.invitationId, invitationId),
          isNull(users.deletedAt),
          ne(participants.userId, excludeUserId),
        ),
      );
    return rows.map((r) => r.userId);
  }

  //닉네임 조회 (멘션 알림용)
  async findUserNickname(userId: string): Promise<string | null> {
    const user = await this.db.query.users.findFirst({
      where: (t, { eq }) => eq(t.id, userId),
      columns: { name: true },
    });
    return user?.name ?? null;
  }

  //댓글 생성
  async create(
    data: Pick<
      NewFeedback,
      'participantId' | 'content' | 'invitationId' | 'photoId' | 'parentId' | 'attachedPhotoId' | 'gifUrl'
    >,
  ) {
    return await this.db.transaction(async (tx) => {
      const [result] = await tx.insert(feedbacks).values(data).returning();

      if (data.photoId && !data.parentId) {
        await tx
          .update(photos)
          .set({ feedbackCount: sql`feedback_count + 1` })
          .where(eq(photos.id, data.photoId));
      }

      return result;
    });
  }

  //댓글 수정
  async update(id: string, payload: { content?: string; gifUrl?: string }) {
    // 상호 배타: gifUrl 있으면 content null, content 있으면 gifUrl null
    const set = payload.gifUrl
      ? { gifUrl: payload.gifUrl, content: null as string | null, updatedAt: new Date() }
      : { content: payload.content!, gifUrl: null as string | null, updatedAt: new Date() };
    const [result] = await this.db
      .update(feedbacks)
      .set(set)
      .where(eq(feedbacks.id, id))
      .returning();
    return result;
  }

  //댓글 삭제 (소프트 딜리트)
  async softDelete(id: string) {
    await this.db.transaction(async (tx) => {
      const [deleted] = await tx
        .update(feedbacks)
        .set({ deletedAt: new Date() })
        .where(eq(feedbacks.id, id))
        .returning();

      if (deleted?.photoId && !deleted?.parentId) {
        await tx
          .update(photos)
          .set({ feedbackCount: sql`GREATEST(feedback_count - 1, 0)` })
          .where(eq(photos.id, deleted.photoId));
      }
    });
  }

  //댓글 좋아요 조회
  async findLike(feedbackId: string, participantId: string) {
    return this.db.query.feedbackLikes.findFirst({
      where: (t, { eq, and }) =>
        and(eq(t.feedbackId, feedbackId), eq(t.participantId, participantId)),
    });
  }

  //댓글 좋아요 Up
  async createLike(feedbackId: string, participantId: string) {
    await this.db.transaction(async (tx) => {
      await tx.insert(feedbackLikes).values({ feedbackId, participantId });
      await tx
        .update(feedbacks)
        .set({ likeCount: sql`like_count + 1` })
        .where(eq(feedbacks.id, feedbackId));
    });
  }

  //좋아요 삭제
  async deleteLike(feedbackId: string, participantId: string) {
    await this.db.transaction(async (tx) => {
      await tx
        .delete(feedbackLikes)
        .where(
          and(
            eq(feedbackLikes.feedbackId, feedbackId),
            eq(feedbackLikes.participantId, participantId),
          ),
        );
      await tx
        .update(feedbacks)
        .set({ likeCount: sql`GREATEST(like_count -1, 0)` })
        .where(eq(feedbacks.id, feedbackId));
    });
  }
}
