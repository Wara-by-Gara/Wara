import { Injectable, Inject } from '@nestjs/common';
import { and, eq, isNull, desc } from 'drizzle-orm';
import { DRIZZLE, DrizzleDB } from '../database/database.module';
import * as schema from '../database/schema';
import type { NewContentReport } from '../database/schema';

type TargetType = 'photo' | 'feedback';

@Injectable()
export class ReportsRepository {
  constructor(@Inject(DRIZZLE) private db: DrizzleDB) {}

  /** 신고 생성. 동일 사용자·대상 활성 신고가 있으면 onConflict로 null 반환. */
  async create(data: Pick<NewContentReport, 'reporterUserId' | 'targetType' | 'targetId' | 'invitationId' | 'reason'>) {
    const [row] = await this.db
      .insert(schema.contentReports)
      .values(data)
      .onConflictDoNothing()
      .returning();
    return row ?? null;
  }

  async findById(id: string) {
    const [row] = await this.db
      .select()
      .from(schema.contentReports)
      .where(and(eq(schema.contentReports.id, id), isNull(schema.contentReports.deletedAt)))
      .limit(1);
    return row ?? null;
  }

  async list(status: 'pending' | 'reviewing' | 'resolved' | 'dismissed' | undefined, limit: number) {
    return this.db
      .select()
      .from(schema.contentReports)
      .where(
        and(
          isNull(schema.contentReports.deletedAt),
          status ? eq(schema.contentReports.status, status) : undefined,
        ),
      )
      .orderBy(desc(schema.contentReports.createdAt))
      .limit(limit);
  }

  async update(
    id: string,
    data: Partial<Pick<schema.ContentReport, 'status' | 'adminMemo' | 'handledByUserId'>>,
  ) {
    const [row] = await this.db
      .update(schema.contentReports)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.contentReports.id, id))
      .returning();
    return row!;
  }

  /** 신고 대상이 실재하는지 확인하고 소속 invitationId를 반환. */
  async findTarget(targetType: TargetType, targetId: string): Promise<{ invitationId: string | null } | null> {
    if (targetType === 'photo') {
      const [row] = await this.db
        .select({ invitationId: schema.photos.invitationId })
        .from(schema.photos)
        .where(and(eq(schema.photos.id, targetId), isNull(schema.photos.deletedAt)))
        .limit(1);
      return row ?? null;
    }
    const [row] = await this.db
      .select({ invitationId: schema.feedbacks.invitationId })
      .from(schema.feedbacks)
      .where(and(eq(schema.feedbacks.id, targetId), isNull(schema.feedbacks.deletedAt)))
      .limit(1);
    return row ?? null;
  }

  /** 대상 콘텐츠 숨김/복원 (hiddenAt 세팅/해제). */
  async setHidden(targetType: TargetType, targetId: string, hidden: boolean) {
    const hiddenAt = hidden ? new Date() : null;
    if (targetType === 'photo') {
      await this.db
        .update(schema.photos)
        .set({ hiddenAt, updatedAt: new Date() })
        .where(eq(schema.photos.id, targetId));
    } else {
      await this.db
        .update(schema.feedbacks)
        .set({ hiddenAt, updatedAt: new Date() })
        .where(eq(schema.feedbacks.id, targetId));
    }
  }
}
