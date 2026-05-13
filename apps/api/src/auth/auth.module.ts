import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AppleController } from './apple/apple.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';

@Module({
  controllers: [AuthController, AppleController],
  providers: [AuthService, AuthRepository],
})
export class AuthModule {}
