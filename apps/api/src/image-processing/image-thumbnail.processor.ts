import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { ModuleRef } from '@nestjs/core';
import { Job } from 'bullmq';
import { ulid } from 'ulid';
import { PhotosRepository } from '../photos/photos.repository';
import { InvitationsRepository } from '../invitations/invitations.repository';
import { UsersRepository } from '../users/users.repository';
import { ImageProcessingJobsRepository } from './image-processing-jobs.repository';
import { ImageProcessingService } from './image-processing.service';
import {
  IMAGE_PROCESSING_JOB,
  IMAGE_PROCESSING_QUEUE,
} from '../queues/queue.constants';
import type { ImageJobTargetType } from '../database/schema';

interface ThumbnailJobData {
  jobId: string;
}

// 단일 워커가 모든 도메인의 섬네일 생성을 처리. 도메인 repository는 ModuleRef로 lazy resolve하여
// image-processing 모듈이 photos/invitations/users 모듈을 직접 import하지 않도록 한다.
@Processor(IMAGE_PROCESSING_QUEUE)
export class ImageThumbnailProcessor extends WorkerHost {
  private readonly logger = new Logger(ImageThumbnailProcessor.name);

  constructor(
    private readonly imageProcessing: ImageProcessingService,
    private readonly imageJobs: ImageProcessingJobsRepository,
    private readonly moduleRef: ModuleRef,
  ) {
    super();
  }

  async process(job: Job<ThumbnailJobData>): Promise<void> {
    if (job.name !== IMAGE_PROCESSING_JOB.GENERATE_THUMBNAIL) return;

    const { jobId } = job.data;
    const record = await this.imageJobs.findById(jobId);
    if (!record) {
      this.logger.warn(`image_processing_job ${jobId} not found, skip`);
      return;
    }

    await this.imageJobs.updateStatus(jobId, 'processing', {
      attempts: job.attemptsMade + 1,
    });

    try {
      const thumbnailKey = buildThumbnailKey(record.sourceKey);
      await this.imageProcessing.generateThumbnail(record.sourceKey, thumbnailKey);
      await this.applyToDomain(record.targetType as ImageJobTargetType, record.targetId, thumbnailKey);
      await this.imageJobs.updateStatus(jobId, 'completed', { thumbnailKey });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown';
      this.logger.error(`thumbnail job ${jobId} failed: ${message}`);
      const isFinalAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);
      if (isFinalAttempt) {
        await this.imageJobs.updateStatus(jobId, 'failed', { errorCode: 'THUMBNAIL_FAILED' });
      }
      throw err;
    }
  }

  private async applyToDomain(
    targetType: ImageJobTargetType,
    targetId: string,
    thumbnailKey: string,
  ): Promise<void> {
    switch (targetType) {
      case 'photo': {
        const repo = this.moduleRef.get(PhotosRepository, { strict: false });
        await repo.updateThumbnailKey(targetId, thumbnailKey);
        return;
      }
      case 'invitation_main': {
        const repo = this.moduleRef.get(InvitationsRepository, { strict: false });
        await repo.updateMainImageThumbnailKey(targetId, thumbnailKey);
        return;
      }
      case 'user_profile': {
        const repo = this.moduleRef.get(UsersRepository, { strict: false });
        await repo.updateProfileImageThumbnailKey(targetId, thumbnailKey);
        return;
      }
    }
  }
}

// 원본과 같은 prefix 아래에 thumb 폴더로 분리. 파일명은 ulid + .jpg.
function buildThumbnailKey(sourceKey: string): string {
  const lastSlash = sourceKey.lastIndexOf('/');
  const prefix = lastSlash >= 0 ? sourceKey.slice(0, lastSlash) : '';
  return `${prefix}/thumb/${ulid()}.jpg`;
}
