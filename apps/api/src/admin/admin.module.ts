import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from '../auth/auth.module';
import { AdminInvitationsController } from './controllers/admin-invitations.controller';
import { AdminUsersController } from './controllers/admin-users.controller';
import { AuditLogInterceptor } from './interceptors/audit-log.interceptor';
import { AUDIT_LOG_REPOSITORY } from './repositories/audit-log.repository.interface';
import { MockAuditLogRepository } from './repositories/audit-log.repository.mock';
import { INVITATION_ADMIN_REPOSITORY } from './repositories/invitation-admin.repository.interface';
import { MockInvitationAdminRepository } from './repositories/invitation-admin.repository.mock';
import { USER_REPOSITORY } from './repositories/user.repository.interface';
import { MockUserRepository } from './repositories/user.repository.mock';
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
    { provide: USER_REPOSITORY, useClass: MockUserRepository },
    { provide: AUDIT_LOG_REPOSITORY, useClass: MockAuditLogRepository },
    {
      provide: INVITATION_ADMIN_REPOSITORY,
      useClass: MockInvitationAdminRepository,
    },
  ],
  exports: [AdminBootstrapService],
})
export class AdminModule {}
