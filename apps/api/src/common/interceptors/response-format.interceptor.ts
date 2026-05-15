import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request } from 'express';
import { Observable, map } from 'rxjs';
import { resolveRequestId } from '../filters/error-response.helper';

/**
 * 응답 envelope 자동 래핑 인터셉터.
 *
 * 모든 성공 응답을 와라 표준 envelope으로 통일:
 *   `{ success: true, data, meta: { requestId, timestamp } }`
 *
 * - Service가 `undefined` 반환 시(예: 204): `data` 키 생략.
 * - `meta.requestId`는 `x-request-id` 헤더 echo 또는 새 UUID. 실패 응답(helper)과 동일 로직.
 *
 * main.ts에서 글로벌 등록.
 */
@Injectable()
export class ResponseFormatInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const meta = {
      requestId: resolveRequestId(request),
      timestamp: new Date().toISOString(),
    };
    return next.handle().pipe(
      map((data) =>
        data === undefined ? { success: true, meta } : { success: true, data, meta },
      ),
    );
  }
}
