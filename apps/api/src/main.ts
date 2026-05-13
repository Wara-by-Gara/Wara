import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ResponseFormatInterceptor } from './common/interceptors/response-format.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  // JWT_SECRET 없으면 서버 시작 즉시 종료
  // 하드코딩된 폴백 시크릿으로 실수로 배포되는 것을 방지
  if (!process.env.JWT_SECRET) {
    throw new Error('[보안] JWT_SECRET 환경변수가 설정되지 않았습니다. .env 파일을 확인하세요.');
  }

  const app = await NestFactory.create(AppModule);

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

  // 모든 응답을 { success: true, data: ... } 형식으로 자동 래핑
  app.useGlobalInterceptors(new ResponseFormatInterceptor());

  // 에러 응답을 { success: false, statusCode, message } 형식으로 통일
  // AllExceptionsFilter가 먼저 실행되어 모든 예외 처리
  // HttpExceptionFilter는 HttpException만 처리 (더 상세한 로직)
  app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
