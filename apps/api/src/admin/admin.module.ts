import { Module } from '@nestjs/common';
import { ShareAnalyticsController } from './share-analytics.controller';
import { ShareAnalyticsRepository } from './share-analytics.repository';
import { ShareAnalyticsService } from './share-analytics.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminInvitationsController } from './admin-invitations.controller';
import { AdminManagementService } from './admin-management.service';
import { AdminManagementRepository } from './admin-management.repository';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardRepository } from './dashboard.repository';
import { AdminAuthController } from './admin-auth.controller';

@Module({
  controllers: [ShareAnalyticsController, AdminUsersController, AdminInvitationsController, DashboardController, AdminAuthController],
  providers: [
    ShareAnalyticsService,
    ShareAnalyticsRepository,
    AdminManagementService,
    AdminManagementRepository,
    DashboardService,
    DashboardRepository,
  ],
})
export class AdminModule {}
