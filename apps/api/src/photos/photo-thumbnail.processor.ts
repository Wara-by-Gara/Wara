import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ulid } from 'ulid';
import { ImageProcessingService } from '../image-processing/image-processing.service';
import { ImageProcessingJobsRepository } from '../image-processing/image-processing-jobs.repository';
import {
  IMAGE_PROCESSING_JOB,
  IMAGE_PROCESSING_QUEUE,
} from '../queues/queue.constants';
import { PhotosRepository } from './photos.repository';

interface ThumbnailJobData {
  jobId: string;
}

@Processor(IMAGE_PROCESSING_QUEUE)
export class PhotoThumbnailProcessor extends WorkerHost {
  private readonly logger = new Logger(PhotoThumbnailProcessor.name);

  constructor(
    private readonly imageProcessing: ImageProcessingService,
    private readonly imageJobs: ImageProcessingJobsRepository,
    private readonly photosRepository: PhotosRepository,
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
    if (record.targetType !== 'photo') return; // 본 PR은 photo만 처리

    await this.imageJobs.updateStatus(jobId, 'processing', { attempts: job.attemptsMade + 1 });

    try {
      const thumbnailKey = buildThumbnailKey(record.sourceKey);
      await this.imageProcessing.generateThumbnail(record.sourceKey, thumbnailKey);
      await this.photosRepository.updateThumbnailKey(record.targetId, thumbnailKey);
      await this.imageJobs.updateStatus(jobId, 'completed', { thumbnailKey });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown';
      this.logger.error(`thumbnail job ${jobId} failed: ${message}`);
      const isFinalAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);
      if (isFinalAttempt) {
        await this.imageJobs.updateStatus(jobId, 'failed', { errorCode: 'THUMBNAIL_FAILED' });
      }
      throw err; // BullMQ가 retry 트리거
    }
  }
}

// 원본과 같은 prefix 아래에 thumb 폴더로 분리. 파일명은 ulid + .jpg.
function buildThumbnailKey(sourceKey: string): string {
  const lastSlash = sourceKey.lastIndexOf('/');
  const prefix = lastSlash >= 0 ? sourceKey.slice(0, lastSlash) : '';
  return `${prefix}/thumb/${ulid()}.jpg`;
}
