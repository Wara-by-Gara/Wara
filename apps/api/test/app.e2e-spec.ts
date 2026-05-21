import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { ResponseFormatInterceptor } from '../src/common/interceptors/response-format.interceptor';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalInterceptors(new ResponseFormatInterceptor());
    app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth', () => {
    it('POST /api/v1/auth/refresh — body 없음 → 400 VALIDATION_ERROR', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({})
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('POST /api/v1/auth/refresh — 잘못된 refresh token → 401 TOKEN_INVALID', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token-value' })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error?.code).toBe('TOKEN_INVALID');
    });
  });

  describe('Auth Guard', () => {
    it('POST /api/v1/invitations — Authorization 헤더 없음 → 401', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/invitations')
        .send({ title: '테스트 초대장' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('POST /api/v1/invitations — malformed JWT (Bearer abc) → 401', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/invitations')
        .set('Authorization', 'Bearer invalid.jwt.token')
        .send({ title: '테스트 초대장' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('Validation', () => {
    it('POST /api/v1/auth/refresh — null body → 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send(null)
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });
});
