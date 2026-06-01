import { Module } from '@nestjs/common';
import { AdminTermsController } from './admin-terms.controller';
import { TermsController } from './terms.controller';
import { TermsRepository } from './terms.repository';
import { TermsService } from './terms.service';

@Module({
  controllers: [TermsController, AdminTermsController],
  providers: [TermsService, TermsRepository],
})
export class TermsModule {}
