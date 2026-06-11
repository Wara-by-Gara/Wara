import {
  CallHandler,
  ConflictException,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { from, Observable, of, throwError } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { ErrorCode } from '../common/constants/error-codes';
import { IDEMPOTENCY_KEY_HEADER } from './idempotency.constants';
import {
  IdempotencyKeyParts,
  IdempotencyRedisStore,
} from './idempotency.redis-store';

const MUTATING_METHODS = new Set(['POST', 'PATCH', 'DELETE']);

type AuthedRequest = Request & { user?: { id?: string } };

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private readonly store: IdempotencyRedisStore) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }
    const http = context.switchToHttp();
    const req = http.getRequest<AuthedRequest>();
    const res = http.getResponse<Response>();

    if (!MUTATING_METHODS.has(req.method)) {
      return next.handle();
    }

    const idempotencyKey = req.header(IDEMPOTENCY_KEY_HEADER);
    // 헤더 없으면 기존 동작 그대로 — 점진적 채택.
    if (!idempotencyKey) {
      return next.handle();
    }

    const parts: IdempotencyKeyParts = {
      scope: req.user?.id ?? 'anon',
      method: req.method,
      path: req.path,
      idempotencyKey,
    };

    return from(this.store.find(parts)).pipe(
      switchMap((cached) => {
        if (cached === 'in_progress') {
          return throwError(
            () => new ConflictException(ErrorCode.IDEMPOTENCY_IN_PROGRESS),
          );
        }
        if (cached) {
          res.status(cached.status);
          return of(cached.body);
        }
        return from(this.store.tryLock(parts)).pipe(
          switchMap((locked) => {
            if (!locked) {
              // find~tryLock 사이의 race — 다른 요청이 먼저 락 잡음.
              return throwError(
                () => new ConflictException(ErrorCode.IDEMPOTENCY_IN_PROGRESS),
              );
            }
            return next.handle().pipe(
              tap((body) => {
                // 2xx만 캐시. 비-2xx는 락 해제로 재시도 가능 상태로 복귀.
                const status = res.statusCode;
                if (status >= 200 && status < 300) {
                  void this.store.saveResponse(parts, { status, body });
                } else {
                  void this.store.releaseLock(parts);
                }
              }),
              catchError((err) =>
                from(this.store.releaseLock(parts)).pipe(
                  switchMap(() => throwError(() => err)),
                ),
              ),
            );
          }),
        );
      }),
    );
  }
}
