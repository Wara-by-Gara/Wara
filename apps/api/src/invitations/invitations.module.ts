import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from '../auth/auth.module';
import { TemplatesModule } from '../templates/templates.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
import { InvitationsRepository } from './invitations.repository';
import { AiImageJobsRepository } from './ai-image-jobs.repository';
import { S3Module } from '../s3/s3.module';
import { IMAGE_PROCESSING_QUEUE } from '../queues/queue.constants';

@Module({
  imports: [
    AuthModule,
    TemplatesModule,
    S3Module,
    NotificationsModule,
    BullModule.registerQueue({ name: IMAGE_PROCESSING_QUEUE }),
  ],
  controllers: [InvitationsController],
  providers: [InvitationsService, InvitationsRepository, AiImageJobsRepository],
})
export class InvitationsModule {}
