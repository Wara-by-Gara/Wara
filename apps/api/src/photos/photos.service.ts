import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import {
  ForbiddenException,
  Inject,
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
import { S3_CLIENT } from '../s3/s3.module';

const MAX_DOWNLOAD_LIMIT = 9999; // 전체 다운로드 최대 사진 수
const UPLOAD_URL_EXPIRES_IN = 900; // 업로드용 Presigned URL 만료 시간 (15분)
const GET_URL_EXPIRES_IN = 86400; // 조회/다운로드용 Presigned URL 만료 시간 (24시간)

@Injectable()
export class PhotosService {
  private readonly bucket: string;

  constructor(
    private readonly repository: PhotosRepository,
    @Inject(S3_CLIENT) private readonly s3: S3Client,
    private readonly config: ConfigService,
  ) {
    this.bucket = this.config.getOrThrow('AWS_S3_BUCKET');
  }

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
  async getPhoto(id: string, participantId: string) {
    const photo = await this.repository.findPhotoById(id);

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
    return photo;
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

    return data;
  }

  //전체 다운로드
  async getAllDownloadUrls(invitationId: string) {
    const { rows } = await this.repository.findAllByInvitationId(invitationId, {
      limit: MAX_DOWNLOAD_LIMIT,
      sort: 'createdAt',
      order: 'asc',
    });
    const ids = rows.map((p) => p.id);
    return this.getDownloadUrls(ids);
  }

  //사진 삭제 (소프트 딜리트)
  async deletePhoto(id: string, participantId: string) {
    const photo = await this.repository.findPhotoById(id);

    if (!photo) {
      throw new NotFoundException(ErrorCode.PHOTO_NOT_FOUND);
    }

    if (photo.participantId !== participantId) {
      throw new ForbiddenException(ErrorCode.PHOTO_FORBIDDEN);
    }
    await this.repository.softDelete(id);
  }

  //좋아요 토글
  async toggleLike(photoId: string, participantId: string) {
    const photo = await this.repository.findPhotoById(photoId);
    if (!photo) {
      throw new NotFoundException(ErrorCode.PHOTO_NOT_FOUND);
    }

    const existing = await this.repository.findLike(photoId, participantId);

    if (existing) {
      await this.repository.deleteLike(photoId, participantId);
      return { liked: false };
    } else {
      await this.repository.createLike(photoId, participantId);
      return { liked: true };
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
