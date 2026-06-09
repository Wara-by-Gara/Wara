import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.constants';

export type StoredRefreshToken = {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  deviceInfo: string | null;
  ipAddress: string | null;
  revokedAt: Date | null;
};

export type SaveRefreshTokenParams = {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  deviceInfo?: string | null;
  ipAddress?: string | null;
};

const REVOKED_GRACE_SECONDS = 60 * 60; // 1h — SUSPICIOUS 감지용

function tokenKey(hash: string): string {
  return `refresh:token:${hash}`;
}

function revokedKey(hash: string): string {
  return `refresh:revoked:${hash}`;
}

function userKey(userId: string): string {
  return `refresh:user:${userId}`;
}

@Injectable()
export class AuthRedisStore {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async save(params: SaveRefreshTokenParams): Promise<void> {
    const ttlSeconds = Math.max(
      1,
      Math.floor((params.expiresAt.getTime() - Date.now()) / 1000),
    );
    const key = tokenKey(params.tokenHash);
    const user = userKey(params.userId);
    await this.redis
      .multi()
      .hset(key, {
        userId: params.userId,
        expiresAt: params.expiresAt.toISOString(),
        deviceInfo: params.deviceInfo ?? '',
        ipAddress: params.ipAddress ?? '',
      })
      .expire(key, ttlSeconds)
      .sadd(user, params.tokenHash)
      .expire(user, ttlSeconds)
      .exec();
  }

  /** 활성 토큰 → revoke + 데이터 반환 (atomic). 이미 없거나 만료면 null. */
  async revokeIfValid(tokenHash: string): Promise<StoredRefreshToken | null> {
    const key = tokenKey(tokenHash);
    const exec = await this.redis.multi().hgetall(key).del(key).exec();
    if (!exec) return null;
    const raw = (exec[0]?.[1] ?? {}) as Record<string, string | undefined>;
    if (!raw.userId) return null;

    const stored: StoredRefreshToken = {
      userId: raw.userId,
      tokenHash,
      expiresAt: new Date(raw.expiresAt ?? 0),
      deviceInfo: raw.deviceInfo || null,
      ipAddress: raw.ipAddress || null,
      revokedAt: null,
    };

    await this.redis
      .multi()
      .set(revokedKey(tokenHash), stored.userId, 'EX', REVOKED_GRACE_SECONDS)
      .srem(userKey(stored.userId), tokenHash)
      .exec();
    return stored;
  }

  /** revoked grace 포함 토큰 조회. SUSPICIOUS 감지용. */
  async findByHash(tokenHash: string): Promise<StoredRefreshToken | null> {
    const active = (await this.redis.hgetall(tokenKey(tokenHash))) as Record<
      string,
      string | undefined
    >;
    if (active.userId) {
      return {
        userId: active.userId,
        tokenHash,
        expiresAt: new Date(active.expiresAt ?? 0),
        deviceInfo: active.deviceInfo || null,
        ipAddress: active.ipAddress || null,
        revokedAt: null,
      };
    }
    const revokedUserId = await this.redis.get(revokedKey(tokenHash));
    if (revokedUserId) {
      return {
        userId: revokedUserId,
        tokenHash,
        expiresAt: new Date(0),
        deviceInfo: null,
        ipAddress: null,
        revokedAt: new Date(),
      };
    }
    return null;
  }

  async revokeOne(userId: string, tokenHash: string): Promise<void> {
    const key = tokenKey(tokenHash);
    const exists = await this.redis.exists(key);
    if (exists === 0) return;
    await this.redis
      .multi()
      .del(key)
      .set(revokedKey(tokenHash), userId, 'EX', REVOKED_GRACE_SECONDS)
      .srem(userKey(userId), tokenHash)
      .exec();
  }

  async revokeAllByUserId(userId: string): Promise<void> {
    const user = userKey(userId);
    const hashes = await this.redis.smembers(user);
    if (hashes.length === 0) return;
    const pipeline = this.redis.multi();
    for (const hash of hashes) {
      pipeline.del(tokenKey(hash));
      pipeline.set(revokedKey(hash), userId, 'EX', REVOKED_GRACE_SECONDS);
    }
    pipeline.del(user);
    await pipeline.exec();
  }
}
