import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PhotosRepository } from './photos.repository';
import { PresignedUrlDto } from './dto/presigned-url.dto';
import { ulid } from 'ulid';
import { ListPhotosDto } from './dto/list-photos.dto';
import { UploadPhotoDto } from './dto/upload-photo.dto';
import { ErrorCode } from '../common/constants/error-codes';
import { S3Service } from '../s3/s3.service';

const MAX_DOWNLOAD_LIMIT = 9999;

@Injectable()
export class PhotosService {
  constructor(
    private readonly repository: PhotosRepository,
    private readonly s3Service: S3Service,
  ) {}

  //업로드용 presigned URL 을 발급 (업로드, 만료시간 15분)
  async generatePresignedUrl(invitationId: string, dto: PresignedUrlDto) {
    const key = `photos/${invitationId}/${ulid()}/${dto.fileName}`;
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: dto.contentType,
    });
    const presignedUrl = await getSignedUrl(this.s3, command, {
      expiresIn: UPLOAD_URL_EXPIRES_IN,
    });
    return { presignedUrl, key };
  }

  //사진조회용 presigned URL 발급 (만료시간 24시간)
  private async getViewUrl(key: string) {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.s3, command, { expiresIn: GET_URL_EXPIRES_IN });
  }

  //다운로드용 presigned URL 발급 (만료시간 24시간)
  private async toDownloadUrl(key: string, fileName: string) {
    const encodedFileName = encodeURIComponent(fileName);
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ResponseContentDisposition: `attachment; filename*=UTF-8''${encodedFileName}`,
    });
    return getSignedUrl(this.s3, command, { expiresIn: GET_URL_EXPIRES_IN });
  }

  //전체 사진 db 조회
  async listPhotos(invitationId: string, dto: ListPhotosDto) {
    const { rows, nextCursor, total } =
      await this.repository.findAllByInvitationId(invitationId, dto);
    const data = await Promise.all(
      rows.map(async (photo) => ({
        ...photo,
        url: await this.getViewUrl(photo.imageKey),
        score:
          photo.viewCount * 0.5 +
          photo.likeCount * 1.0 +
          photo.feedbackCount * 1.5,
      })),
    );
    return { rows: data, nextCursor, limit: dto.limit, total };
  }

  //사진 db 단건 조회
  async getPhoto(id: string, participantId: string, invitationId: string) {
    const photo = await this.repository.findPhotoById(id, invitationId);

    if (!photo) throw new NotFoundException(ErrorCode.PHOTO_NOT_FOUND);

    await this.repository.incrementViewCount(id);
    const url = await this.getViewUrl(photo.imageKey);
    const liked = !!(await this.repository.findLike(id, participantId));

    return {
      ...photo,
      url,
      liked,
      score:
        photo.viewCount * 0.5 +
        photo.likeCount * 1.0 +
        photo.feedbackCount * 1.5,
    };
  }

  //사진정보 db저장
  async uploadPhoto(
    invitationId: string,
    participantId: string,
    dto: UploadPhotoDto,
  ) {
    const photo = await this.repository.create({
      invitationId,
      participantId,
      imageKey: dto.imageKey,
      takenAt: dto.takenAt ? new Date(dto.takenAt) : undefined,
      exifMetadata: dto.exifMetadata,
    });
  }

  //다운로드용 URL 발급 (낱개, 선택)
  async getDownloadUrls(ids: string[], invitationId: string) {
    const photos = await this.repository.findPhotosByIds(ids, invitationId);

    const data = await Promise.all(
      photos.map(async (photo) => {
        const fileName = photo.imageKey.split('/').pop() ?? `photo_${photo.id}`;
        const url = await this.s3Service.getDownloadPresignedUrl(photo.imageKey, fileName);
        return { id: photo.id, url };
      }),
    );
  }

  // 전체 다운로드
  async getAllDownloadUrls(invitationId: string) {
    const { rows } = await this.repository.findAllByInvitationId(invitationId, {
      limit: MAX_DOWNLOAD_LIMIT,
      sort: 'createdAt',
      order: 'asc',
    });
    const ids = rows.map((p) => p.id);
    return this.getDownloadUrls(ids, invitationId);
  }

  //사진 삭제 (소프트 딜리트)
  async deletePhoto(id: string, participantId: string, invitationId: string) {
    const photo = await this.repository.findPhotoById(id, invitationId);

    if (!photo) {
      throw new NotFoundException(ErrorCode.PHOTO_NOT_FOUND);
    }

    if (photo.participantId !== participantId) {
      throw new ForbiddenException(ErrorCode.PHOTO_FORBIDDEN);
    }
    await this.repository.softDelete(id);
  }

  //좋아요 토글
  async toggleLike(photoId: string, participantId: string, invitationId: string) {
    const photo = await this.repository.findPhotoById(photoId, invitationId);
    if (!photo) {
      throw new NotFoundException(ErrorCode.PHOTO_NOT_FOUND);
    }

    const existing = await this.repository.findLike(photoId, participantId);
    if (existing) {
      await this.repository.deleteLike(photoId, participantId);
      return { liked: false };
    }

    try {
      await this.repository.createLike(photoId, participantId);
      return { liked: true };
    } catch (e: any) {
      if (e?.code === '23505') return { liked: true };
      throw e;
    }
  }

  //리마인드
  async getBest9(invitationId: string) {
    const rows = await this.repository.findBest9(invitationId);
    const data = await Promise.all(
      rows.map(async (photo) => ({
        ...photo,
        url: await this.getViewUrl(photo.imageKey),
        score:
          photo.viewCount * 0.5 +
          photo.likeCount * 1.0 +
          photo.feedbackCount * 1.5,
      })),
    );
    return data;
  }
}