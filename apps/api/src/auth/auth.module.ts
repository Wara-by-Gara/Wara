import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { HttpModule } from '@nestjs/axios';
import { BlocklistGuard } from '../common/guards/blocklist.guard';
import { HostGuard } from '../common/guards/host.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ParticipantGuard } from '../common/guards/participant.guard';
import { RsvpStatusGuard } from '../common/guards/rsvp-status.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { BlocklistRepository } from '../common/repositories/blocklist.repository';
import { ParticipantRepository } from '../common/repositories/participant.repository';
import { AuthController } from './auth.controller';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { SocialAuthFactory } from './social-auth.factory';
import { OauthPolicyService } from './oauth-policy.service';
import { AppleController } from './apple/apple.controller';
import { AppleService } from './apple/apple.service';
import { AppleStrategy } from './apple/apple.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { KakaoStrategy } from './strategies/kakao.strategy';
import { NaverStrategy } from './strategies/naver.strategy';

@Module({
  imports: [
    HttpModule,

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
    SocialAuthFactory,
    OauthPolicyService,
    AppleService,
    AppleStrategy,
    GoogleStrategy,
    KakaoStrategy,
    NaverStrategy,

    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },

    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },

    ParticipantRepository,
    BlocklistRepository,
    HostGuard,
    BlocklistGuard,
    ParticipantGuard,
    RsvpStatusGuard,
  ],

  exports: [
    AuthService,
    HostGuard,
    BlocklistGuard,
    ParticipantGuard,
    RsvpStatusGuard,
    ParticipantRepository,
    BlocklistRepository,
  ],
})
export class AuthModule {}
