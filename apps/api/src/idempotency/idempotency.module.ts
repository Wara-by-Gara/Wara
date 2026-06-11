import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { IdempotencyInterceptor } from './idempotency.interceptor';
import { IdempotencyRedisStore } from './idempotency.redis-store';

@Module({
  providers: [
    IdempotencyRedisStore,
    { provide: APP_INTERCEPTOR, useClass: IdempotencyInterceptor },
  ],
  exports: [IdempotencyRedisStore],
})
export class IdempotencyModule {}
