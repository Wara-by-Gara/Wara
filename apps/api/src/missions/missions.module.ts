import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MissionTemplatesController } from './mission-templates.controller';
import { MissionsController } from './missions.controller';
import { MissionsRepository } from './missions.repository';
import { MissionsService } from './missions.service';

@Module({
  imports: [AuthModule],
  controllers: [MissionsController, MissionTemplatesController],
  providers: [MissionsService, MissionsRepository],
})
export class MissionsModule {}
