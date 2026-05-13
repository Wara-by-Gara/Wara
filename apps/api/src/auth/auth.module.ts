import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { NaverController } from './naver/naver.controller';
import { NaverService } from './naver/naver.service';
import { JwtAuthStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
      }),
    }),
  ],
  controllers: [AuthController, NaverController],
  providers: [AuthService, AuthRepository, NaverService, JwtAuthStrategy, JwtAuthGuard],
  exports: [JwtAuthGuard, JwtAuthStrategy],
})
export class AuthModule {}
