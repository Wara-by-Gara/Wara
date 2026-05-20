import { Participant } from '../database/schema/invitations';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FeedbacksService } from './feedbacks.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ParseUlidPipe } from '../common/pipes/parse-ulid.pipe';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  CreateFeedbackDto,
  CreateFeedbackSchema,
} from './dto/create-feedback.dto';
import {
  UpdateFeedbackDto,
  UpdateFeedbackSchema,
} from './dto/update-feedback.dto';
import {
  ListFeedbacksSchema,
  ListFeedbacksDto,
} from './dto/list-feedbacks.dto';
import { BlocklistGuard } from '../common/guards/blocklist.guard';
import { ParticipantGuard } from '../common/guards/participant.guard';
import { CurrentParticipant } from '../common/decorators/current-participant.decorator';


@Controller('invitations')
export class FeedbacksController {
  constructor(private readonly feedbacksService: FeedbacksService) {}

  //모든 종류의 댓글 가져오기 (초대장댓글 + 사진댓글)
  @Get(':invitationId/feedbacks/all')
  @UseGuards(JwtAuthGuard, BlocklistGuard, ParticipantGuard)
  listAll(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Query(new ZodValidationPipe(ListFeedbacksSchema)) dto: ListFeedbacksDto,
  ) {
    return this.feedbacksService.listAll(invitationId, dto);
  }

  //초대장 댓글 생성
  @Post(':invitationId/feedbacks')
  @UseGuards(JwtAuthGuard,BlocklistGuard, ParticipantGuard)
  createForInvitation(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @CurrentParticipant() participant: Participant,
    @Body(new ZodValidationPipe(CreateFeedbackSchema)) dto: CreateFeedbackDto,
  ) {
    return this.feedbacksService.createForInvitation(
      invitationId,
      participant,
      dto,
    );
  }

  //사진 댓글 목록
  @Get(':invitationId/photos/:photoId/feedbacks')
  @UseGuards(JwtAuthGuard,BlocklistGuard, ParticipantGuard)
  listByPhoto(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Param('photoId', ParseUlidPipe) photoId: string,
    @Query(new ZodValidationPipe(ListFeedbacksSchema)) dto: ListFeedbacksDto,
  ) {
    return this.feedbacksService.listByPhoto(
      invitationId,
      photoId,
      dto,
    );
  }

  //사진 댓글 생성
  @Post(':invitationId/photos/:photoId/feedbacks')
  @UseGuards(JwtAuthGuard,BlocklistGuard, ParticipantGuard)
  createForPhoto(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Param('photoId', ParseUlidPipe) photoId: string,
    @CurrentParticipant() participant: Participant,
    @Body(new ZodValidationPipe(CreateFeedbackSchema)) dto: CreateFeedbackDto,
  ) {
    return this.feedbacksService.createForPhoto(
      invitationId,
      photoId,
      participant,
      dto,
    );
  }

  //댓글 수정
  @Patch(':invitationId/feedbacks/:id')
  @UseGuards(JwtAuthGuard,BlocklistGuard, ParticipantGuard)
  update(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Param('id', ParseUlidPipe) id: string,
    @CurrentParticipant() participant: Participant,
    @Body(new ZodValidationPipe(UpdateFeedbackSchema)) dto: UpdateFeedbackDto,
  ) {
    return this.feedbacksService.update(invitationId, id, participant, dto);
  }

  //댓글 삭제
  @Delete(':invitationId/feedbacks/:id')
  @UseGuards(JwtAuthGuard,BlocklistGuard, ParticipantGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Param('id', ParseUlidPipe) id: string,
    @CurrentParticipant() participant: Participant,
  ) {
    return this.feedbacksService.remove(invitationId, id, participant);
  }

  //좋아요 토글
  @Post(':invitationId/feedbacks/:feedbackId/likes')
  @UseGuards(JwtAuthGuard,BlocklistGuard, ParticipantGuard)
  toggleLike(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Param('feedbackId', ParseUlidPipe) feedbackId: string,
    @CurrentParticipant() participant: Participant,
  ) {
    return this.feedbacksService.toggleLike(invitationId, feedbackId, participant);
  }
}
