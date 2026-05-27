import { Injectable, Inject } from '@nestjs/common';
import { and, count, eq, gte } from 'drizzle-orm';
import { DRIZZLE, DrizzleDB } from '../database/database.module';
import { aiImageJobs } from '../database/schema';
import type { AiJobStatus } from '../database/schema';
import { ulid } from 'ulid';

@Injectable()
export class AiImageJobsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async create(data: {
    userId: string;
    invitationId: string;
    uploadedImageKey: string;
  }) {
    const [job] = await this.db
      .insert(aiImageJobs)
      .values({ id: ulid(), ...data })
      .returning();
    if (!job) throw new Error('AI 잡 생성 실패');
    return job;
  }

  findById(id: string) {
    return this.db.query.aiImageJobs.findFirst({
      where: (t, { eq }) => eq(t.id, id),
    });
  }

  async updateStatus(
    id: string,
    status: AiJobStatus,
    extra?: { resultKey?: string; errorCode?: string },
  ) {
    await this.db
      .update(aiImageJobs)
      .set({
        status,
        updatedAt: new Date(),
        ...(status === 'completed' || status === 'failed'
          ? { completedAt: new Date() }
          : {}),
        ...(extra?.resultKey !== undefined ? { resultKey: extra.resultKey } : {}),
        ...(extra?.errorCode !== undefined ? { errorCode: extra.errorCode } : {}),
      })
      .where(eq(aiImageJobs.id, id));
  }

  /**
   * 오늘(UTC 자정 기준) 해당 유저의 AI 잡 생성 수.
   * failed 포함하여 모든 시도를 카운트 (남용 방지).
   */
  async countTodayByUser(userId: string): Promise<number> {
    const todayUtcMidnight = new Date();
    todayUtcMidnight.setUTCHours(0, 0, 0, 0);

    const [row] = await this.db
      .select({ cnt: count() })
      .from(aiImageJobs)
      .where(
        and(
          eq(aiImageJobs.userId, userId),
          gte(aiImageJobs.createdAt, todayUtcMidnight),
        ),
      );
    return row?.cnt ?? 0;
  }
}
