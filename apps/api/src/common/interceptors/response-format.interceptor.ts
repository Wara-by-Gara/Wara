import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { isPaginatedResult } from '../types/paginated-result.type';

/**
 * 응답 envelope 자동 래핑 인터셉터.
 *
 * - Service가 단일 데이터를 반환:
 *     { id: '123' }  →  { success: true, data: { id: '123' } }
 *
 * - Service가 PaginatedResult<T>를 반환 (cursor 페이지네이션):
 *     { data: [...], meta: { nextCursor, hasNext, total? } }
 *       →  { success: true, data: [...], meta: { ... } }
 *
 * main.ts에서 글로벌 등록 (`app.useGlobalInterceptors`).
 */
@Injectable()
export class ResponseFormatInterceptor implements NestInterceptor {
  intercept(_: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((value) => {
        if (isPaginatedResult(value)) {
          return { success: true, data: value.data, meta: value.meta };
        }
        return { success: true, data: value };
      }),
    );
  }
}
