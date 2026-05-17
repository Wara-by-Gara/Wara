import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PhotosService } from './photos.service';

import { PresignedUrlDto, PresignedUrlSchema } from './dto/presigned-url.dto';

import { ListPhotosDto, ListPhotosSchema } from './dto/list-photos.dto';

import { UploadPhotoDto, UploadPhotoSchema } from './dto/upload-photo.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ParseUlidPipe } from '../common/pipes/parse-ulid.pipe';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/types/jwt-payload.type';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('invitations')
export class PhotosController {
  constructor(private readonly photosService: PhotosService) {}

  //url 발급용
  @Post(':invitationId/photos/presigned-url')
  generatePresignedUrl(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(PresignedUrlSchema)) dto: PresignedUrlDto,
  ) {
    return this.photosService.generatePresignedUrl(invitationId, user.id, dto);
  }

  //사진 목록 조회
  @Get(':invitationId/photos')
  listPhotos(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @CurrentUser() user: JwtPayload,
    @Query(new ZodValidationPipe(ListPhotosSchema)) dto: ListPhotosDto,
  ) {
    return this.photosService.listPhotos(invitationId, user.id, dto);
  }

  //사진 다운로드(선택,단일)
  @Get(':invitationId/photos/download')
  getDownloadUrls(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @CurrentUser() user: JwtPayload,
    @Query('ids') ids?: string,
  ) {
    if (!ids) {
      throw new BadRequestException('ids 쿼리 파라미터가 필요합니다.')
    }
    return this.photosService.getDownloadUrls(
      invitationId,
      user.id,
      ids.split(','),
    );
  }

  //사진 다운로드 (전체)
  @Get(':invitationId/photos/download/all')
  getAllDownloadUrls(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.photosService.getAllDownloadUrls(invitationId, user.id);
  }

  //리마인드
  @Get(':invitationId/photos/best9')
  getBest9(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.photosService.getBest9(invitationId, user.id);
  }

  //사진 상세
  @Get(':invitationId/photos/:id')
  getPhoto(
    @Param('invitationId', ParseUlidPipe) invitationId:string,
    @Param('id', ParseUlidPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.photosService.getPhoto(invitationId, id, user.id);
  }

  //사진 업로드
  @Post(':invitationId/photos')
  uploadPhoto(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(UploadPhotoSchema)) dto: UploadPhotoDto,
  ) {
    return this.photosService.uploadPhoto(invitationId, user.id, dto);
  }

  //사진 삭제(소프트딜리트)
  @Delete(':invitationId/photos/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deletePhoto(
    @Param('id', ParseUlidPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.photosService.deletePhoto(id, user.id);
  }

  //사진 좋아요 토글
  @Post(':invitationId/photos/:photoId/likes')
  @HttpCode(HttpStatus.OK)
  toggleLike(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Param('photoId', ParseUlidPipe) photoId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.photosService.toggleLike(photoId, invitationId, user.id);
  }
}
