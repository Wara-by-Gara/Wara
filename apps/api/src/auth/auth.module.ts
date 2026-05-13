import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AppleController } from './apple/apple.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
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
        },
      }),
    }),
  ],
  controllers: [AuthController, AppleController],
  providers: [AuthService, AuthRepository, AppleService],
})
export class AuthModule {}
