import { Module } from '@nestjs/common';
import { FaqController } from './faq.controller';
import { AdminFaqController } from './admin-faq.controller';
import { FaqService } from './faq.service';
import { FaqRepository } from './faq.repository';

@Module({
  controllers: [FaqController, AdminFaqController],
  providers: [FaqService, FaqRepository],
})
export class FaqModule {}
