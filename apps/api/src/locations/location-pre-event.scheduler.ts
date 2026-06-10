import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { LocationsService } from './locations.service';

@Injectable()
export class LocationPreEventScheduler {
  private readonly logger = new Logger(LocationPreEventScheduler.name);

  constructor(private readonly service: LocationsService) {}

  /** 1분마다: 모임 시작 15분 전 GPS 활성화 알림 */
  @Cron('* * * * *')
  async processPreEventNotifications() {
    try {
      await this.service.processPreEventNotifications();
    } catch (err) {
      this.logger.error('processPreEventNotifications 실패', err);
    }
  }
}
