import { Global, Module } from '@nestjs/common';
import { ActivityEventsRepository } from './activity-events.repository';

/**
 * 활동 이벤트 기록 인프라.
 * @Global — 여러 도메인(auth, invitations, participants...)에서 주입 없이 사용하도록 전역 노출.
 */
@Global()
@Module({
  providers: [ActivityEventsRepository],
  exports: [ActivityEventsRepository],
})
export class ActivityEventsModule {}
