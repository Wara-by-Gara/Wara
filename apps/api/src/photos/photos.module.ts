import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PhotosController } from './photos.controller';
import { PhotoMapController } from './photo-map.controller';
import { PhotosService } from './photos.service';
import { PhotosRepository } from './photos.repository';
import { PhotoThumbnailProcessor } from './photo-thumbnail.processor';
import { AuthModule } from '../auth/auth.module';
import { IMAGE_PROCESSING_QUEUE } from '../queues/queue.constants';

@Module({
  imports: [AuthModule, BullModule.registerQueue({ name: IMAGE_PROCESSING_QUEUE })],
  controllers: [PhotosController, PhotoMapController],
  providers: [PhotosService, PhotosRepository, PhotoThumbnailProcessor],
})
export class PhotosModule {}
