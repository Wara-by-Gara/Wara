import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE, DrizzleDB } from '../database/database.module';
import { and, asc, desc, eq,  inArray, isNull,  sql } from 'drizzle-orm';
import { ListPhotosDto } from './dto/list-photos.dto';
import {
  NewPhoto,
  participants,
  photoLikes,
  photos,
} from '../database/schema';

@Injectable()
export class PhotosRepository {
  constructor(@Inject(DRIZZLE) private db: DrizzleDB) {}

  //JWT userId -> participantId 변환
  //근데 로그인하면 JWT에는 userId만 있음
  //이 userId가 이 초대장에서 어떤 participantId인지" 찾아야 함
  async findParticipantId(userId: string, invitationId: string) {
    const [row] = await this.db
      .select({ id: participants.id })
      .from(participants)
      .where(
        and(
          eq(participants.userId, userId),
          eq(participants.invitationId, invitationId),
        ),
      );
    return row?.id ?? null;
  }

  //커서 형식으로 모든 사진 가져옴(초대장 사진 목록 무한스크롤용 DB 쿼리)
  async findAllByInvitationId(invitationId: string, dto: ListPhotosDto, participantId?: string) {
    const { cursor, limit, sort, order } = dto;
    const sortCol = sort === 'takenAt' ? photos.takenAt : photos.createdAt;
    const orderFn = order === 'asc' ? asc : desc;

    const conditions = [
      eq(photos.invitationId, invitationId),
      isNull(photos.deletedAt),
    ];

    const [countRow] = await this.db
      .select({ total: sql<number>`count(*)::int` })
      .from(photos)
      .where(and(...conditions));

    const total = countRow?.total ?? 0;

    const attachLiked = async <T extends { id: string }>(rows: T[]) => {
      if (!participantId || rows.length === 0) return rows as (T & { liked?: boolean })[];
      const photoIds = rows.map((p) => p.id);
      const likes = await this.db
        .select({ photoId: photoLikes.photoId })
        .from(photoLikes)
        .where(and(inArray(photoLikes.photoId, photoIds), eq(photoLikes.participantId, participantId)));
      const likedSet = new Set(likes.map((l) => l.photoId));
      return rows.map((p) => ({ ...p, liked: likedSet.has(p.id) }));
    };

    if (cursor) {
      // offset 방식으로 cursor 이후 데이터 가져오기
      const cursorIndex = await this.db
        .select({ id: photos.id })
        .from(photos)
        .where(and(eq(photos.invitationId, invitationId), isNull(photos.deletedAt)))
        .orderBy(orderFn(sortCol))
        .then((rows) => rows.findIndex((r) => r.id === cursor));

      if (cursorIndex !== -1) {
        const rows = await this.db
          .select()
          .from(photos)
          .where(and(...conditions))
          .orderBy(orderFn(sortCol))
          .offset(cursorIndex + 1)
          .limit(limit + 1);

        const hasNext = rows.length > limit;
        return {
          rows: await attachLiked(rows.slice(0, limit)),
          nextCursor: hasNext ? (rows[limit - 1]?.id ?? null) : null,
          total,
        };
      }
    }

    const rows = await this.db
      .select()
      .from(photos)
      .where(and(...conditions))
      .orderBy(orderFn(sortCol))
      .limit(limit + 1);

    const hasNext = rows.length > limit;
    return {
      rows: await attachLiked(rows.slice(0, limit)),
      nextCursor: hasNext ? (rows[limit - 1]?.id ?? null) : null,
      total,
    };
  }

  //다운로드용(낱개, 지정, 전체)
  async findPhotosByIds(ids: string[], invitationId: string) {
    const rows = await this.db
      .select()
      .from(photos)
      .where(
        and(
          inArray(photos.id, ids),
          eq(photos.invitationId, invitationId),
          isNull(photos.deletedAt),
        ),
      );
    return rows;
  }

  //특정 id의 사진 단건 조회 (삭제된 사진은 제외)
  async findPhotoById(id: string, invitationId: string) {
    const [row] = await this.db
      .select()
      .from(photos)
      .where(
        and(
          eq(photos.id, id),
          eq(photos.invitationId, invitationId),
          isNull(photos.deletedAt),
        ),
      );
    return row ?? null;
  }

  //db에 저장 (s3업로드 아님)
  async create(data: NewPhoto) {
    const [row] = await this.db.insert(photos).values(data).returning();
    return row;
  }

  //사진 조회수 올리기
  async incrementViewCount(id: string) {
    await this.db
      .update(photos)
      .set({ viewCount: sql`${photos.viewCount}+1` })
      .where(eq(photos.id, id));
  }

  //사진 삭제 (소프트 딜리트))
  async softDelete(id: string): Promise<boolean> {
    const result = await this.db
      .update(photos)
      .set({ deletedAt: new Date() })
      .where(and(eq(photos.id, id), isNull(photos.deletedAt)))
      .returning({ id: photos.id });

    return result.length > 0;
  }

  //좋아요 존재 여부 조회 (내가 눌렀는지 안눌렀는지)
  async findLike(photoId: string, participantId: string) {
    const [row] = await this.db
      .select()
      .from(photoLikes)
      .where(
        and(
          eq(photoLikes.photoId, photoId),
          eq(photoLikes.participantId, participantId),
        ),
      );
    return row ?? null;
  }

  //좋아요 up
  async createLike(photoId: string, participantId: string) {
    await this.db.transaction(async (tx) => {
      await tx.insert(photoLikes).values({ photoId, participantId });
      await tx
        .update(photos)
        .set({ likeCount: sql`${photos.likeCount}+1` })
        .where(eq(photos.id, photoId));
    });
  }

  //좋아요 취소(삭제)
  async deleteLike(photoId: string, participantId: string) {
    await this.db.transaction(async (tx) => {
      await tx
        .delete(photoLikes)
        .where(
          and(
            eq(photoLikes.photoId, photoId),
            eq(photoLikes.participantId, participantId),
          ),
        );
      await tx
        .update(photos)
        //likeCount가 -1된 값을 주거나, 0을 반환 (count가 0보다 이하는 되지 않게)
        .set({ likeCount: sql`GREATEST(${photos.likeCount} - 1, 0)` })
        .where(eq(photos.id, photoId));
    });
  }

  //리마인드 앨범
  //viewCount(1회 : 0.5) + likeCount (1회 : 1.0) + feedbackCount(1댓글 : 1.5) = best9에 들어갈수 있음.
  async findBest9(invitationId: string) {
    return this.db
      .select()
      .from(photos)
      .where(
        and(eq(photos.invitationId, invitationId), isNull(photos.deletedAt)),
      )
      .orderBy(
        desc(
          sql`${photos.viewCount} * 0.5 + ${photos.likeCount} * 1.0 + ${photos.feedbackCount} * 1.5`,
        ),
      )
      .limit(9);
  }
}
