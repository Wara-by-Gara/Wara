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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
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


@ApiTags('Feedbacks')
@ApiBearerAuth('access-token')
@Controller('invitations')
export class FeedbacksController {
  constructor(private readonly feedbacksService: FeedbacksService) {}

  //모든 종류의 댓글 가져오기 (초대장댓글 + 사진댓글)
  @Get(':invitationId/feedbacks/all')
  @UseGuards(JwtAuthGuard, BlocklistGuard, ParticipantGuard)
  @ApiOperation({ summary: '전체 피드백 목록 조회 (초대장 + 사진)' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({ status: 403, description: 'INVITATION_ACCESS_REVOKED' })
  @ApiResponse({ status: 404, description: 'PARTICIPANT_NOT_FOUND' })
  listAll(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Query(new ZodValidationPipe(ListFeedbacksSchema)) dto: ListFeedbacksDto,
  ) {
    return this.feedbacksService.listAll(invitationId, dto);
  }

  //초대장 댓글 생성
  @Post(':invitationId/feedbacks')
  @UseGuards(JwtAuthGuard,BlocklistGuard, ParticipantGuard)
  @ApiOperation({ summary: '초대장 피드백 작성' })
  @ApiResponse({ status: 201, description: '성공' })
  @ApiResponse({ status: 403, description: 'INVITATION_ACCESS_REVOKED' })
  @ApiResponse({ status: 404, description: 'PARTICIPANT_NOT_FOUND' })
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
  @ApiOperation({ summary: '사진 피드백 목록 조회' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({ status: 404, description: 'PARTICIPANT_NOT_FOUND' })
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
  @ApiOperation({ summary: '사진 피드백 작성' })
  @ApiResponse({ status: 201, description: '성공' })
  @ApiResponse({ status: 403, description: 'INVITATION_ACCESS_REVOKED' })
  @ApiResponse({ status: 404, description: 'PARTICIPANT_NOT_FOUND | PHOTO_NOT_FOUND' })
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
  @ApiOperation({ summary: '피드백 수정' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({ status: 403, description: 'INSUFFICIENT_ROLE' })
  @ApiResponse({ status: 404, description: 'PARTICIPANT_NOT_FOUND' })
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
  @ApiOperation({ summary: '피드백 삭제 (소프트 딜리트)' })
  @ApiResponse({ status: 204, description: '성공' })
  @ApiResponse({ status: 403, description: 'INSUFFICIENT_ROLE' })
  @ApiResponse({ status: 404, description: 'PARTICIPANT_NOT_FOUND' })
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
  @ApiOperation({ summary: '피드백 좋아요 토글' })
  @ApiResponse({ status: 200, description: '{ liked: true | false }' })
  @ApiResponse({ status: 404, description: 'PARTICIPANT_NOT_FOUND' })
  toggleLike(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Param('feedbackId', ParseUlidPipe) feedbackId: string,
    @CurrentParticipant() participant: Participant,
  ) {
    return this.feedbacksService.toggleLike(invitationId, feedbackId, participant);
  }
}
