import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * 응답 형식 자동 래핑 인터셉터
 * SKILL Rule: Service에서 데이터만 return하면 interceptor가 자동으로 감쌈
 *
 * 원본 Service 응답:
 *   return { id: '123', name: 'John' };
 *
 * 최종 HTTP 응답:
 *   { success: true, data: { id: '123', name: 'John' } }
 *
 * main.ts에서 글로벌 등록:
 *   app.useGlobalInterceptors(new ResponseFormatInterceptor());
 */
@Injectable()
export class ResponseFormatInterceptor implements NestInterceptor {
  intercept(_: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => ({
        success: true,
        data,
      })),
    );
  }
}
