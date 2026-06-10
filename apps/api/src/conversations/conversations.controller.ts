import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ParseUlidPipe } from '../common/pipes/parse-ulid.pipe';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { JwtPayload } from '../common/types/jwt-payload.type';
import {
  CreateConversationSchema,
  CreateConversationDto,
} from './dto/create-conversation.dto';
import {
  SendMessageSchema,
  SendMessageDto,
  EditMessageSchema,
  EditMessageDto,
  MessageImagePresignedSchema,
  MessageImagePresignedDto,
} from './dto/send-message.dto';
import {
  ListMessagesQuerySchema,
  ListMessagesQueryDto,
} from './dto/list-messages.query.dto';
import { ReactMessageSchema, ReactMessageDto } from './dto/react-message.dto';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  createConversation(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(CreateConversationSchema))
    dto: CreateConversationDto,
  ) {
    return this.conversationsService.createOrGet(user.id, dto.targetUserId);
  }

  @Get()
  getConversations(@CurrentUser() user: JwtPayload) {
    return this.conversationsService.getConversations(user.id);
  }

  // 전체 안읽음 DM 수 — :id 라우트보다 먼저 선언
  @Get('unread-count')
  getUnreadCount(@CurrentUser() user: JwtPayload) {
    return this.conversationsService.getUnreadCount(user.id);
  }

  @Get(':id')
  getConversation(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUlidPipe) id: string,
  ) {
    return this.conversationsService.getDetail(user.id, id);
  }

  @Get(':id/messages')
  getMessages(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUlidPipe) id: string,
    @Query(new ZodValidationPipe(ListMessagesQuerySchema))
    query: ListMessagesQueryDto,
  ) {
    return this.conversationsService.getMessages(
      user.id,
      id,
      query.cursor,
      query.limit,
    );
  }

  // 이미지 업로드용 presigned URL 발급
  @Post(':id/messages/presigned-url')
  generateImagePresignedUrl(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUlidPipe) id: string,
    @Body(new ZodValidationPipe(MessageImagePresignedSchema))
    dto: MessageImagePresignedDto,
  ) {
    return this.conversationsService.generateImagePresignedUrl(user.id, id, dto);
  }

  @Post(':id/messages')
  sendMessage(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUlidPipe) id: string,
    @Body(new ZodValidationPipe(SendMessageSchema)) dto: SendMessageDto,
  ) {
    return this.conversationsService.sendMessage(
      user.id,
      id,
      dto.content,
      dto.replyToMessageId,
      dto.imageKey,
    );
  }

  @Patch(':id/messages/:messageId')
  editMessage(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUlidPipe) id: string,
    @Param('messageId', ParseUlidPipe) messageId: string,
    @Body(new ZodValidationPipe(EditMessageSchema)) dto: EditMessageDto,
  ) {
    return this.conversationsService.editMessage(user.id, id, messageId, dto.content);
  }

  // 이모지 리액션 토글
  @Post(':id/messages/:messageId/reactions')
  toggleReaction(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUlidPipe) id: string,
    @Param('messageId', ParseUlidPipe) messageId: string,
    @Body(new ZodValidationPipe(ReactMessageSchema)) dto: ReactMessageDto,
  ) {
    return this.conversationsService.toggleReaction(user.id, id, messageId, dto.emoji);
  }

  // 리액션 상세 (누가 어떤 이모지를 눌렀는지)
  @Get(':id/messages/:messageId/reactions')
  getMessageReactors(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUlidPipe) id: string,
    @Param('messageId', ParseUlidPipe) messageId: string,
  ) {
    return this.conversationsService.getMessageReactors(user.id, id, messageId);
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  markRead(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUlidPipe) id: string,
  ) {
    return this.conversationsService.markRead(user.id, id);
  }

  // 채팅방 나가기 (나만)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  leaveConversation(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUlidPipe) id: string,
  ) {
    return this.conversationsService.leaveConversation(user.id, id);
  }

  @Delete(':id/messages/:messageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteMessage(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUlidPipe) id: string,
    @Param('messageId', ParseUlidPipe) messageId: string,
  ) {
    return this.conversationsService.deleteMessage(user.id, id, messageId);
  }
}
