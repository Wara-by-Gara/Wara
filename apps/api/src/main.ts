import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ResponseFormatInterceptor } from './common/interceptors/response-format.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  // JWT_SECRET 없으면 서버 시작 즉시 종료
  // 하드코딩된 폴백 시크릿으로 실수로 배포되는 것을 방지
  if (!process.env.JWT_ACCESS_SECRET) {
    throw new Error('[보안] JWT_ACCESS_SECRET 환경변수가 설정되지 않았습니다. .env 파일을 확인하세요.');
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

  // 에러 응답을 { success: false, error, meta } 형식으로 통일
  // Nest 내부에서 useGlobalFilters 배열을 reverse 후 first-match로 선택하므로,
  // 더 구체적인 필터(HttpExceptionFilter)를 "마지막"에 등록해야 우선 매칭됨.
  // - HttpException → HttpExceptionFilter (구체 매칭)
  // - 그 외 모든 예외 → AllExceptionsFilter (@Catch() catch-all)
  app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
