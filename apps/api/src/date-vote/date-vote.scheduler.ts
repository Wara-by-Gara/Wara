import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DateVoteService } from './date-vote.service';

@Injectable()
export class DateVoteScheduler {
  private readonly logger = new Logger(DateVoteScheduler.name);

  constructor(private readonly service: DateVoteService) {}

  /** 5분마다: 마감 시간이 지난 open 폴 자동 마감 */
  @Cron('*/5 * * * *')
  async processExpiredPolls() {
    try {
      await this.service.processExpiredPolls();
    } catch (err) {
      this.logger.error('processExpiredPolls 실패', err);
    }
  }

  /** 5분마다: 마감 30분 이내이고 리마인더 미발송인 폴에 리마인더 발송 */
  @Cron('*/5 * * * *')
  async sendReminders() {
    try {
      await this.service.sendReminders();
    } catch (err) {
      this.logger.error('sendReminders 실패', err);
    }
  }
}
