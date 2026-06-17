import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TextBlastsController } from './text-blasts.controller';
import { TextBlastsRepository } from './text-blasts.repository';
import { TextBlastsService } from './text-blasts.service';

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [TextBlastsController],
  providers: [TextBlastsService, TextBlastsRepository],
})
export class TextBlastsModule {}
