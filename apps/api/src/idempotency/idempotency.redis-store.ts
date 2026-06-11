import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.constants';
import {
  IDEMPOTENCY_KEY_PREFIX,
  IDEMPOTENCY_LOCK_PLACEHOLDER,
  IDEMPOTENCY_TTL_SECONDS,
} from './idempotency.constants';

export type CachedResponse = {
  status: number;
  body: unknown;
};

export type IdempotencyLookup = CachedResponse | 'in_progress' | null;

export type IdempotencyKeyParts = {
  scope: string;
  method: string;
  path: string;
  idempotencyKey: string;
};

function buildKey(parts: IdempotencyKeyParts): string {
  return `${IDEMPOTENCY_KEY_PREFIX}:${parts.scope}:${parts.method}:${parts.path}:${parts.idempotencyKey}`;
}

@Injectable()
export class IdempotencyRedisStore {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  // SETNX placeholder. true=락 획득, false=이미 누군가 처리 중이거나 캐시 존재.
  async tryLock(parts: IdempotencyKeyParts): Promise<boolean> {
    const res = await this.redis.set(
      buildKey(parts),
      IDEMPOTENCY_LOCK_PLACEHOLDER,
      'EX',
      IDEMPOTENCY_TTL_SECONDS,
      'NX',
    );
    return res === 'OK';
  }

  async find(parts: IdempotencyKeyParts): Promise<IdempotencyLookup> {
    const raw = await this.redis.get(buildKey(parts));
    if (!raw) return null;
    if (raw === IDEMPOTENCY_LOCK_PLACEHOLDER) return 'in_progress';
    try {
      return JSON.parse(raw) as CachedResponse;
    } catch {
      return null;
    }
  }

  // 락 placeholder를 실제 응답으로 덮어쓰면서 TTL 갱신.
  async saveResponse(parts: IdempotencyKeyParts, response: CachedResponse): Promise<void> {
    await this.redis.set(
      buildKey(parts),
      JSON.stringify(response),
      'EX',
      IDEMPOTENCY_TTL_SECONDS,
    );
  }

  // 핸들러 실패/비-2xx 시 락만 제거 — 재시도 가능하도록.
  async releaseLock(parts: IdempotencyKeyParts): Promise<void> {
    await this.redis.del(buildKey(parts));
  }
}
