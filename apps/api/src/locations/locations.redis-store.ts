import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.constants';

export type GpsRedisValue = {
  lat: number;
  lng: number;
  accuracy: number;
  isArrived: boolean;
  updatedAt: string; // ISO
};

const LOCATION_TTL_SECONDS = 24 * 60 * 60; // 24h (이벤트 종료 + 1h 보장 위해 보수적)

function hashKey(invitationId: string): string {
  return `location:${invitationId}`;
}

function arrivedKey(invitationId: string, participantId: string): string {
  return `location:arrived:${invitationId}:${participantId}`;
}

@Injectable()
export class LocationsRedisStore {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async upsert(
    invitationId: string,
    participantId: string,
    value: GpsRedisValue,
  ): Promise<void> {
    const key = hashKey(invitationId);
    await this.redis
      .multi()
      .hset(key, participantId, JSON.stringify(value))
      .expire(key, LOCATION_TTL_SECONDS)
      .exec();
  }

  async findOne(
    invitationId: string,
    participantId: string,
  ): Promise<GpsRedisValue | null> {
    const json = await this.redis.hget(hashKey(invitationId), participantId);
    if (!json) return null;
    try {
      return JSON.parse(json) as GpsRedisValue;
    } catch {
      return null;
    }
  }

  async findAllByInvitation(
    invitationId: string,
  ): Promise<Map<string, GpsRedisValue>> {
    const raw = await this.redis.hgetall(hashKey(invitationId));
    const map = new Map<string, GpsRedisValue>();
    for (const [participantId, json] of Object.entries(raw)) {
      try {
        map.set(participantId, JSON.parse(json) as GpsRedisValue);
      } catch {
        // 손상된 entry는 skip
      }
    }
    return map;
  }

  /** 도착 처리를 한 번만 발생시키기 위한 단발 lock. true=내가 첫 도착 */
  async claimArrival(
    invitationId: string,
    participantId: string,
  ): Promise<boolean> {
    const res = await this.redis.set(
      arrivedKey(invitationId, participantId),
      '1',
      'EX',
      LOCATION_TTL_SECONDS,
      'NX',
    );
    return res === 'OK';
  }

  // GPS hash + 모든 참여자의 arrived lock을 atomically 삭제.
  // arrived lock 누락 시 다음 cycle에 stale "처음 도착" 처리 발생 가능.
  async deleteInvitation(invitationId: string): Promise<void> {
    const participantIds = await this.redis.hkeys(hashKey(invitationId));
    const pipeline = this.redis.multi();
    pipeline.del(hashKey(invitationId));
    for (const pid of participantIds) {
      pipeline.del(arrivedKey(invitationId, pid));
    }
    await pipeline.exec();
  }

  // 단일 참여자의 GPS entry + arrived lock 삭제. 사용자가 자기 공유를 끄거나 탈퇴할 때 사용.
  async deleteParticipant(invitationId: string, participantId: string): Promise<void> {
    const pipeline = this.redis.multi();
    pipeline.hdel(hashKey(invitationId), participantId);
    pipeline.del(arrivedKey(invitationId, participantId));
    await pipeline.exec();
  }
}
