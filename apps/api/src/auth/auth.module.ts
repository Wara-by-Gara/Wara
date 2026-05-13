import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { AdminScopeGuard } from '../common/guards/admin-scope.guard';
import { BlocklistGuard } from '../common/guards/blocklist.guard';
import { HostGuard } from '../common/guards/host.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PrivateInvitationGuard } from '../common/guards/private-invitation.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthController } from './auth.controller';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { BLOCKLIST_REPOSITORY } from '../common/repositories/blocklist.repository.interface';
import { MockBlocklistRepository } from '../common/repositories/blocklist.repository.mock';
import { INVITATION_REPOSITORY } from '../common/repositories/invitation.repository.interface';
import { MockInvitationRepository } from '../common/repositories/invitation.repository.mock';
import { PARTICIPANT_REPOSITORY } from '../common/repositories/participant.repository.interface';
import { MockParticipantRepository } from '../common/repositories/participant.repository.mock';

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
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
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
