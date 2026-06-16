import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE, DrizzleDB } from '../database/database.module';
import { and, asc, desc, eq, inArray, isNull, isNotNull, sql } from 'drizzle-orm';
import { ListPhotosDto } from './dto/list-photos.dto';
import {
  NewPhoto,
  participants,
  photoLikes,
  photos,
  users,
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

  // 사진 업로드 알림 fan-out 대상 — 업로더(excludeParticipantId) 제외한 참여자 userId 목록
  async findParticipantUserIds(invitationId: string, excludeParticipantId: string): Promise<string[]> {
    const rows = await this.db
      .select({ userId: participants.userId })
      .from(participants)
      .innerJoin(users, eq(participants.userId, users.id))
      .where(
        and(
          eq(participants.invitationId, invitationId),
          isNull(users.deletedAt),
          sql`${participants.id} <> ${excludeParticipantId}`,
        ),
      );
    return rows.map((r) => r.userId);
  }

  async findNicknameByParticipantId(participantId: string): Promise<string | null> {
    const [row] = await this.db
      .select({ name: users.name })
      .from(participants)
      .innerJoin(users, eq(participants.userId, users.id))
      .where(eq(participants.id, participantId))
      .limit(1);
    return row?.name ?? null;
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
        // nextCursor = 다음 페이지 첫 row 의 id. cursor 포함(inclusive)으로 fetch해 다음 호출에서 cursor가 응답 첫 항목으로 재등장.
        const rows = await this.db
          .select()
          .from(photos)
          .where(and(...conditions))
          .orderBy(orderFn(sortCol))
          .offset(cursorIndex)
          .limit(limit + 1);

        const hasNext = rows.length > limit;
        return {
          rows: await attachLiked(rows.slice(0, limit)),
          nextCursor: hasNext ? (rows[limit]?.id ?? null) : null,
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
      nextCursor: hasNext ? (rows[limit]?.id ?? null) : null,
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

  //워커가 섬네일 업로드 후 호출
  async updateThumbnailKey(id: string, thumbnailKey: string): Promise<void> {
    await this.db
      .update(photos)
      .set({ thumbnailKey, updatedAt: new Date() })
      .where(eq(photos.id, id));
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

  //좋아요 up (멱등): 이미 있으면 ON CONFLICT로 무시하고 카운트 증가도 건너뜀.
  // 동시/중복 토글에도 likeCount가 정확하고 unique 위반 500이 발생하지 않는다.
  async createLike(photoId: string, participantId: string): Promise<number> {
    return this.db.transaction(async (tx) => {
      const inserted = await tx
        .insert(photoLikes)
        .values({ photoId, participantId })
        .onConflictDoNothing()
        .returning({ photoId: photoLikes.photoId });
      if (inserted.length === 0) {
        const [row] = await tx
          .select({ likeCount: photos.likeCount })
          .from(photos)
          .where(eq(photos.id, photoId));
        return row?.likeCount ?? 0;
      }
      const [updated] = await tx
        .update(photos)
        .set({ likeCount: sql`${photos.likeCount}+1` })
        .where(eq(photos.id, photoId))
        .returning({ likeCount: photos.likeCount });
      return updated!.likeCount;
    });
  }

  //좋아요 취소(삭제, 멱등): 실제로 삭제된 행이 있을 때만 카운트 감소.
  async deleteLike(photoId: string, participantId: string): Promise<number> {
    return this.db.transaction(async (tx) => {
      const deleted = await tx
        .delete(photoLikes)
        .where(
          and(
            eq(photoLikes.photoId, photoId),
            eq(photoLikes.participantId, participantId),
          ),
        )
        .returning({ photoId: photoLikes.photoId });
      if (deleted.length === 0) {
        const [row] = await tx
          .select({ likeCount: photos.likeCount })
          .from(photos)
          .where(eq(photos.id, photoId));
        return row?.likeCount ?? 0;
      }
      const [updated] = await tx
        .update(photos)
        //likeCount가 -1된 값을 주거나, 0을 반환 (count가 0보다 이하는 되지 않게)
        .set({ likeCount: sql`GREATEST(${photos.likeCount} - 1, 0)` })
        .where(eq(photos.id, photoId))
        .returning({ likeCount: photos.likeCount });
      return updated!.likeCount;
    });
  }

  // 유저가 참여한 모든 초대장에서 GPS 정보가 있는 사진 조회 (지도 핀용)
  async findAllWithGpsByUserId(userId: string) {
    return this.db
      .select({
        id: photos.id,
        participantId: photos.participantId,
        invitationId: photos.invitationId,
        imageKey: photos.imageKey,
        likeCount: photos.likeCount,
        feedbackCount: photos.feedbackCount,
        createdAt: photos.createdAt,
        takenAt: photos.takenAt,
        exifMetadata: photos.exifMetadata,
      })
      .from(photos)
      .innerJoin(participants, eq(photos.participantId, participants.id))
      .where(
        and(
          eq(participants.userId, userId),
          isNull(photos.deletedAt),
          isNotNull(photos.exifMetadata),
          sql`${photos.exifMetadata}->>'gps_lat' IS NOT NULL`,
          sql`${photos.exifMetadata}->>'gps_lng' IS NOT NULL`,
        ),
      )
      .orderBy(desc(photos.createdAt));
  }

  // exif fingerprint로 중복 사진 조회
  async findByFingerprint(invitationId: string, fingerprint: string) {
    const [row] = await this.db
      .select({ id: photos.id })
      .from(photos)
      .where(
        and(
          eq(photos.invitationId, invitationId),
          eq(photos.exifFingerprint, fingerprint),
          isNull(photos.deletedAt),
        ),
      )
      .limit(1);
    return row ?? null;
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
