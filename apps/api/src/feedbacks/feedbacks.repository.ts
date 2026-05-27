import { and, eq, inArray, isNull, lt, or, SQL, sql } from 'drizzle-orm';
import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE, DrizzleDB } from '../database/database.module';
import {
  feedbackLikes,
  feedbacks,
  NewFeedback,
  photos,
} from '../database/schema';
import { ListFeedbacksDto } from './dto/list-feedbacks.dto';

@Injectable()
export class FeedbacksRepository {
  constructor(@Inject(DRIZZLE) private db: DrizzleDB) {}

  //페이지네이션 헬퍼
  private paginate<T extends { id: string }>(rows: T[], limit: number) {
    const hasNext = rows.length > limit;
    return {
      rows: rows.slice(0, limit),
      nextCursor: hasNext ? (rows[limit - 1]?.id ?? null) : null,
    };
  }

  //cursor 조건 + LIMIT 계산 헬퍼
  private async getCursorCondition(dto: ListFeedbacksDto) {
    const { cursor, limit } = dto;
    const LIMIT = limit ?? 10;
    const cursorConditions: SQL[] = [];

    if (cursor) {
      const [cursorRow] = await this.db
        .select({ createdAt: feedbacks.createdAt, id: feedbacks.id })
        .from(feedbacks)
        .where(eq(feedbacks.id, cursor));
      if (cursorRow) {
        cursorConditions.push(
          or(
            lt(feedbacks.createdAt, cursorRow.createdAt),
            and(
              eq(feedbacks.createdAt, cursorRow.createdAt),
              lt(feedbacks.id, cursorRow.id),
            ),
          ) as SQL,
        );
      }
    }
    return { LIMIT, cursorConditions };
  }

  //초대장댓글 + 사진 댓글 통합 목록
async findAllByInvitation(invitationId: string, dto: ListFeedbacksDto) {
  const { LIMIT, cursorConditions } = await this.getCursorCondition(dto);

  const photoIds = await this.db
    .select({ id: photos.id })
    .from(photos)
    .where(eq(photos.invitationId, invitationId))
    .then((rows) => rows.map((r) => r.id));

  const conditions = [
    or(
      eq(feedbacks.invitationId, invitationId),
      photoIds.length > 0 ? inArray(feedbacks.photoId, photoIds) : sql`false`,
    ),
    isNull(feedbacks.parentId),
    ...cursorConditions,
  ];

  const rows = await this.db.query.feedbacks.findMany({
    where: and(...conditions),
    with: {
      participant: {
        with: {
          user: {
            columns: {
              nickname: true,
              profileImageUrl: true,
            },
          },
        },
      },
      photo: true,
      replies: {
        with: {
          participant: {
            with: {
              user: {
                columns: {
                  nickname: true,
                  profileImageUrl: true,
                },
              },
            },
          },
        },
        orderBy: (t, { asc }) => [asc(t.createdAt)],
      },
    },
    orderBy: (t, { desc }) => [desc(t.createdAt), desc(t.id)],
    limit: LIMIT + 1,
  });
  return this.paginate(rows, LIMIT);
}

  //사진 댓글 목록
  async findAllByPhoto(photoId: string, dto: ListFeedbacksDto) {
    const { LIMIT, cursorConditions } = await this.getCursorCondition(dto);

    const conditions = [
      eq(feedbacks.photoId, photoId),
      isNull(feedbacks.parentId),
      ...cursorConditions,
    ];

    const rows = await this.db.query.feedbacks.findMany({
      where: and(...conditions),
      with: {
        participant: {
          with: {
            user: {
              columns: {
                nickname: true,
                profileImageUrl: true,
              },
            },
          },
        },
        photo: true,
        replies: {
          with: {
            participant: {
              with: {
                user: {
                  columns: {
                    nickname: true,
                    profileImageUrl: true,
                  },
                },
              },
            },
          },
          orderBy: (t, { asc }) => [asc(t.createdAt)],
        },
      },
      orderBy: (t, { desc }) => [desc(t.createdAt), desc(t.id)],
      limit: LIMIT + 1,
    });
    return this.paginate(rows, LIMIT);
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

  //댓글 생성
  async create(
    data: Pick<
      NewFeedback,
      'participantId' | 'content' | 'invitationId' | 'photoId' | 'parentId'
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
  async update(id: string, content: string) {
    const [result] = await this.db
      .update(feedbacks)
      .set({ content, updatedAt: new Date() })
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
