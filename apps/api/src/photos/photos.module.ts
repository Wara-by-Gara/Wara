import { Module } from '@nestjs/common';
import { PhotosController } from './photos.controller';
import { PhotosService } from './photos.service';
import { PhotosRepository } from './photos.repository';
import { S3Module } from '../s3/s3.module';

@Module({
  imports: [S3Module],
  controllers: [PhotosController],
  providers: [PhotosService, PhotosRepository],
})
export class PhotosModule {}
