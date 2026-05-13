import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { BlocklistGuard } from '../common/guards/blocklist.guard';
import { HostGuard } from '../common/guards/host.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PrivateInvitationGuard } from '../common/guards/private-invitation.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { BlocklistRepository } from '../common/repositories/blocklist.repository';
import { InvitationRepository } from '../common/repositories/invitation.repository';
import { ParticipantRepository } from '../common/repositories/participant.repository';
import { AuthController } from './auth.controller';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';

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
    ParticipantRepository,
    BlocklistRepository,
    InvitationRepository,
    HostGuard,
    BlocklistGuard,
    PrivateInvitationGuard,
  ],
  exports: [
    HostGuard,
    BlocklistGuard,
    PrivateInvitationGuard,
    JwtModule,
    ParticipantRepository,
    BlocklistRepository,
    InvitationRepository,
  ],
})
export class AuthModule {}
