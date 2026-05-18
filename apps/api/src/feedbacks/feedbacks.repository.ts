import { and, eq, isNotNull, sql } from 'drizzle-orm';
import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE, DrizzleDB } from '../database/database.module';
import { feedbackLikes, feedbacks, NewFeedback } from '../../drizzle/schema';

@Injectable()
export class FeedbacksRepository {
  constructor(@Inject(DRIZZLE) private db: DrizzleDB) {}

  //초대장 피드백 목록 조회
  async findManyByInvitation(invitationId: string) {
    return this.db.query.feedbacks.findMany({
      where: (t, { eq, and, isNull }) =>
        and(
          eq(t.invitationId, invitationId),
          isNull(t.photoId),
          isNull(t.parentId),
        ),
      with: {
        participant: true,
        replies: {
          where: (t, { isNull }) => isNull(t.deletedAt),
          with: { participant: true },
          orderBy: (t, { asc }) => [asc(t.createdAt)],
        },
      },
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });
  }

  //초대장의 모든 사진 댓글 목록 조회(초대장댓글 +사진댓글 일체화용)
  async findPhotoFeedbacksByInvitation(invitationId: string) {
    return this.db.query.feedbacks.findMany({
      where: (t, { eq, and, isNull }) =>
        and(
          eq(t.invitationId, invitationId),
          isNotNull(t.photoId),
          isNull(t.parentId),
        ),
      with: {
        participant: true,
        photo: true,
        replies: {
          with: { participant: true },
          orderBy: (t, { asc }) => [asc(t.createdAt)],
        },
      },
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });
  }

  //사진 댓글 목록 조회
  async findManyByPhoto(photoId: string) {
    return this.db.query.feedbacks.findMany({
      where: (t, { eq, and, isNull }) =>
        and(eq(t.photoId, photoId), isNull(t.parentId)),
      with: {
        participant: true,
        replies: {
          with: { participant: true },
          orderBy: (t, { asc }) => [asc(t.createdAt)],
        },
      },
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });
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
    const [result] = await this.db.insert(feedbacks).values(data).returning();
    return result;
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
    await this.db
      .update(feedbacks)
      .set({ deletedAt: new Date() })
      .where(eq(feedbacks.id, id));
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
