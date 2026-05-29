import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { DateVoteController } from './date-vote.controller';
import { DateVoteService } from './date-vote.service';
import { DateVoteRepository } from './date-vote.repository';
import { DateVoteScheduler } from './date-vote.scheduler';

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [DateVoteController],
  providers: [DateVoteService, DateVoteRepository, DateVoteScheduler],
})
export class DateVoteModule {}
