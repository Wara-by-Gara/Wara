import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE, DrizzleDB } from '../database/database.module';
import {
  imageProcessingJobs,
  ImageJobStatus,
  ImageJobTargetType,
} from '../database/schema';

@Injectable()
export class ImageProcessingJobsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async create(data: {
    targetType: ImageJobTargetType;
    targetId: string;
    sourceKey: string;
    mimeType: string;
    sizeBytes: number;
  }) {
    const [job] = await this.db.insert(imageProcessingJobs).values(data).returning();
    if (!job) throw new Error('image_processing_jobs 생성 실패');
    return job;
  }

  findById(id: string) {
    return this.db.query.imageProcessingJobs.findFirst({
      where: (t, { eq }) => eq(t.id, id),
    });
  }

  async updateStatus(
    id: string,
    status: ImageJobStatus,
    extra?: { thumbnailKey?: string; errorCode?: string; attempts?: number },
  ): Promise<void> {
    const completedAt =
      status === 'completed' || status === 'failed' ? new Date() : undefined;
    await this.db
      .update(imageProcessingJobs)
      .set({
        status,
        updatedAt: new Date(),
        ...(completedAt ? { completedAt } : {}),
        ...(extra?.thumbnailKey !== undefined ? { thumbnailKey: extra.thumbnailKey } : {}),
        ...(extra?.errorCode !== undefined ? { errorCode: extra.errorCode } : {}),
        ...(extra?.attempts !== undefined ? { attempts: extra.attempts } : {}),
      })
      .where(eq(imageProcessingJobs.id, id));
  }
}
