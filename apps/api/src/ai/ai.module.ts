import { Global, Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiMonitoringService } from './ai-monitoring.service';

@Global()
@Module({
  providers: [AiService, AiMonitoringService],
  exports: [AiService, AiMonitoringService],
})
export class AiModule {}
