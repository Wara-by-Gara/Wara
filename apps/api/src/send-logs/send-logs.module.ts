import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SendLogsController } from './send-logs.controller';
import { SendLogsRepository } from './send-logs.repository';
import { LinkEventsRepository } from './link-events.repository';
import { SendLogsService } from './send-logs.service';

@Module({
  imports: [AuthModule],
  controllers: [SendLogsController],
  providers: [SendLogsService, SendLogsRepository, LinkEventsRepository],
})
export class SendLogsModule {}
