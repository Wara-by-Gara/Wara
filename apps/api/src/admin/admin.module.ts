import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from '../auth/auth.module';
import { AdminInvitationsController } from './controllers/admin-invitations.controller';
import { AdminUsersController } from './controllers/admin-users.controller';
import { AuditLogInterceptor } from './interceptors/audit-log.interceptor';
import { AuditLogRepository } from './repositories/audit-log.repository';
import { InvitationAdminRepository } from './repositories/invitation-admin.repository';
import { UserRepository } from './repositories/user.repository';
import { AdminBootstrapService } from './services/admin-bootstrap.service';
import { AdminInvitationsService } from './services/admin-invitations.service';
import { AdminUsersService } from './services/admin-users.service';

@Module({
  imports: [AuthModule],
  controllers: [AdminUsersController, AdminInvitationsController],
  providers: [
    AdminBootstrapService,
    AdminUsersService,
    AdminInvitationsService,
    AuditLogInterceptor,
    { provide: APP_INTERCEPTOR, useExisting: AuditLogInterceptor },
    UserRepository,
    AuditLogRepository,
    InvitationAdminRepository,
  ],
  exports: [AdminBootstrapService],
})
export class AdminModule {}
