import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Response } from 'express';
import { Observable, tap } from 'rxjs';
import { dbTimeStore } from '../../database/db-time-store';

const EXPOSE_HEADER = process.env.NODE_ENV !== 'production';

@Injectable()
export class DbTimeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = { totalMs: 0, queryCount: 0 };
    const res = context.switchToHttp().getResponse<Response>();
    return new Observable((subscriber) => {
      dbTimeStore.run(ctx, () => {
        const setHeader = () => {
          if (!EXPOSE_HEADER || res.headersSent) return;
          res.setHeader('X-DB-Time', ctx.totalMs.toFixed(1));
          res.setHeader('X-DB-Query-Count', String(ctx.queryCount));
        };
        next
          .handle()
          .pipe(tap({ next: setHeader, error: setHeader }))
          .subscribe(subscriber);
      });
    });
  }
}
