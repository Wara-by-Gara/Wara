import { Module } from '@nestjs/common';
import { PhotosController } from './photos.controller';
import { PhotosService } from './photos.service';
import { PhotosRepository } from './photos.repository';

@Module({
  controllers: [PhotosController],
  providers: [PhotosService, PhotosRepository],
})
export class PhotosModule {}
