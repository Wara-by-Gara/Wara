import { Module } from '@nestjs/common';
import { FeedbacksController } from './feedbacks.controller';
import { FeedbacksService } from './feedbacks.service';
import { FeedbacksRepository } from './feedbacks.repository';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [FeedbacksController],
  providers: [FeedbacksService, FeedbacksRepository],
})
export class FeedbacksModule {}
