import { Module } from '@nestjs/common';
import { ShareAnalyticsController } from './share-analytics.controller';
import { ShareAnalyticsRepository } from './share-analytics.repository';
import { ShareAnalyticsService } from './share-analytics.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminInvitationsController } from './admin-invitations.controller';
import { AdminManagementService } from './admin-management.service';
import { AdminManagementRepository } from './admin-management.repository';

@Module({
  controllers: [ShareAnalyticsController, AdminUsersController, AdminInvitationsController],
  providers: [
    ShareAnalyticsService,
    ShareAnalyticsRepository,
    AdminManagementService,
    AdminManagementRepository,
  ],
})
export class AdminModule {}
