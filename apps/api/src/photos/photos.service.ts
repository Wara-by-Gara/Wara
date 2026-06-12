import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PhotosRepository } from './photos.repository';
import { PresignedUrlDto } from './dto/presigned-url.dto';
import { ulid } from 'ulid';
import { ListPhotosDto } from './dto/list-photos.dto';
import { UploadPhotoDto } from './dto/upload-photo.dto';
import { ErrorCode } from '../common/constants/error-codes';
import { S3Service } from '../s3/s3.service';
import { ImageProcessingService } from '../image-processing/image-processing.service';
import { ImageProcessingJobsRepository } from '../image-processing/image-processing-jobs.repository';
import { IMAGE_PROCESSING_QUEUE } from '../queues/queue.constants';
import { KakaoLocalService } from '../locations/kakao-local.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { Photo } from '../database/schema';

const MAX_DOWNLOAD_LIMIT = 9999;

@Injectable()
export class PhotosService {
  constructor(
    private readonly repository: PhotosRepository,
    private readonly s3Service: S3Service,
    private readonly imageProcessing: ImageProcessingService,
    private readonly imageJobs: ImageProcessingJobsRepository,
    @InjectQueue(IMAGE_PROCESSING_QUEUE) private readonly imageQueue: Queue,
    private readonly kakaoLocalService: KakaoLocalService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // 업로드용 presigned URL 발급 (15분)
  async generatePresignedUrl(invitationId: string, dto: PresignedUrlDto) {
    const key = `photos/${invitationId}/${ulid()}/${dto.fileName}`;
    return this.s3Service.getUploadPresignedUrl(key, dto.contentType);
  }

  // 전체 사진 DB 조회
  async listPhotos(invitationId: string, dto: ListPhotosDto, participantId?: string) {
    const { rows, nextCursor, total } =
      await this.repository.findAllByInvitationId(invitationId, dto, participantId);
    const data = await Promise.all(
      rows.map(async (photo) => ({
        ...photo,
        url: await this.s3Service.getViewPresignedUrl(photo.imageKey),
        thumbnailUrl: photo.thumbnailKey
          ? await this.s3Service.getViewPresignedUrl(photo.thumbnailKey)
          : null,
        score: photo.viewCount * 0.5 + photo.likeCount * 1.0 + photo.feedbackCount * 1.5,
      })),
    );
    return { rows: data, nextCursor, limit: dto.limit, total };
  }

  // 사진 단건 조회
  async getPhoto(id: string, participantId: string, invitationId: string) {
    const photo = await this.repository.findPhotoById(id, invitationId);
    if (!photo) throw new NotFoundException(ErrorCode.PHOTO_NOT_FOUND);

    await this.repository.incrementViewCount(id);
    const url = await this.s3Service.getViewPresignedUrl(photo.imageKey);
    const thumbnailUrl = photo.thumbnailKey
      ? await this.s3Service.getViewPresignedUrl(photo.thumbnailKey)
      : null;
    const liked = !!(await this.repository.findLike(id, participantId));

    return {
      ...photo,
      url,
      thumbnailUrl,
      liked,
      score: photo.viewCount * 0.5 + photo.likeCount * 1.0 + photo.feedbackCount * 1.5,
    };
  }

  // 사진 정보 DB 저장. presigned PUT 직후 호출되며 S3 객체를 매직넘버 sniff + 크기로 검증한 뒤 enqueue.
  async uploadPhoto(invitationId: string, participantId: string, dto: UploadPhotoDto) {
    let exifFingerprint: string | undefined;
    if (dto.takenAt) {
      const meta = dto.exifMetadata ?? {};
      exifFingerprint = [
        dto.takenAt,
        meta.make ?? '',
        meta.model ?? '',
        dto.fileSize ?? '',
        meta.gps_lat ?? '',
        meta.gps_lng ?? '',
      ].join('|');

      const existing = await this.repository.findByFingerprint(invitationId, exifFingerprint);
      if (existing) throw new ConflictException(ErrorCode.PHOTO_DUPLICATE);
    }

    let exifMetadata = dto.exifMetadata;
    if (exifMetadata?.gps_lat != null && exifMetadata?.gps_lng != null) {
      const address = await this.kakaoLocalService.reverseGeocode(
        exifMetadata.gps_lat,
        exifMetadata.gps_lng,
      );
      if (address) exifMetadata = { ...exifMetadata, gps_address: address };
    }

    let photo: Photo;
    try {
      photo = (await this.repository.create({
        invitationId,
        participantId,
        imageKey: dto.imageKey,
        takenAt: dto.takenAt ? new Date(dto.takenAt) : undefined,
        exifMetadata,
        exifFingerprint,
      }))!;
    } catch (e: unknown) {
      if (typeof e === 'object' && e !== null && 'code' in e && (e as { code: string }).code === '23505') {
        throw new ConflictException(ErrorCode.PHOTO_DUPLICATE);
      }
      throw e;
    }

    // 업로더 제외한 전체 참여자에게 실시간 알림 (isPhoto 설정 ON 대상만 — notify 내부에서 게이팅)
    const recipients = await this.repository.findParticipantUserIds(invitationId, participantId);
    if (recipients.length) {
      const nickname = (await this.repository.findNicknameByParticipantId(participantId)) ?? '누군가';
      await Promise.all(
        recipients.map((userId) =>
          this.notificationsService.notify({
            userId,
            type: 'photo',
            content: `${nickname}님이 새 사진을 올렸습니다`,
            targetType: 'photo',
            targetId: photo.id,
            invitationId,
          }),
        ),
      );
    }

    return photo;
  }

  // 다운로드용 URL 발급 (낱개, 선택)
  async getDownloadUrls(ids: string[], invitationId: string) {
    const photos = await this.repository.findPhotosByIds(ids, invitationId);
    return Promise.all(
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
    return this.getDownloadUrls(rows.map((p) => p.id), invitationId);
  }

  // 사진 삭제 (소프트 딜리트)
  async deletePhoto(id: string, participantId: string, invitationId: string) {
    const photo = await this.repository.findPhotoById(id, invitationId);
    if (!photo) throw new NotFoundException(ErrorCode.PHOTO_NOT_FOUND);
    if (photo.participantId !== participantId) throw new ForbiddenException(ErrorCode.PHOTO_FORBIDDEN);
    await this.repository.softDelete(id);
  }

  // 좋아요 토글
  async toggleLike(photoId: string, participantId: string, invitationId: string) {
    const photo = await this.repository.findPhotoById(photoId, invitationId);
    if (!photo) throw new NotFoundException(ErrorCode.PHOTO_NOT_FOUND);

    const existing = await this.repository.findLike(photoId, participantId);
    if (existing) {
      const likeCount = await this.repository.deleteLike(photoId, participantId);
      return { liked: false, likeCount };
    }

    try {
      const likeCount = await this.repository.createLike(photoId, participantId);
      return { liked: true, likeCount };
    } catch (e: unknown) {
      if (typeof e === 'object' && e !== null && 'code' in e && (e as { code: string }).code === '23505') {
        return { liked: true, likeCount: photo.likeCount };
      }
      throw e;
    }
  }

  // 유저 전체 모임 GPS 사진 조회 (지도 핀용)
  async getPhotoLocations(userId: string) {
    const rows = await this.repository.findAllWithGpsByUserId(userId);
    return Promise.all(
      rows.map(async (photo) => {
        const meta = photo.exifMetadata as Record<string, unknown>;
        return {
          id: photo.id,
          participantId: photo.participantId,
          invitationId: photo.invitationId,
          imageKey: photo.imageKey,
          likeCount: photo.likeCount,
          feedbackCount: photo.feedbackCount,
          url: await this.s3Service.getViewPresignedUrl(photo.imageKey),
          createdAt: photo.createdAt.toISOString(),
          takenAt: photo.takenAt?.toISOString() ?? null,
          gpsLat: Number(meta.gps_lat),
          gpsLng: Number(meta.gps_lng),
        };
      }),
    );
  }

  // 리마인드 Best 9
  async getBest9(invitationId: string) {
    const rows = await this.repository.findBest9(invitationId);
    return Promise.all(
      rows.map(async (photo) => ({
        ...photo,
        url: await this.s3Service.getViewPresignedUrl(photo.imageKey),
        thumbnailUrl: photo.thumbnailKey
          ? await this.s3Service.getViewPresignedUrl(photo.thumbnailKey)
          : null,
        score: photo.viewCount * 0.5 + photo.likeCount * 1.0 + photo.feedbackCount * 1.5,
      })),
    );
  }
}