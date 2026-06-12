import { Injectable, Inject } from '@nestjs/common';
import { and, count, eq, gte } from 'drizzle-orm';
import { ulid } from 'ulid';
import { DRIZZLE, DrizzleDB } from '../database/database.module';
import { aiGenerations } from '../database/schema';
import type { AiGenerationStatus } from '../database/schema';

@Injectable()
export class AiGenerationsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async create(data: {
    userId: string;
    templateId: string;
    sourceImageKey: string;
  }) {
    const [row] = await this.db
      .insert(aiGenerations)
      .values({ id: ulid(), ...data })
      .returning();
    if (!row) throw new Error('AI generation 생성 실패');
    return row;
  }

  findById(id: string) {
    return this.db.query.aiGenerations.findFirst({
      where: (t, { eq }) => eq(t.id, id),
    });
  }

  async updateStatus(
    id: string,
    status: AiGenerationStatus,
    extra?: { resultImageKey?: string; errorCode?: string },
  ) {
    await this.db
      .update(aiGenerations)
      .set({
        status,
        updatedAt: new Date(),
        ...(status === 'completed' || status === 'failed'
          ? { completedAt: new Date() }
          : {}),
        ...(extra?.resultImageKey !== undefined
          ? { resultImageKey: extra.resultImageKey }
          : {}),
        ...(extra?.errorCode !== undefined ? { errorCode: extra.errorCode } : {}),
      })
      .where(eq(aiGenerations.id, id));
  }

  // 오늘(UTC 자정 기준) 해당 유저의 generation 수. failed 포함 (남용 방지).
  // 한도(AI_DAILY_LIMIT=3)는 ai_image_jobs와 공유하므로 service에서 두 카운트 합산.
  async countTodayByUser(userId: string): Promise<number> {
    const todayUtcMidnight = new Date();
    todayUtcMidnight.setUTCHours(0, 0, 0, 0);

    const [row] = await this.db
      .select({ cnt: count() })
      .from(aiGenerations)
      .where(
        and(
          eq(aiGenerations.userId, userId),
          gte(aiGenerations.createdAt, todayUtcMidnight),
        ),
      );
    return row?.cnt ?? 0;
  }
}
