import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE, DrizzleDB } from '../database/database.module';
import { and, asc, desc, eq, gt, inArray, isNull, lt, sql } from 'drizzle-orm';
import { ListPhotosDto } from './dto/list-photos.dto';
import { NewPhoto, participants, photoLikes, photos } from '../../drizzle/schema';

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
  async findAllByInvitationId(invitationId: string, dto: ListPhotosDto) {
    const { cursor, limit, sort, order } = dto;
    const sortCol = sort === 'takenAt' ? photos.takenAt : photos.createdAt;
    const orderFn = order === 'asc' ? asc : desc;
    const cursorOp = order === 'asc' ? gt : lt;

    //해당 초대장에 속한 사진 + 삭제되지않은것만
    const conditions = [
      eq(photos.invitationId, invitationId),
      isNull(photos.deletedAt),
    ];

    if (cursor) {
      //마지막으로 받은 photoId 기준
      const [cursorRow] = await this.db
        .select({ sortValue: sortCol })
        .from(photos)
        .where(eq(photos.id, cursor));
      if (cursorRow?.sortValue) {
        conditions.push(cursorOp(sortCol, cursorRow.sortValue));
      }
    }

    //사진 목록 조회 : 정렬 기준 적용 (takenAt 없는 사진은 맨 뒤로)
    const rows = await this.db
      .select()
      .from(photos)
      .where(and(...conditions))
      .orderBy(
        orderFn(sortCol),
        //takenAt null인 사진은 맨뒤로
        // "takenAt이 null인 사진을 맨 뒤로" 라는 정렬은 Drizzle 함수로 표현이 안되서 SQL로 직접 써야 함
        ...(sort === 'takenAt' ? [sql`(${photos.takenAt} IS NULL) ASC`] : []),
      )
      .limit(limit + 1); //다음페이지 확인용

    const hasNext = rows.length > limit;
    return {
      rows: rows.slice(0, limit),
      nextCursor: hasNext ? (rows[limit - 1]?.id ?? null) : null,
    };
  }

  //다운로드용(낱개, 지정, 전체)
  async findPhotosByIds(ids: string[]) {
    return this.db
      .select()
      .from(photos)
      .where(and(inArray(photos.id, ids), isNull(photos.deletedAt)));
  }

  //특정 id의 사진 단건 조회 (삭제된 사진은 제외)
  async findPhotoById(id: string) {
    const [row] = await this.db
      .select()
      .from(photos)
      .where(and(eq(photos.id, id), isNull(photos.deletedAt)));
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
  async softDelete(id: string) {
    const result = await this.db
      .update(photos)
      .set({ deletedAt: new Date() })
      .where(and(eq(photos.id, id), isNull(photos.deletedAt)))
      .returning({ id: photos.id });

    if (result.length === 0) {
      throw new Error('사진을 찾을 수 없거나 이미 삭제된 항목입니다.');
    }
    return result[0];
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
        .set({ likeCount: sql`GREATEST${photos.likeCount} -1,0` })
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
