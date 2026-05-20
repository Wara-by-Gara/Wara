import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { ResponseFormatInterceptor } from './common/interceptors/response-format.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  if (!process.env.JWT_ACCESS_SECRET) {
    throw new Error('[보안] JWT_ACCESS_SECRET 환경변수가 설정되지 않았습니다. .env 파일을 확인하세요.');
  }
  if (!process.env.FRONTEND_URL) {
    throw new Error('[보안] FRONTEND_URL 환경변수가 설정되지 않았습니다. .env 파일을 확인하세요.');
  }

  const app = await NestFactory.create(AppModule);

  // API 버전 관리
  app.setGlobalPrefix('api/v1');

  // 프론트/백 다른 도메인 배포 → credentials 포함 CORS 허용
  app.enableCors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 모든 응답을 { success: true, data: ... } 형식으로 자동 래핑
  app.useGlobalInterceptors(new ResponseFormatInterceptor());

  // HttpException → HttpExceptionFilter, 그 외 → AllExceptionsFilter
  app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());

  // Cookie 파싱: Refresh Token 쿠키 읽기
  const cookieSecret = process.env.COOKIE_SECRET;
  if (!cookieSecret) {
    throw new Error('[보안] COOKIE_SECRET 환경변수가 설정되지 않았습니다. .env 파일을 확인하세요.');
  }
  app.use(cookieParser(cookieSecret));

  // Swagger: 프로덕션 외 환경에서만 노출
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('WARA API')
      .setDescription('WARA 서비스 REST API 문서')
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
