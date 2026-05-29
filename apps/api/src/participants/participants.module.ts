import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { S3Module } from '../s3/s3.module';
import { ParticipantsController } from './participants.controller';
import { ParticipantsService } from './participants.service';
import { ParticipantsRepository } from './participants.repository';

@Module({
  imports: [AuthModule, UsersModule, S3Module],
  controllers: [ParticipantsController],
  providers: [ParticipantsService, ParticipantsRepository],
})
export class ParticipantsModule {}
