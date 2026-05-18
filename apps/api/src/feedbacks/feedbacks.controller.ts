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
  UseGuards,
} from '@nestjs/common';
import { FeedbacksService } from './feedbacks.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ParseUlidPipe } from '../common/pipes/parse-ulid.pipe';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/types/jwt-payload.type';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  CreateFeedbackDto,
  CreateFeedbackSchema,
} from './dto/create-feedback.dto';
import {
  UpdateFeedbackDto,
  UpdateFeedbackSchema,
} from './dto/update-feedback.dto';

@Controller('invitations')
export class FeedbacksController {
  constructor(private readonly feedbacksService: FeedbacksService) {}

  //초대장 댓글 목록
  @Get(':invitationId/feedbacks')
  @UseGuards(JwtAuthGuard)
  listByInvitation(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.feedbacksService.listByInvitation(invitationId, user.id);
  }

  //초대장 댓글 생성
  @Post(':invitationId/feedbacks')
  @UseGuards(JwtAuthGuard)
  createForInvitation(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(CreateFeedbackSchema)) dto: CreateFeedbackDto,
  ) {
    return this.feedbacksService.createForInvitation(
      invitationId,
      user.id,
      dto,
    );
  }

  //사진 댓글 목록
  @Get(':invitationId/photos/:photoId/feedbacks')
  @UseGuards(JwtAuthGuard)
  listByPhoto(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Param('photoId', ParseUlidPipe) photoId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.feedbacksService.listByPhoto(invitationId, photoId, user.id);
  }

  //사진 댓글 생성
  @Post(':invitationId/photos/:photoId/feedbacks')
  @UseGuards(JwtAuthGuard)
  createForPhoto(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Param('photoId', ParseUlidPipe) photoId: string,
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(CreateFeedbackSchema)) dto: CreateFeedbackDto,
  ) {
    return this.feedbacksService.createForPhoto(
      invitationId,
      photoId,
      user.id,
      dto,
    );
  }

  //댓글 수정
  @Patch(':invitationId/feedbacks/:id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Param('id', ParseUlidPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(UpdateFeedbackSchema)) dto: UpdateFeedbackDto,
  ) {
    return this.feedbacksService.update(id, user.id, dto);
  }

  //댓글 삭제
  @Delete(':invitationId/feedbacks/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Param('id', ParseUlidPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.feedbacksService.remove(id, user.id);
  }

  //좋아요 토글
  @Post(':invitationId/feedbacks/:feedbackId/likes')
  @UseGuards(JwtAuthGuard)
  toggleLike(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Param('feedbackId', ParseUlidPipe) feedbackId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.feedbacksService.toggleLike(invitationId, feedbackId, user.id);
  }
}
