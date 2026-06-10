import { Global, Module } from '@nestjs/common';
import { S3Module } from '../s3/s3.module';
import { ImageProcessingJobsRepository } from './image-processing-jobs.repository';
import { ImageProcessingService } from './image-processing.service';

@Global()
@Module({
  imports: [S3Module],
  providers: [ImageProcessingService, ImageProcessingJobsRepository],
  exports: [ImageProcessingService, ImageProcessingJobsRepository],
})
export class ImageProcessingModule {}
