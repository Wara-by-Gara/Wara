import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { AdminScopeGuard } from './guards/admin-scope.guard';
import { BlocklistGuard } from './guards/blocklist.guard';
import { HostGuard } from './guards/host.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PrivateInvitationGuard } from './guards/private-invitation.guard';
import { RolesGuard } from './guards/roles.guard';
import { BLOCKLIST_REPOSITORY } from './repositories/blocklist.repository.interface';
import { MockBlocklistRepository } from './repositories/blocklist.repository.mock';
import { INVITATION_REPOSITORY } from './repositories/invitation.repository.interface';
import { MockInvitationRepository } from './repositories/invitation.repository.mock';
import { PARTICIPANT_REPOSITORY } from './repositories/participant.repository.interface';
import { MockParticipantRepository } from './repositories/participant.repository.mock';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: AdminScopeGuard },
    { provide: PARTICIPANT_REPOSITORY, useClass: MockParticipantRepository },
    { provide: BLOCKLIST_REPOSITORY, useClass: MockBlocklistRepository },
    { provide: INVITATION_REPOSITORY, useClass: MockInvitationRepository },
    HostGuard,
    BlocklistGuard,
    PrivateInvitationGuard,
  ],
  exports: [
    HostGuard,
    BlocklistGuard,
    PrivateInvitationGuard,
    JwtModule,
    PARTICIPANT_REPOSITORY,
    BLOCKLIST_REPOSITORY,
    INVITATION_REPOSITORY,
  ],
})
export class AuthModule {}
