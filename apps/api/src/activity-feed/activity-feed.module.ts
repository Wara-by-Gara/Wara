import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ActivityFeedController } from './activity-feed.controller';
import { ActivityFeedService } from './activity-feed.service';
import { ActivityFeedRepository } from './activity-feed.repository';

/**
 * 초대장 활동 피드(F-XGWBYE). 기존 도메인 테이블(participants/photos/feedbacks/date_vote)에서
 * 파생 조회 — 별도 이벤트 저장소 없이 읽기 전용으로 구성.
 */
@Module({
  imports: [AuthModule],
  controllers: [ActivityFeedController],
  providers: [ActivityFeedService, ActivityFeedRepository],
})
export class ActivityFeedModule {}
