import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AppleController } from './apple/apple.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { AppleService } from './apple/apple.service';

@Module({
  controllers: [AuthController, AppleController],
  providers: [AuthService, AuthRepository, AppleService],
})
export class AuthModule {}
