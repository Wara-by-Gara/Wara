import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { S3Module } from '../s3/s3.module';
import { IMAGE_PROCESSING_QUEUE } from '../queues/queue.constants';
import { ImageProcessingJobsRepository } from './image-processing-jobs.repository';
import { ImageProcessingService } from './image-processing.service';
import { ImageThumbnailProcessor } from './image-thumbnail.processor';

@Global()
@Module({
  imports: [S3Module, BullModule.registerQueue({ name: IMAGE_PROCESSING_QUEUE })],
  providers: [ImageProcessingService, ImageProcessingJobsRepository, ImageThumbnailProcessor],
  exports: [ImageProcessingService, ImageProcessingJobsRepository],
})
export class ImageProcessingModule {}
