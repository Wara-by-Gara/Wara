import { Module } from '@nestjs/common';
import { PhotosController } from './photos.controller';
import { PhotoMapController } from './photo-map.controller';
import { PhotosService } from './photos.service';
import { PhotosRepository } from './photos.repository';
import { AuthModule } from '../auth/auth.module';
import { LocationsModule } from '../locations/locations.module';

@Module({
  imports: [AuthModule, LocationsModule],
  controllers: [PhotosController, PhotoMapController],
  providers: [PhotosService, PhotosRepository],
})
export class PhotosModule {}
