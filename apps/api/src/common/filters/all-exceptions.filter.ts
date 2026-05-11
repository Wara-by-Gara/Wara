import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';

/**
 * 전역 예외 필터
 *
 * @Catch() 인자 없음 = 모든 예외를 처리
 * HttpException: 의도적 예외 (ValidationError, ForbiddenException 등)
 * 기타 (DB 연결 실패, 런타임 에러): 500으로 응답
 *
 * main.ts에서 app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter())
 * 순서: AllExceptionsFilter(넓음) → HttpExceptionFilter(좁음)
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? this.extractMessage(exception.getResponse())
        : exception instanceof Error
          ? exception.message
          : 'Internal server error';

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
    });
  }

  private extractMessage(response: unknown): string {
    if (typeof response === 'string') return response;
    if (typeof response === 'object' && response !== null && 'message' in response) {
      return (response as { message?: string }).message ?? 'Unknown error';
    }
    return 'Unknown error';
  }
}
