/**
 * Photos S3 Real Integration E2E Tests
 *
 * 목적:
 *   - 실제 AWS S3로 업로드/다운로드 시 원본 파일 크기가 변형 없이 보존되는지 검증
 *   - 각 단계별 응답 속도가 허용 기준 이내인지 측정
 *
 * 사전 조건:
 *   - Docker postgres + redis 실행 중 (docker-compose up)
 *   - .env.development에 AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET 설정
 *
 * 실행:
 *   cd apps/api
 *   npx jest --config test/jest-e2e.json --testPathPattern photos-s3-real
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getQueueToken } from '@nestjs/bullmq';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { KakaoLocalService } from '../src/locations/kakao-local.service';
import { DRIZZLE, type DrizzleDB } from '../src/database/database.module';
import { IMAGE_PROCESSING_QUEUE } from '../src/queues/queue.constants';
import { ImageThumbnailProcessor } from '../src/image-processing/image-thumbnail.processor';
import { S3Service } from '../src/s3/s3.service';
import { ResponseFormatInterceptor } from '../src/common/interceptors/response-format.interceptor';
import { DbTimeInterceptor } from '../src/common/interceptors/db-time.interceptor';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import {
  createTestFixtures,
  cleanPhotos,
  cleanAllFixtures,
  type TestFixtures,
} from './helpers/db-fixtures';
import { deleteS3TestObjects } from './helpers/s3-test-cleanup';

// 100KB JPEG-like buffer (S3는 바이트 검증 안 함)
function makeTestImageBuffer(sizeBytes = 100 * 1024): Buffer {
  const buf = Buffer.alloc(sizeBytes, 0xab);
  buf[0] = 0xff; buf[1] = 0xd8; buf[2] = 0xff; // JPEG SOI + APP marker
  buf[sizeBytes - 2] = 0xff; buf[sizeBytes - 1] = 0xd9; // EOI
  return buf;
}

describe('Photos S3 Real Integration (e2e)', () => {
  let app: INestApplication<App>;
  let db: DrizzleDB;
  let fixtures: TestFixtures;
  let s3Service: S3Service;
  let uploadedKeys: string[] = [];

  const TEST_IMAGE = makeTestImageBuffer(100 * 1024); // 102400 bytes

  function photosUrl(suffix = '') {
    return `/api/invitations/${fixtures.invitationId}/photos${suffix}`;
  }

  function auth(token: string) {
    return { Authorization: `Bearer ${token}` };
  }

  beforeAll(async () => {
    jest.setTimeout(60000);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      // S3_CLIENT / S3Service 오버라이드 없음 → 실제 AWS 자격증명 사용
      .overrideProvider(KakaoLocalService)
      .useValue({ reverseGeocode: jest.fn().mockResolvedValue(null) })
      .overrideProvider(getQueueToken(IMAGE_PROCESSING_QUEUE))
      .useValue({
        add: jest.fn().mockResolvedValue({ id: 'fake-job-id' }),
        opts: { connection: { host: 'localhost', port: 6379 } },
      })
      .overrideProvider(ImageThumbnailProcessor)
      .useValue({})
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    app.useGlobalInterceptors(new ResponseFormatInterceptor(), new DbTimeInterceptor());
    app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());
    await app.init();

    db = moduleFixture.get<DrizzleDB>(DRIZZLE);
    s3Service = moduleFixture.get(S3Service);
    const jwtService = moduleFixture.get(JwtService);
    fixtures = await createTestFixtures(db, jwtService);
  });

  afterEach(async () => {
    await cleanPhotos(db, fixtures.invitationId);
    await deleteS3TestObjects(s3Service, uploadedKeys);
    uploadedKeys = [];
  });

  afterAll(async () => {
    await cleanAllFixtures(db, fixtures.invitationId, fixtures.userId, fixtures.guestUserId);
    await app.close();
  });

  // ---------------------------------------------------------------------------
  // 원본 크기 유지
  // ---------------------------------------------------------------------------
  describe('원본 크기 유지', () => {
    it('S3 업로드 후 headObject.contentLength === 원본 바이트 수', async () => {
      // 1. presigned URL 발급
      const presignRes = await request(app.getHttpServer())
        .post(photosUrl('/presigned-url'))
        .set(auth(fixtures.accessToken))
        .send({ fileName: 'test.jpg', contentType: 'image/jpeg' })
        .expect(201);

      const { presignedUrl, key } = presignRes.body.data;
      uploadedKeys.push(key);

      // 2. 실제 S3에 PUT
      const putRes = await fetch(presignedUrl, {
        method: 'PUT',
        body: TEST_IMAGE,
        headers: { 'Content-Type': 'image/jpeg' },
      });
      expect(putRes.ok).toBe(true);

      // 3. 서버에 등록
      await request(app.getHttpServer())
        .post(photosUrl())
        .set(auth(fixtures.accessToken))
        .send({ imageKey: key, fileSize: TEST_IMAGE.byteLength })
        .expect(201);

      // 4. S3 headObject로 크기 검증
      const { contentLength } = await s3Service.headObject(key);
      expect(contentLength).toBe(TEST_IMAGE.byteLength);
    });

    it('다운로드 presigned URL로 받은 바이트 수 === 원본 크기', async () => {
      // photo 등록
      const presignRes = await request(app.getHttpServer())
        .post(photosUrl('/presigned-url'))
        .set(auth(fixtures.accessToken))
        .send({ fileName: 'test.jpg', contentType: 'image/jpeg' });
      const { presignedUrl, key } = presignRes.body.data;
      uploadedKeys.push(key);

      await fetch(presignedUrl, {
        method: 'PUT',
        body: TEST_IMAGE,
        headers: { 'Content-Type': 'image/jpeg' },
      });

      const registerRes = await request(app.getHttpServer())
        .post(photosUrl())
        .set(auth(fixtures.accessToken))
        .send({ imageKey: key, fileSize: TEST_IMAGE.byteLength });
      const photoId: string = registerRes.body.data.id;

      // 다운로드 URL 발급
      const dlRes = await request(app.getHttpServer())
        .get(photosUrl(`/download?ids=${photoId}`))
        .set(auth(fixtures.accessToken))
        .expect(200);
      const { url } = dlRes.body.data[0];

      // 실제 S3에서 다운로드
      const response = await fetch(url);
      expect(response.ok).toBe(true);
      const downloaded = await response.arrayBuffer();

      expect(downloaded.byteLength).toBe(TEST_IMAGE.byteLength);
    });

    it('imageKey와 thumbnailKey는 서로 다른 경로 (원본 덮어쓰지 않음)', async () => {
      const presignRes = await request(app.getHttpServer())
        .post(photosUrl('/presigned-url'))
        .set(auth(fixtures.accessToken))
        .send({ fileName: 'test.jpg', contentType: 'image/jpeg' });
      const { presignedUrl, key } = presignRes.body.data;
      uploadedKeys.push(key);

      await fetch(presignedUrl, {
        method: 'PUT',
        body: TEST_IMAGE,
        headers: { 'Content-Type': 'image/jpeg' },
      });

      const registerRes = await request(app.getHttpServer())
        .post(photosUrl())
        .set(auth(fixtures.accessToken))
        .send({ imageKey: key, fileSize: TEST_IMAGE.byteLength })
        .expect(201);

      const photo = registerRes.body.data;
      // thumbnailKey는 워커가 비동기로 생성 → 등록 직후에는 null
      // imageKey는 원본 경로 그대로
      expect(photo.imageKey).toBe(key);
      expect(photo.thumbnailKey).toBeNull();
      expect(photo.imageKey).not.toEqual(photo.thumbnailKey);
    });
  });

  // ---------------------------------------------------------------------------
  // 속도 측정
  // ---------------------------------------------------------------------------
  describe('속도', () => {
    it('presigned URL 발급 API < 300ms', async () => {
      const t0 = Date.now();
      await request(app.getHttpServer())
        .post(photosUrl('/presigned-url'))
        .set(auth(fixtures.accessToken))
        .send({ fileName: 'bench.jpg', contentType: 'image/jpeg' })
        .expect(201);
      const elapsed = Date.now() - t0;
      expect(elapsed).toBeLessThan(300);
    });

    it('photo 등록 API (DB write) < 500ms', async () => {
      const presignRes = await request(app.getHttpServer())
        .post(photosUrl('/presigned-url'))
        .set(auth(fixtures.accessToken))
        .send({ fileName: 'bench.jpg', contentType: 'image/jpeg' });
      const { presignedUrl, key } = presignRes.body.data;
      uploadedKeys.push(key);

      await fetch(presignedUrl, {
        method: 'PUT',
        body: TEST_IMAGE,
        headers: { 'Content-Type': 'image/jpeg' },
      });

      const t0 = Date.now();
      await request(app.getHttpServer())
        .post(photosUrl())
        .set(auth(fixtures.accessToken))
        .send({ imageKey: key, fileSize: TEST_IMAGE.byteLength })
        .expect(201);
      const elapsed = Date.now() - t0;
      expect(elapsed).toBeLessThan(500);
    });

    it('S3 실제 업로드 100KB < 5000ms', async () => {
      const presignRes = await request(app.getHttpServer())
        .post(photosUrl('/presigned-url'))
        .set(auth(fixtures.accessToken))
        .send({ fileName: 'bench.jpg', contentType: 'image/jpeg' });
      const { presignedUrl, key } = presignRes.body.data;
      uploadedKeys.push(key);

      const t0 = Date.now();
      const putRes = await fetch(presignedUrl, {
        method: 'PUT',
        body: TEST_IMAGE,
        headers: { 'Content-Type': 'image/jpeg' },
      });
      const elapsed = Date.now() - t0;

      expect(putRes.ok).toBe(true);
      expect(elapsed).toBeLessThan(5000);
    });

    it('다운로드 URL 발급 API < 300ms', async () => {
      // 사진 1장 등록
      const presignRes = await request(app.getHttpServer())
        .post(photosUrl('/presigned-url'))
        .set(auth(fixtures.accessToken))
        .send({ fileName: 'bench.jpg', contentType: 'image/jpeg' });
      const { presignedUrl, key } = presignRes.body.data;
      uploadedKeys.push(key);

      await fetch(presignedUrl, {
        method: 'PUT',
        body: TEST_IMAGE,
        headers: { 'Content-Type': 'image/jpeg' },
      });

      const registerRes = await request(app.getHttpServer())
        .post(photosUrl())
        .set(auth(fixtures.accessToken))
        .send({ imageKey: key, fileSize: TEST_IMAGE.byteLength });
      const photoId: string = registerRes.body.data.id;

      const t0 = Date.now();
      await request(app.getHttpServer())
        .get(photosUrl(`/download?ids=${photoId}`))
        .set(auth(fixtures.accessToken))
        .expect(200);
      const elapsed = Date.now() - t0;
      expect(elapsed).toBeLessThan(300);
    });

    it('S3 실제 다운로드 100KB < 3000ms', async () => {
      // 사진 1장 등록
      const presignRes = await request(app.getHttpServer())
        .post(photosUrl('/presigned-url'))
        .set(auth(fixtures.accessToken))
        .send({ fileName: 'bench.jpg', contentType: 'image/jpeg' });
      const { presignedUrl, key } = presignRes.body.data;
      uploadedKeys.push(key);

      await fetch(presignedUrl, {
        method: 'PUT',
        body: TEST_IMAGE,
        headers: { 'Content-Type': 'image/jpeg' },
      });

      const registerRes = await request(app.getHttpServer())
        .post(photosUrl())
        .set(auth(fixtures.accessToken))
        .send({ imageKey: key, fileSize: TEST_IMAGE.byteLength });
      const photoId: string = registerRes.body.data.id;

      const dlRes = await request(app.getHttpServer())
        .get(photosUrl(`/download?ids=${photoId}`))
        .set(auth(fixtures.accessToken));
      const { url } = dlRes.body.data[0];

      const t0 = Date.now();
      const response = await fetch(url);
      await response.arrayBuffer(); // body 다 읽어야 정확한 시간 측정
      const elapsed = Date.now() - t0;

      expect(elapsed).toBeLessThan(3000);
    });
  });
});
