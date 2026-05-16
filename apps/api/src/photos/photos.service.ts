import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PhotosRepository } from './photos.repository';

import { ConfigService } from '@nestjs/config';
import { PresignedUrlDto } from './dto/presigned-url.dto';
import { ulid } from 'ulid';

import { ListPhotosDto } from './dto/list-photos.dto';

import { UploadPhotoDto } from './dto/upload-photo.dto';
import { ErrorCode } from '../common/constants/error-codes';

@Injectable()
export class PhotosService {
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(
    private readonly repository: PhotosRepository,
    private readonly config: ConfigService,
  ) {
    this.s3 = new S3Client({ region: this.config.getOrThrow('AWS_REGION') });
    this.bucket = this.config.getOrThrow('AWS_S3_BUCKET');
  }

  //업로드용 presigned URL 을 발급 (업로드, 만료시간 15분)
  //초대장 비 참여자 검증은 컨트롤러에서 Guard에서 처리예정
  async generatePresignedUrl(dto: PresignedUrlDto) {
    const key = `photos/${ulid()}/${dto.fileName}`;
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: dto.contentType,
    });
    const presignedUrl = await getSignedUrl(this.s3, command, {
      expiresIn: 900,
    });
    return { success: true, data: { presignedUrl, key } };
  }

  //사진조회용 presigned URL 발급 (만료시간 24시간)
  private async getViewUrl(key: string) {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.s3, command, { expiresIn: 86400 });
  }

  //다운로드용 presigned URL 발급 (만료시간 24시간)
  private async toDownloadUrl(key: string, fileName: string) {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${fileName}"`,
    });
    return getSignedUrl(this.s3, command, { expiresIn: 86400 });
  }

  //전체 사진 db 조회
  async listPhotos(invitationId: string, dto: ListPhotosDto) {
    const { rows, nextCursor } = await this.repository.findAllByInvitationId(
      invitationId,
      dto,
    );
    const data = await Promise.all(
      rows.map(async (photo) => ({
        ...photo,
        url: await this.getViewUrl(photo.imageKey),
      })),
    );
    return { success: true, data, meta: { nextCursor, limit: dto.limit } };
  }

  //사진 db 단건 조회
  async getPhoto(id: string) {
    const photo = await this.repository.findPhotoById(id);

    if (!photo) throw new NotFoundException(ErrorCode.PHOTO_NOT_FOUND);

    await this.repository.incrementViewCount(id);
    const url = await this.getViewUrl(photo.imageKey);

    return { success: true, data: { ...photo, url } };
  }

  //사진정보 db저장
  async uploadPhoto(invitationId: string, userId: string, dto: UploadPhotoDto) {
    const participantId = await this.repository.findParticipantId(
      userId,
      invitationId,
    );

    if (!participantId) {
      throw new NotFoundException(ErrorCode.PARTICIPANT_NOT_FOUND);
    }

    const photo = await this.repository.create({
      invitationId,
      participantId,
      imageKey: dto.imageKey,
      takenAt: dto.takenAt ? new Date(dto.takenAt) : undefined,
      exifMetadata: dto.exifMetadata,
    });
    return { success: true, data: photo };
  }

  //다운로드용 URL 발급 (낱개, 선택)
  async getDownloadUrls(ids: string[]) {
    const photos = await this.repository.findPhotosByIds(ids);

    const data = await Promise.all(
      photos.map(async (photo) => {
        const fileName = photo.imageKey.split('/').pop() ?? `photo_${photo.id}`;
        const url = await this.toDownloadUrl(photo.imageKey, fileName);
        return { id: photo.id, url };
      }),
    );

    return { success: true, data };
  }

  //전체 다운로드
  async getAllDownloadUrls(invitationId: string) {
    const { rows } = await this.repository.findAllByInvitationId(invitationId, {
      limit: 9999,
      sort: 'createdAt',
      order: 'asc',
    });
    const ids = rows.map((p) => p.id);
    return this.getDownloadUrls(ids);
  }

  //사진 삭제 (소프트 딜리트)
  async deletePhoto(id: string, userId: string) {
    const photo = await this.repository.findPhotoById(id);

    if (!photo) {
      throw new NotFoundException(ErrorCode.PHOTO_NOT_FOUND);
    }

    const participantId = await this.repository.findParticipantId(
      userId,
      photo.invitationId,
    );

    if (photo.participantId !== participantId) {
      throw new ForbiddenException(ErrorCode.PHOTO_FORBIDDEN);
    }
    await this.repository.softDelete(id);
    return { success: true };
  }

  //좋아요 토글
  async toggleLike(photoId: string, invitationId: string, userId: string) {
    const photo = await this.repository.findPhotoById(photoId);
    if (!photo) {
      throw new NotFoundException(ErrorCode.PHOTO_NOT_FOUND);
    }

    const participantId = await this.repository.findParticipantId(
      userId,
      invitationId,
    );
    if (!participantId) {
      throw new NotFoundException(ErrorCode.PARTICIPANT_NOT_FOUND);
    }

    const existing = await this.repository.findLike(photoId, participantId);

    if (existing) {
      await this.repository.deleteLike(photoId, participantId);
      return { success: true, data: { liked: false } };
    } else {
      await this.repository.createLike(photoId, participantId);
      return { success: true, data: { liked: true } };
    }
  }

  //리마인드
  async getBest9(invitationId: string) {
    const rows = await this.repository.findBest9(invitationId);
    const data = await Promise.all(
      rows.map(async (photo) => ({
        ...photo,
        url: await this.getViewUrl(photo.imageKey),
      })),
    );
    return { success: true, data };
  }
}
