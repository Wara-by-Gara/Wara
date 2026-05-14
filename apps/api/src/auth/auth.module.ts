import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { BlocklistGuard } from '../common/guards/blocklist.guard';
import { HostGuard } from '../common/guards/host.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { BlocklistRepository } from '../common/repositories/blocklist.repository';
import { ParticipantRepository } from '../common/repositories/participant.repository';
import { AuthController } from './auth.controller';
import { AppleController } from './apple/apple.controller';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { AppleService } from './apple/apple.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: config.get<number>('JWT_ACCESS_EXPIRES_IN', 1800),
          algorithm: 'HS256',
        },
        verifyOptions: {
          algorithms: ['HS256'],
        },
      }),
    }),
  ],
  controllers: [AuthController, AppleController],
  providers: [
    AuthService,
    AuthRepository,
    AppleService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    ParticipantRepository,
    BlocklistRepository,
    HostGuard,
    BlocklistGuard,
  ],
  exports: [
    HostGuard,
    BlocklistGuard,
    ParticipantRepository,
    BlocklistRepository,
  ],
})
export class AuthModule {}
