import { Module } from '@nestjs/common';
import { PhotosController } from './photos.controller';
import { PhotoMapController } from './photo-map.controller';
import { PhotosService } from './photos.service';
import { PhotosRepository } from './photos.repository';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [PhotosController, PhotoMapController],
  providers: [PhotosService, PhotosRepository],
})
export class PhotosModule {}
