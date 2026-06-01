import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/types/jwt-payload.type';
import { PhotosService } from './photos.service';

@UseGuards(JwtAuthGuard)
@Controller('photos')
export class PhotoMapController {
  constructor(private readonly photosService: PhotosService) {}

  @Get('locations')
  getPhotoLocations(@CurrentUser() user: JwtPayload) {
    return this.photosService.getPhotoLocations(user.id);
  }
}
