import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { QuestionnaireController } from './questionnaire.controller';
import { QuestionnaireRepository } from './questionnaire.repository';
import { QuestionnaireService } from './questionnaire.service';

@Module({
  imports: [AuthModule],
  controllers: [QuestionnaireController],
  providers: [QuestionnaireService, QuestionnaireRepository],
})
export class QuestionnaireModule {}
