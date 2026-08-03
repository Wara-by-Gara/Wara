import { Module } from '@nestjs/common';
import { InquiriesController } from './inquiries.controller';
import { AdminInquiriesController } from './admin-inquiries.controller';
import { InquiriesService } from './inquiries.service';
import { InquiriesRepository } from './inquiries.repository';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [InquiriesController, AdminInquiriesController],
  providers: [InquiriesService, InquiriesRepository],
})
export class InquiriesModule {}
