/**
 * Photos API e2e 테스트
 *
 * 사전 조건:
 *   - Docker postgres + redis 실행 중 (docker-compose up)
 *   - NODE_ENV=development (apps/api/.env.development 로드)
 *
 * 실행:
 *   cd apps/api
 *   NODE_ENV=development npx jest --config test/jest-e2e.json --testPathPattern photos.e2e
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getQueueToken } from '@nestjs/bullmq';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { S3Service } from '../src/s3/s3.service';
import { S3_CLIENT } from '../src/s3/s3.constants';
import { KakaoLocalService } from '../src/locations/kakao-local.service';
import { RequiredTermsGuard } from '../src/common/guards/required-terms.guard';
import { DRIZZLE, type DrizzleDB } from '../src/database/database.module';
import { IMAGE_PROCESSING_QUEUE } from '../src/queues/queue.constants';
import { ImageThumbnailProcessor } from '../src/image-processing/image-thumbnail.processor';
import { ResponseFormatInterceptor } from '../src/common/interceptors/response-format.interceptor';
import { DbTimeInterceptor } from '../src/common/interceptors/db-time.interceptor';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import {
  createTestFixtures,
  insertPhoto,
  cleanPhotos,
  cleanAllFixtures,
  type TestFixtures,
} from './helpers/db-fixtures';

const mockS3Service = {
  getUploadPresignedUrl: jest.fn().mockResolvedValue({
    presignedUrl: 'https://fake-s3.test/photos/test-key?X-Amz-Signature=fake',
    key: 'photos/test-invitation/test-ulid/photo.jpg',
  }),
  getViewPresignedUrl: jest.fn().mockResolvedValue('https://fake-s3.test/view?sig=fake'),
  getDownloadPresignedUrl: jest.fn().mockResolvedValue('https://fake-s3.test/dl?sig=fake'),
  headObject: jest.fn().mockResolvedValue({ contentLength: 1024, contentType: 'image/jpeg' }),
  getObjectRange: jest.fn().mockResolvedValue(Buffer.from([0xff, 0xd8, 0xff])),
  deleteObject: jest.fn().mockResolvedValue(undefined),
  getObjectBuffer: jest.fn().mockResolvedValue(Buffer.from('fake')),
  putObjectBuffer: jest.fn().mockResolvedValue(undefined),
};

describe('Photos (e2e)', () => {
  let app: INestApplication<App>;
  let db: DrizzleDB;
  let fixtures: TestFixtures;

  function photosUrl(suffix = '') {
    return `/api/invitations/${fixtures.invitationId}/photos${suffix}`;
  }

  function auth(token: string) {
    return { Authorization: `Bearer ${token}` };
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(S3_CLIENT)
      .useValue({})
      .overrideProvider(S3Service)
      .useValue(mockS3Service)
      .overrideProvider(KakaoLocalService)
      .useValue({ reverseGeocode: jest.fn().mockResolvedValue(null) })
      .overrideProvider(getQueueToken(IMAGE_PROCESSING_QUEUE))
      .useValue({
        add: jest.fn().mockResolvedValue({ id: 'fake-job-id' }),
        // BullExplorer.getQueueOptions reads queueRef.opts.connection to pass to Worker constructor
        opts: { connection: { host: 'localhost', port: 6379 } },
      })
      .overrideProvider(ImageThumbnailProcessor)
      .useValue({})  // useValue({}) → wrapper.metatype=null → isProcessor(Object)=false → no Worker created
      .overrideProvider(RequiredTermsGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalInterceptors(new DbTimeInterceptor(), new ResponseFormatInterceptor());
    app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());
    await app.init();

    db = app.get<DrizzleDB>(DRIZZLE);
    const jwtService = app.get(JwtService);
    fixtures = await createTestFixtures(db, jwtService);
  }, 60_000);

  afterEach(async () => {
    await cleanPhotos(db, fixtures.invitationId);
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await cleanAllFixtures(db, fixtures.invitationId, fixtures.userId, fixtures.guestUserId);
    await app.close();
  }, 30_000);

  // ---------------------------------------------------------------------------
  // POST /api/invitations/:id/photos/presigned-url
  // ---------------------------------------------------------------------------
  describe('POST /photos/presigned-url', () => {
    const validDto = { fileName: 'test.jpg', contentType: 'image/jpeg' };

    it('참여자 → 200, presignedUrl과 key 반환', async () => {
      const res = await request(app.getHttpServer())
        .post(photosUrl('/presigned-url'))
        .set(auth(fixtures.accessToken))
        .send(validDto)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        presignedUrl: expect.stringContaining('https://'),
        key: expect.stringContaining('photos/'),
      });
    });

    it('미인증 → 401', async () => {
      const res = await request(app.getHttpServer())
        .post(photosUrl('/presigned-url'))
        .send(validDto)
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('허용되지 않은 contentType → 400 VALIDATION_ERROR', async () => {
      const res = await request(app.getHttpServer())
        .post(photosUrl('/presigned-url'))
        .set(auth(fixtures.accessToken))
        .send({ fileName: 'test.gif', contentType: 'image/gif' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('존재하지 않는 초대장 → 403 (ParticipantGuard가 ParseUlidPipe보다 먼저 실행)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/invitations/not-a-ulid/photos/presigned-url')
        .set(auth(fixtures.accessToken))
        .send(validDto)
        .expect(403);

      expect(res.body.success).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /api/invitations/:id/photos
  // ---------------------------------------------------------------------------
  describe('POST /photos (upload 등록)', () => {
    it('imageKey만 있는 경우 → 201, photo 객체 반환', async () => {
      const res = await request(app.getHttpServer())
        .post(photosUrl())
        .set(auth(fixtures.accessToken))
        .send({ imageKey: `photos/${fixtures.invitationId}/abc/photo.jpg` })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        id: expect.any(String),
        invitationId: fixtures.invitationId,
        participantId: fixtures.participantId,
        imageKey: expect.stringContaining('photos/'),
      });
    });

    it('takenAt + exifMetadata 포함 → 201', async () => {
      const res = await request(app.getHttpServer())
        .post(photosUrl())
        .set(auth(fixtures.accessToken))
        .send({
          imageKey: `photos/${fixtures.invitationId}/abc/photo.jpg`,
          takenAt: '2024-06-01T10:00:00.000Z',
          fileSize: 2048,
          exifMetadata: { gps_lat: 37.5, gps_lng: 127.0 },
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.takenAt).toBeTruthy();
    });

    it('동일 fingerprint 두 번 POST → 첫 번째 201, 두 번째 409 PHOTO_DUPLICATE', async () => {
      const dto = {
        imageKey: `photos/${fixtures.invitationId}/dup/photo.jpg`,
        takenAt: '2024-01-01T00:00:00.000Z',
        fileSize: 1024,
        exifMetadata: { make: 'Apple', model: 'iPhone 15' },
      };

      await request(app.getHttpServer())
        .post(photosUrl())
        .set(auth(fixtures.accessToken))
        .send(dto)
        .expect(201);

      const res = await request(app.getHttpServer())
        .post(photosUrl())
        .set(auth(fixtures.accessToken))
        .send({ ...dto, imageKey: `photos/${fixtures.invitationId}/dup2/photo.jpg` })
        .expect(409);

      expect(res.body.error.code).toBe('PHOTO_DUPLICATE');
    });

    it('imageKey 없음 → 400 VALIDATION_ERROR', async () => {
      const res = await request(app.getHttpServer())
        .post(photosUrl())
        .set(auth(fixtures.accessToken))
        .send({})
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ---------------------------------------------------------------------------
  // GET /api/invitations/:id/photos
  // ---------------------------------------------------------------------------
  describe('GET /photos (목록 조회)', () => {
    it('등록된 사진 목록 반환, 각 photo에 url 포함', async () => {
      await insertPhoto(db, fixtures.invitationId, fixtures.participantId);
      await insertPhoto(db, fixtures.invitationId, fixtures.participantId);

      const res = await request(app.getHttpServer())
        .get(photosUrl())
        .set(auth(fixtures.accessToken))
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.rows).toHaveLength(2);
      expect(res.body.data.rows[0]).toMatchObject({
        url: expect.any(String),
      });
      expect(res.body.data.total).toBe(2);
    });

    it('limit=1 → nextCursor 반환', async () => {
      await insertPhoto(db, fixtures.invitationId, fixtures.participantId);
      await insertPhoto(db, fixtures.invitationId, fixtures.participantId);

      const res = await request(app.getHttpServer())
        .get(photosUrl())
        .query({ limit: 1 })
        .set(auth(fixtures.accessToken))
        .expect(200);

      expect(res.body.data.rows).toHaveLength(1);
      expect(res.body.data.nextCursor).toBeTruthy();
    });

    it('soft delete된 사진은 목록에서 제외', async () => {
      const photo = await insertPhoto(db, fixtures.invitationId, fixtures.participantId);
      await insertPhoto(db, fixtures.invitationId, fixtures.participantId, {
        deletedAt: new Date(),
      });

      const res = await request(app.getHttpServer())
        .get(photosUrl())
        .set(auth(fixtures.accessToken))
        .expect(200);

      expect(res.body.data.rows).toHaveLength(1);
      expect(res.body.data.rows[0].id).toBe(photo.id);
    });

    it('sort=takenAt: takenAt null 사진은 맨 뒤', async () => {
      const withTaken = await insertPhoto(db, fixtures.invitationId, fixtures.participantId, {
        takenAt: new Date('2024-01-01T00:00:00Z'),
      });
      const noTaken = await insertPhoto(db, fixtures.invitationId, fixtures.participantId, {
        takenAt: undefined,
      });

      const res = await request(app.getHttpServer())
        .get(photosUrl())
        .query({ sort: 'takenAt', order: 'asc' })
        .set(auth(fixtures.accessToken))
        .expect(200);

      const ids = res.body.data.rows.map((p: { id: string }) => p.id);
      expect(ids[0]).toBe(withTaken.id);
      expect(ids[ids.length - 1]).toBe(noTaken.id);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /api/invitations/:id/photos/:photoId
  // ---------------------------------------------------------------------------
  describe('GET /photos/:id (단건 조회)', () => {
    it('사진 조회 → url, thumbnailUrl, liked 포함', async () => {
      const photo = await insertPhoto(db, fixtures.invitationId, fixtures.participantId);

      const res = await request(app.getHttpServer())
        .get(photosUrl(`/${photo.id}`))
        .set(auth(fixtures.accessToken))
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        id: photo.id,
        url: expect.any(String),
        thumbnailUrl: null,
        liked: false,
      });
    });

    it('조회 시 viewCount 1 증가', async () => {
      const photo = await insertPhoto(db, fixtures.invitationId, fixtures.participantId);

      await request(app.getHttpServer())
        .get(photosUrl(`/${photo.id}`))
        .set(auth(fixtures.accessToken))
        .expect(200);

      const res = await request(app.getHttpServer())
        .get(photosUrl(`/${photo.id}`))
        .set(auth(fixtures.accessToken))
        .expect(200);

      // getPhoto increments viewCount AFTER fetching, so response returns pre-increment value
      // 1st call: fetch(0) → increment to 1 → return 0
      // 2nd call: fetch(1) → increment to 2 → return 1
      expect(res.body.data.viewCount).toBe(1);
    });

    it('없는 photoId → 404 PHOTO_NOT_FOUND', async () => {
      const fakeId = '01ARZ3NDEKTSV4RRFFQ69G5FAV'; // valid 26-char ULID, not in DB
      const res = await request(app.getHttpServer())
        .get(photosUrl(`/${fakeId}`))
        .set(auth(fixtures.accessToken))
        .expect(404);

      expect(res.body.error.code).toBe('PHOTO_NOT_FOUND');
    });
  });

  // ---------------------------------------------------------------------------
  // GET /api/invitations/:id/photos/download
  // ---------------------------------------------------------------------------
  describe('GET /photos/download (선택 다운로드)', () => {
    it('ids로 선택한 사진 download URL 반환', async () => {
      const p1 = await insertPhoto(db, fixtures.invitationId, fixtures.participantId);
      const p2 = await insertPhoto(db, fixtures.invitationId, fixtures.participantId);

      const res = await request(app.getHttpServer())
        .get(photosUrl('/download'))
        .query({ ids: `${p1.id},${p2.id}` })
        .set(auth(fixtures.accessToken))
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0]).toMatchObject({
        id: expect.any(String),
        url: expect.stringContaining('https://'),
      });
    });

    it('ids 없음 → 400', async () => {
      await request(app.getHttpServer())
        .get(photosUrl('/download'))
        .set(auth(fixtures.accessToken))
        .expect(400);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /api/invitations/:id/photos/download/all
  // ---------------------------------------------------------------------------
  describe('GET /photos/download/all (전체 다운로드)', () => {
    it('전체 download URL 배열 반환', async () => {
      await insertPhoto(db, fixtures.invitationId, fixtures.participantId);
      await insertPhoto(db, fixtures.invitationId, fixtures.participantId);

      const res = await request(app.getHttpServer())
        .get(photosUrl('/download/all'))
        .set(auth(fixtures.accessToken))
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
    });
  });

  // ---------------------------------------------------------------------------
  // DELETE /api/invitations/:id/photos/:id
  // ---------------------------------------------------------------------------
  describe('DELETE /photos/:id (soft delete)', () => {
    it('내 사진 삭제 → 204, 이후 목록 조회에서 미포함', async () => {
      const photo = await insertPhoto(db, fixtures.invitationId, fixtures.participantId);

      await request(app.getHttpServer())
        .delete(photosUrl(`/${photo.id}`))
        .set(auth(fixtures.accessToken))
        .expect(204);

      const list = await request(app.getHttpServer())
        .get(photosUrl())
        .set(auth(fixtures.accessToken))
        .expect(200);

      const ids = list.body.data.rows.map((p: { id: string }) => p.id);
      expect(ids).not.toContain(photo.id);
    });

    it('남의 사진 삭제 → 403 PHOTO_FORBIDDEN', async () => {
      const guestPhoto = await insertPhoto(db, fixtures.invitationId, fixtures.guestParticipantId);

      const res = await request(app.getHttpServer())
        .delete(photosUrl(`/${guestPhoto.id}`))
        .set(auth(fixtures.accessToken))
        .expect(403);

      expect(res.body.error.code).toBe('PHOTO_FORBIDDEN');
    });

    it('없는 사진 → 404 PHOTO_NOT_FOUND', async () => {
      const fakeId = '01ARZ3NDEKTSV4RRFFQ69G5FAV'; // valid 26-char ULID, not in DB
      const res = await request(app.getHttpServer())
        .delete(photosUrl(`/${fakeId}`))
        .set(auth(fixtures.accessToken))
        .expect(404);

      expect(res.body.error.code).toBe('PHOTO_NOT_FOUND');
    });
  });

  // ---------------------------------------------------------------------------
  // POST /api/invitations/:id/photos/:photoId/likes
  // ---------------------------------------------------------------------------
  describe('POST /photos/:photoId/likes (좋아요 토글)', () => {
    it('좋아요 추가 → { liked: true, likeCount: 1 }', async () => {
      const photo = await insertPhoto(db, fixtures.invitationId, fixtures.participantId);

      const res = await request(app.getHttpServer())
        .post(photosUrl(`/${photo.id}/likes`))
        .set(auth(fixtures.accessToken))
        .expect(200);

      expect(res.body.data).toMatchObject({ liked: true, likeCount: 1 });
    });

    it('다시 호출 → 좋아요 취소 { liked: false, likeCount: 0 }', async () => {
      const photo = await insertPhoto(db, fixtures.invitationId, fixtures.participantId);

      await request(app.getHttpServer())
        .post(photosUrl(`/${photo.id}/likes`))
        .set(auth(fixtures.accessToken))
        .expect(200);

      const res = await request(app.getHttpServer())
        .post(photosUrl(`/${photo.id}/likes`))
        .set(auth(fixtures.accessToken))
        .expect(200);

      expect(res.body.data).toMatchObject({ liked: false, likeCount: 0 });
    });
  });
});
