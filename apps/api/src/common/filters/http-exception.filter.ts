import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const isObject =
      typeof exceptionResponse === 'object' && exceptionResponse !== null;

    const code = isObject ? (exceptionResponse as Record<string, unknown>).code : undefined;
    const message = isObject
      ? (exceptionResponse as Record<string, unknown>).message ?? exception.message
      : exceptionResponse;
    const details = isObject ? (exceptionResponse as Record<string, unknown>).details : undefined;

    response.status(status).json({
      success: false,
      statusCode: status,
      error: {
        ...(code ? { code } : {}),
        message,
        ...(details ? { details } : {}),
      },
    });
  }
}
