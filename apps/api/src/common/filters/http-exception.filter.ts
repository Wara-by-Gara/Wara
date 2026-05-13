import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';

/**
 * 전역 HTTP 예외 필터
 * 성공: { success: true, data: ... }  ← ResponseFormatInterceptor가 처리
 * 실패: { success: false, statusCode, message }  ← 이 필터가 처리
 *
 * main.ts에서 app.useGlobalFilters(new HttpExceptionFilter()) 로 등록
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any).message ?? exception.message;

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
    });
  }
}
