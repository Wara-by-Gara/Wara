import { Module } from '@nestjs/common';
import { ShareAnalyticsController } from './share-analytics.controller';
import { ShareAnalyticsRepository } from './share-analytics.repository';
import { ShareAnalyticsService } from './share-analytics.service';

@Module({
  controllers: [ShareAnalyticsController],
  providers: [ShareAnalyticsService, ShareAnalyticsRepository],
})
export class AdminModule {}
