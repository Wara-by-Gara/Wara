// Sentry.init은 다른 모듈 import보다 먼저 실행되어야 자동 계측이 동작 (공식 가이드).
// prod + DSN 둘 다 있을 때만 init, 아니면 no-op.
import './sentry/instrument';
import { NestFactory } from '@nestjs/core';
import { ForbiddenException, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NextFunction, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import { Logger as PinoLogger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { WaraIoAdapter } from './adapters/socket-io.adapter';
import { DbTimeInterceptor } from './common/interceptors/db-time.interceptor';
import { ResponseFormatInterceptor } from './common/interceptors/response-format.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ErrorCode } from './common/constants/error-codes';

async function bootstrap() {
  // JWT_SECRET 없으면 서버 시작 즉시 종료
  // 하드코딩된 폴백 시크릿으로 실수로 배포되는 것을 방지
  if (!process.env.JWT_ACCESS_SECRET) {
    throw new Error('[보안] JWT_ACCESS_SECRET 환경변수가 설정되지 않았습니다. .env 파일을 확인하세요.');
  }
  // HS256 권장 최소 길이 32바이트(256bit). 짧으면 brute force 위험 — prod 진입 차단.
  if (process.env.JWT_ACCESS_SECRET.length < 32) {
    throw new Error(
      `[보안] JWT_ACCESS_SECRET 길이가 ${process.env.JWT_ACCESS_SECRET.length}자입니다. 최소 32자(256bit) 이상이어야 합니다.`,
    );
  }
  if (!process.env.FRONTEND_URL) {
    throw new Error('[보안] FRONTEND_URL 환경변수가 설정되지 않았습니다. .env 파일을 확인하세요.');
  }
  if (!process.env.COOKIE_SECRET) {
    throw new Error('[보안] COOKIE_SECRET 환경변수가 설정되지 않았습니다. .env 파일을 확인하세요.');
  }

  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(PinoLogger));

  // helmet 기본 옵션 (CSP 포함). JSON API라 CSP 영향 없음.
  app.use(helmet());

  // Swagger UI(/api-docs)는 dev에서만 마운트되며 inline script/style 사용 →
  // 해당 경로 한정으로 CSP 헤더 제거. helmet 미들웨어 다음에 등록되어 후처리.
  if (process.env.NODE_ENV !== 'production') {
    app.use('/api-docs', (_req: Request, res: Response, next: NextFunction) => {
      res.removeHeader('Content-Security-Policy');
      next();
    });
  }

  // 응답 gzip 압축
  app.use(compression());

  app.setGlobalPrefix('api');

  // 프론트/백 다른 도메인 배포 → credentials 포함 CORS 허용
  // X-DB-Time은 dev에서 브라우저 콘솔/네트워크 패널 확인용으로 노출
  app.enableCors({
    origin: process.env.FRONTEND_URL?.replace(/\/$/, ''),
    credentials: true,
    exposedHeaders: process.env.NODE_ENV !== 'production'
      ? ['X-DB-Time', 'X-DB-Query-Count']
      : [],
  });

  // DTO 검증: class-validator 데코레이터(@IsString 등) 실행
  // whitelist: DTO에 없는 필드 제거
  // transform: string → number 자동 변환 ("모든 걸 바꿔라"가 아니라 "DTO 타입에 맞게 바꿔라")
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // DB 시간 측정 — handler 실행을 ALS 컨텍스트로 감싸고 응답 직전 X-DB-Time 헤더 set (dev 환경만).
  // ResponseFormatInterceptor보다 먼저 등록해서 응답 직렬화까지 컨텍스트 안에 포함.
  // 모든 응답을 { success: true, data: ... } 형식으로 자동 래핑
  app.useGlobalInterceptors(new DbTimeInterceptor(), new ResponseFormatInterceptor());

  // 에러 응답을 { success: false, error, meta } 형식으로 통일
  // Nest 내부에서 useGlobalFilters 배열을 reverse 후 first-match로 선택하므로,
  // 더 구체적인 필터(HttpExceptionFilter)를 "마지막"에 등록해야 우선 매칭됨.
  // - HttpException → HttpExceptionFilter (구체 매칭)
  // - 그 외 모든 예외 → AllExceptionsFilter (@Catch() catch-all)
  app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());

  // Cookie 파싱: Refresh Token 쿠키 읽기
  const cookieSecret = process.env.COOKIE_SECRET;
  if (!cookieSecret) {
    throw new Error('[보안] COOKIE_SECRET 환경변수가 설정되지 않았습니다. .env 파일을 확인하세요.');
  }
  app.use(cookieParser(cookieSecret));

  // Socket.IO CORS는 namespace가 아닌 서버 레벨에서만 설정 가능.
  // 모든 gateway가 ConfigService 기반 origin을 공유하도록 어댑터에서 일괄 적용.
  app.useWebSocketAdapter(new WaraIoAdapter(app));

  // CSRF 방어 — 쿠키 인증 요청에만 적용. 모바일(Bearer 헤더 인증)은 면제.
  // 변경 작업(POST/PUT/PATCH/DELETE)에서 Origin/Referer가 FRONTEND_URL과 일치해야 함.
  // GET은 OAuth callback 등 외부 redirect 호환을 위해 검증하지 않음.
  const allowedOrigin = process.env.FRONTEND_URL!.replace(/\/$/, '');
  app.use((req: Request, res: Response, next: NextFunction) => {
    const method = req.method.toUpperCase();
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next();
    }
    const cookies = req.cookies as Record<string, string> | undefined;
    const hasCookieAuth = !!cookies?.accessToken || !!cookies?.refreshToken;
    if (!hasCookieAuth) {
      return next();
    }
    const origin = req.headers.origin;
    const referer = req.headers.referer;
    const isAllowed =
      origin === allowedOrigin || referer?.startsWith(allowedOrigin) === true;
    if (!isAllowed) {
      return next(
        new ForbiddenException({
          code: ErrorCode.CSRF_INVALID_ORIGIN,
          message: '요청 출처가 유효하지 않습니다.',
        }),
      );
    }
    next();
  });

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('WARA API')
      .setVersion('0.7')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document);
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
