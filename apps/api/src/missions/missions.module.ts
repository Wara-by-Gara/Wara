import { Module } from '@nestjs/common';
import { MissionsController } from './missions.controller';
import { MissionsService } from './missions.service';
import { MissionsRepository } from './missions.repository';

@Module({
  controllers: [MissionsController],
  providers: [MissionsService, MissionsRepository],
})
export class MissionsModule {}
