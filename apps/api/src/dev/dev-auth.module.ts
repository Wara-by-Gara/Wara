/**
 * 개발 전용 모듈 — production에서는 app.module.ts에서 등록하지 않음
 * AuthModule을 import해서 AuthService(issueAccessToken)를 사용
 */
import { Module } from '@nestjs/common';
import { DevAuthController } from './dev-auth.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [DevAuthController],
})
export class DevAuthModule {}
