import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PhotosService } from './photos.service';
import { PhotosRepository } from './photos.repository';
import { S3_CLIENT } from '../s3/s3.module';
import { ErrorCode } from '../common/constants/error-codes';

const mockRepo = () => ({
  findParticipantId: jest.fn(),
  findAllByInvitationId: jest.fn(),
  findPhotoById: jest.fn(),
  findPhotosByIds: jest.fn(),
  create: jest.fn(),
  softDelete: jest.fn(),
  findLike: jest.fn(),
  createLike: jest.fn(),
  deleteLike: jest.fn(),
  incrementViewCount: jest.fn(),
  findBest9: jest.fn(),
});

const mockS3Client = { send: jest.fn() };
const mockConfigService = () => ({
  getOrThrow: jest.fn().mockReturnValue('test-bucket'),
});

// presigned URL 생성 mock
jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://s3.example.com/presigned'),
}));

function makePhoto(overrides = {}) {
  return {
    id: 'PHOTO001',
    participantId: 'P001',
    invitationId: 'INV001',
    imageKey: 'photos/ULID123456789012345678901/file.jpg',
    takenAt: null,
    exifMetadata: null,
    viewCount: 0,
    likeCount: 0,
    feedbackCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

describe('PhotosService', () => {
  let service: PhotosService;
  let repo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PhotosService,
        { provide: PhotosRepository, useFactory: mockRepo },
        { provide: S3_CLIENT, useValue: mockS3Client },
        { provide: ConfigService, useFactory: mockConfigService },
      ],
    }).compile();

    service = module.get(PhotosService);
    repo = module.get(PhotosRepository) as unknown as ReturnType<typeof mockRepo>;
  });

  describe('generatePresignedUrl', () => {
    it('비참가자 접근 시 PARTICIPANT_NOT_FOUND(404)', async () => {
      repo.findParticipantId.mockResolvedValue(null);

      await expect(
        service.generatePresignedUrl('INV001', 'U999', { fileName: 'test.jpg', contentType: 'image/jpeg' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('listPhotos', () => {
    it('비참가자 접근 시 PARTICIPANT_NOT_FOUND(404)', async () => {
      repo.findParticipantId.mockResolvedValue(null);

      await expect(
        service.listPhotos('INV001', 'U999', { limit: 20, sort: 'createdAt', order: 'desc' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('uploadPhoto', () => {
    it('비참가자 접근 시 PARTICIPANT_NOT_FOUND(404)', async () => {
      repo.findParticipantId.mockResolvedValue(null);

      await expect(
        service.uploadPhoto('INV001', 'U999', { imageKey: 'photos/ULID/file.jpg' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getBest9', () => {
    it('비참가자 접근 시 PARTICIPANT_NOT_FOUND(404)', async () => {
      repo.findParticipantId.mockResolvedValue(null);

      await expect(service.getBest9('INV001', 'U999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPhoto', () => {
    it('비참가자 접근 시 PARTICIPANT_NOT_FOUND(404)', async () => {
      repo.findParticipantId.mockResolvedValue(null);

      const promise = service.getPhoto('INV001', 'PHOTO001', 'U999');
      await expect(promise).rejects.toThrow(NotFoundException);
      await expect(promise).rejects.toMatchObject({ message: ErrorCode.PARTICIPANT_NOT_FOUND });
    });

    it('존재하지 않는 사진 조회 시 PHOTO_NOT_FOUND(404)', async () => {
      repo.findParticipantId.mockResolvedValue('P001');
      repo.findPhotoById.mockResolvedValue(null);

      const promise = service.getPhoto('INV001', 'PHOTO999', 'U001');
      await expect(promise).rejects.toThrow(NotFoundException);
      await expect(promise).rejects.toMatchObject({ message: ErrorCode.PHOTO_NOT_FOUND });
    });

    it('다른 초대장 사진 조회 시도 시 PHOTO_NOT_FOUND(404) — IDOR 방지', async () => {
      repo.findParticipantId.mockResolvedValue('P001');
      repo.findPhotoById.mockResolvedValue(makePhoto({ invitationId: 'INV002' }));

      const promise = service.getPhoto('INV001', 'PHOTO001', 'U001');
      await expect(promise).rejects.toThrow(NotFoundException);
      await expect(promise).rejects.toMatchObject({ message: ErrorCode.PHOTO_NOT_FOUND });
    });

    it('정상 조회 시 viewCount 증가 및 presigned URL 반환', async () => {
      repo.findParticipantId.mockResolvedValue('P001');
      repo.findPhotoById.mockResolvedValue(makePhoto());
      repo.incrementViewCount.mockResolvedValue(undefined);

      const result = await service.getPhoto('INV001', 'PHOTO001', 'U001');

      expect(repo.incrementViewCount).toHaveBeenCalledWith('PHOTO001');
      expect(result.data).toHaveProperty('url');
    });
  });

  describe('deletePhoto', () => {
    it('존재하지 않는 사진 삭제 시 PHOTO_NOT_FOUND(404)', async () => {
      repo.findPhotoById.mockResolvedValue(null);

      await expect(service.deletePhoto('PHOTO999', 'U001')).rejects.toThrow(NotFoundException);
    });

    it('타인 사진 삭제 시도 시 PHOTO_FORBIDDEN(403)', async () => {
      repo.findPhotoById.mockResolvedValue(makePhoto({ participantId: 'P002' }));
      repo.findParticipantId.mockResolvedValue('P001');

      const promise = service.deletePhoto('PHOTO001', 'U001');
      await expect(promise).rejects.toThrow(ForbiddenException);
      await expect(promise).rejects.toMatchObject({ message: ErrorCode.PHOTO_FORBIDDEN });
    });

    it('본인 사진 삭제 성공', async () => {
      repo.findPhotoById.mockResolvedValue(makePhoto({ participantId: 'P001' }));
      repo.findParticipantId.mockResolvedValue('P001');
      repo.softDelete.mockResolvedValue(true);

      const result = await service.deletePhoto('PHOTO001', 'U001');

      expect(repo.softDelete).toHaveBeenCalledWith('PHOTO001');
      expect(result).toEqual({ success: true });
    });
  });

  describe('toggleLike', () => {
    it('다른 초대장 사진 좋아요 시도 시 PHOTO_NOT_FOUND(404) — IDOR 방지', async () => {
      repo.findPhotoById.mockResolvedValue(makePhoto({ invitationId: 'INV002' }));

      const promise = service.toggleLike('PHOTO001', 'INV001', 'U001');
      await expect(promise).rejects.toThrow(NotFoundException);
      await expect(promise).rejects.toMatchObject({ message: ErrorCode.PHOTO_NOT_FOUND });
    });

    it('비참가자 좋아요 시도 시 PARTICIPANT_NOT_FOUND(404)', async () => {
      repo.findPhotoById.mockResolvedValue(makePhoto());
      repo.findParticipantId.mockResolvedValue(null);

      await expect(service.toggleLike('PHOTO001', 'INV001', 'U999')).rejects.toThrow(NotFoundException);
    });

    it('좋아요 없는 상태에서 좋아요 — liked: true 반환', async () => {
      repo.findPhotoById.mockResolvedValue(makePhoto());
      repo.findParticipantId.mockResolvedValue('P001');
      repo.findLike.mockResolvedValue(null);
      repo.createLike.mockResolvedValue(undefined);

      const result = await service.toggleLike('PHOTO001', 'INV001', 'U001');

      expect(repo.createLike).toHaveBeenCalledWith('PHOTO001', 'P001');
      expect(result.data).toEqual({ liked: true });
    });

    it('이미 좋아요한 사진에 다시 누르면 취소 — liked: false 반환', async () => {
      repo.findPhotoById.mockResolvedValue(makePhoto());
      repo.findParticipantId.mockResolvedValue('P001');
      repo.findLike.mockResolvedValue({ id: 'LIKE001' });
      repo.deleteLike.mockResolvedValue(undefined);

      const result = await service.toggleLike('PHOTO001', 'INV001', 'U001');

      expect(repo.deleteLike).toHaveBeenCalledWith('PHOTO001', 'P001');
      expect(result.data).toEqual({ liked: false });
    });
  });

  describe('getDownloadUrls', () => {
    it('비참가자 다운로드 시도 시 PARTICIPANT_NOT_FOUND(404)', async () => {
      repo.findParticipantId.mockResolvedValue(null);

      await expect(service.getDownloadUrls('INV001', 'U999', ['PHOTO001'])).rejects.toThrow(NotFoundException);
    });

    it('정상 다운로드 URL 반환 및 invitationId 필터 적용 확인', async () => {
      repo.findParticipantId.mockResolvedValue('P001');
      repo.findPhotosByIds.mockResolvedValue([makePhoto()]);

      const result = await service.getDownloadUrls('INV001', 'U001', ['PHOTO001']);

      expect(repo.findPhotosByIds).toHaveBeenCalledWith(['PHOTO001'], 'INV001');
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toHaveProperty('url');
    });
  });
});
