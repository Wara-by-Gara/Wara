import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { sendErrorResponse } from './error-response.helper';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    sendErrorResponse(host, exception.getStatus(), exception.getResponse());
  }
}
