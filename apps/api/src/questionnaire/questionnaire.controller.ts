import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentParticipant } from '../common/decorators/current-participant.decorator';
import { RequireMemberRole } from '../common/decorators/member-role.decorator';
import { MemberRole } from '../common/enums/member-role.enum';
import { BlocklistGuard } from '../common/guards/blocklist.guard';
import { HostGuard } from '../common/guards/host.guard';
import { ParticipantGuard } from '../common/guards/participant.guard';
import { ParseUlidPipe } from '../common/pipes/parse-ulid.pipe';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { Participant } from '../database/schema';
import {
  CreateQuestionDto,
  CreateQuestionSchema,
} from './dto/create-question.dto';
import {
  SubmitAnswersDto,
  SubmitAnswersSchema,
} from './dto/submit-answers.dto';
import { QuestionnaireService } from './questionnaire.service';

@Controller('invitations/:invitationId/questions')
export class QuestionnaireController {
  constructor(private readonly service: QuestionnaireService) {}

  /** 질문 목록 — 응답 작성을 위해 참가자/예비 참가자 모두 열람 */
  @Get()
  list(@Param('invitationId', ParseUlidPipe) invitationId: string) {
    return this.service.listQuestions(invitationId);
  }

  /** 호스트 — 질문별 응답 모음 */
  @Get('answers')
  @UseGuards(BlocklistGuard, HostGuard)
  @RequireMemberRole(MemberRole.HOST)
  listAnswers(@Param('invitationId', ParseUlidPipe) invitationId: string) {
    return this.service.listAnswers(invitationId);
  }

  @Post()
  @UseGuards(HostGuard)
  @RequireMemberRole(MemberRole.HOST)
  create(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Body(new ZodValidationPipe(CreateQuestionSchema)) dto: CreateQuestionDto,
  ) {
    return this.service.createQuestion(invitationId, dto);
  }

  @Delete(':questionId')
  @UseGuards(HostGuard)
  @RequireMemberRole(MemberRole.HOST)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Param('questionId', ParseUlidPipe) questionId: string,
  ): Promise<void> {
    await this.service.deleteQuestion(invitationId, questionId);
  }

  /** 게스트 응답 제출 */
  @Post('answers')
  @HttpCode(HttpStatus.OK)
  @UseGuards(BlocklistGuard, ParticipantGuard)
  submitAnswers(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Body(new ZodValidationPipe(SubmitAnswersSchema)) dto: SubmitAnswersDto,
    @CurrentParticipant() participant: Participant,
  ) {
    return this.service.submitAnswers(invitationId, participant.id, dto);
  }
}
