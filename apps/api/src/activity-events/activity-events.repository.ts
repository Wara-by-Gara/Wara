import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  userActivityEvents,
  type NewUserActivityEvent,
} from '../database/schema';
import { DRIZZLE, DrizzleDB } from '../database/database.module';

type ActivityEventType = NewUserActivityEvent['eventType'];

@Injectable()
export class ActivityEventsRepository {
  private readonly logger = new Logger(ActivityEventsRepository.name);

  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  /**
   * 활동 이벤트 1건 기록.
   * best-effort — 로깅 실패가 로그인 등 본 흐름을 막지 않도록 내부에서 흡수한다.
   */
  async record(
    userId: string,
    eventType: ActivityEventType,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.db.insert(userActivityEvents).values({
        userId,
        eventType,
        metadata: metadata ?? null,
      });
    } catch (e) {
      this.logger.warn(
        `활동 이벤트 기록 실패 (${eventType}, user=${userId}): ${
          e instanceof Error ? e.message : String(e)
        }`,
      );
    }
  }
}
