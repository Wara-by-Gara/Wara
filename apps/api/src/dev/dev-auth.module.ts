import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TermsModule } from '../terms/terms.module';
import { DateVoteModule } from '../date-vote/date-vote.module';
import { DevAuthController } from './dev-auth.controller';
import { DevAuthService } from './dev-auth.service';
import { DevVoteController } from './dev-vote.controller';
import { DevLocationController } from './dev-location.controller';
import { LocationsModule } from '../locations/locations.module';

// NODE_ENV !== 'production'일 때만 app.module.ts에서 import — prod에서는 등록조차 안 됨.
@Module({
  imports: [AuthModule, TermsModule, DateVoteModule, LocationsModule],
  controllers: [DevAuthController, DevVoteController, DevLocationController],
  providers: [DevAuthService],
})
export class DevAuthModule {}
