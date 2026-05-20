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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PhotosService } from './photos.service';

import { PresignedUrlDto, PresignedUrlSchema } from './dto/presigned-url.dto';

import { ListPhotosDto, ListPhotosSchema } from './dto/list-photos.dto';

import { UploadPhotoDto, UploadPhotoSchema } from './dto/upload-photo.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ParseUlidPipe } from '../common/pipes/parse-ulid.pipe';
import { CurrentParticipant } from '../common/decorators/current-participant.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { BlocklistGuard } from '../common/guards/blocklist.guard';
import { ParticipantGuard } from '../common/guards/participant.guard';
import type { Participant } from '../database/schema';

@ApiTags('Photos')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, BlocklistGuard, ParticipantGuard)
@Controller('invitations')
export class PhotosController {
  constructor(private readonly photosService: PhotosService) {}

  @Post(':invitationId/photos/presigned-url')
  @ApiOperation({ summary: 'S3 업로드용 Presigned URL 발급' })
  @ApiResponse({ status: 201, description: 'presignedUrl, key 반환' })
  @ApiResponse({ status: 403, description: 'INVITATION_ACCESS_REVOKED' })
  @ApiResponse({ status: 404, description: 'PARTICIPANT_NOT_FOUND' })
  generatePresignedUrl(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Body(new ZodValidationPipe(PresignedUrlSchema)) dto: PresignedUrlDto,
  ) {
    return this.photosService.generatePresignedUrl(invitationId, dto);
  }

  @Get(':invitationId/photos')
  @ApiOperation({ summary: '사진 목록 조회 (cursor 페이지네이션)' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({ status: 404, description: 'PARTICIPANT_NOT_FOUND' })
  listPhotos(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Query(new ZodValidationPipe(ListPhotosSchema)) dto: ListPhotosDto,
  ) {
    return this.photosService.listPhotos(invitationId, dto);
  }

  @Get(':invitationId/photos/download')
  @ApiOperation({ summary: '선택 사진 다운로드 URL 발급' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({ status: 404, description: 'PARTICIPANT_NOT_FOUND' })
  getDownloadUrls(@Query('ids') ids?: string) {
    if (!ids) {
      throw new BadRequestException('ids 쿼리 파라미터가 필요합니다.');
    }
    return this.photosService.getDownloadUrls(ids.split(','));
  }

  @Get(':invitationId/photos/download/all')
  @ApiOperation({ summary: '전체 사진 다운로드 URL 발급' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({ status: 404, description: 'PARTICIPANT_NOT_FOUND' })
  getAllDownloadUrls(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
  ) {
    return this.photosService.getAllDownloadUrls(invitationId);
  }

  @Get(':invitationId/photos/best9')
  @ApiOperation({ summary: 'Best 9 사진 조회 (리마인드 앨범)' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({ status: 404, description: 'PARTICIPANT_NOT_FOUND' })
  getBest9(@Param('invitationId', ParseUlidPipe) invitationId: string) {
    return this.photosService.getBest9(invitationId);
  }

  @Get(':invitationId/photos/:id')
  @ApiOperation({ summary: '사진 단건 조회 (조회수 증가)' })
  @ApiResponse({ status: 200, description: '성공 - presigned URL 포함' })
  @ApiResponse({ status: 404, description: 'PHOTO_NOT_FOUND | PARTICIPANT_NOT_FOUND' })
  getPhoto(@Param('id', ParseUlidPipe) id: string) {
    return this.photosService.getPhoto(id);
  }

  @Post(':invitationId/photos')
  @ApiOperation({ summary: '사진 업로드 완료 후 DB 저장' })
  @ApiResponse({ status: 201, description: '성공' })
  @ApiResponse({ status: 404, description: 'PARTICIPANT_NOT_FOUND' })
  uploadPhoto(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @CurrentParticipant() participant: Participant,
    @Body(new ZodValidationPipe(UploadPhotoSchema)) dto: UploadPhotoDto,
  ) {
    return this.photosService.uploadPhoto(invitationId, participant.id, dto);
  }

  @Delete(':invitationId/photos/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '사진 삭제 (soft delete, 본인만)' })
  @ApiResponse({ status: 204, description: '성공' })
  @ApiResponse({ status: 403, description: 'PHOTO_FORBIDDEN' })
  @ApiResponse({ status: 404, description: 'PHOTO_NOT_FOUND' })
  deletePhoto(
    @Param('id', ParseUlidPipe) id: string,
    @CurrentParticipant() participant: Participant,
  ) {
    return this.photosService.deletePhoto(id, participant.id);
  }

  @Post(':invitationId/photos/:photoId/likes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '사진 좋아요 토글 (있으면 취소, 없으면 추가)' })
  @ApiResponse({ status: 200, description: '{ liked: true | false }' })
  @ApiResponse({ status: 404, description: 'PHOTO_NOT_FOUND | PARTICIPANT_NOT_FOUND' })
  toggleLike(
    @Param('photoId', ParseUlidPipe) photoId: string,
    @CurrentParticipant() participant: Participant,
  ) {
    return this.photosService.toggleLike(photoId, participant.id);
  }
}
