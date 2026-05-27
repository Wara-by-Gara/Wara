import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsRepository } from './notifications.repository';
import { NotificationsGateway } from './notifications.gateway';
import { RemindSchedulerService } from './remind-scheduler.service';
import { RemindSchedulerRepository } from './remind-scheduler.repository';

@Module({
  imports: [AuthModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsRepository,
    NotificationsGateway,
    RemindSchedulerService,
    RemindSchedulerRepository,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
