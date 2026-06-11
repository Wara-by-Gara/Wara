import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LocationsRepository } from './locations.repository';
import { LocationsRedisStore } from './locations.redis-store';

@Injectable()
export class LocationsFlushScheduler {
  private readonly logger = new Logger(LocationsFlushScheduler.name);

  constructor(
    private readonly repository: LocationsRepository,
    private readonly redisStore: LocationsRedisStore,
  ) {}

  /**
   * 종료(status='closed') 또는 soft deleted된 초대장의 마지막 GPS 좌표를 DB에 1회 기록 후
   * Redis에서 제거. 매시간 정시 실행. Redis 키가 없는 대상은 빠르게 skip.
   * soft deleted 누락 시 24h TTL까지 stale broadcast 가능.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async flush(): Promise<void> {
    const ids = await this.repository.findInvitationsForGpsFlush();
    if (ids.length === 0) return;

    let flushed = 0;
    for (const invitationId of ids) {
      const map = await this.redisStore.findAllByInvitation(invitationId);
      if (map.size === 0) continue;

      for (const [participantId, value] of map.entries()) {
        await this.repository.upsertParticipantLocation(
          invitationId,
          participantId,
          { lat: value.lat, lng: value.lng, accuracy: value.accuracy },
          value.statusMessage,
        );
        if (value.isArrived) {
          await this.repository.setArrivedIfNotYet(participantId, invitationId);
        }
      }
      await this.redisStore.deleteInvitation(invitationId);
      flushed += 1;
    }

    if (flushed > 0) {
      this.logger.log(`flushed ${flushed} closed invitation(s) GPS to DB`);
    }
  }
}
