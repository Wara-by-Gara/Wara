import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TermsModule } from '../terms/terms.module';
import { DevAuthController } from './dev-auth.controller';
import { DevAuthService } from './dev-auth.service';

// NODE_ENV !== 'production'일 때만 app.module.ts에서 import — prod에서는 등록조차 안 됨.
@Module({
  imports: [AuthModule, TermsModule],
  controllers: [DevAuthController],
  providers: [DevAuthService],
})
export class DevAuthModule {}
