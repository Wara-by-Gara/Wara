import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { z } from 'zod';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ParseUlidPipe } from '../common/pipes/parse-ulid.pipe';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  UpdateNotificationSettingsSchema,
  type UpdateNotificationSettingsDto,
} from './dto/update-notification-settings.dto';
import type { JwtPayload } from '../common/types/jwt-payload.type';

const CursorPaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

type CursorPaginationDto = z.infer<typeof CursorPaginationSchema>;

@ApiTags('Notifications')
@ApiBearerAuth('access-token')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: '알림 목록 조회 (cursor 페이지네이션)' })
  @ApiResponse({ status: 200, description: '성공' })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query(new ZodValidationPipe(CursorPaginationSchema))
    { cursor, limit }: CursorPaginationDto,
  ) {
    return this.notificationsService.findAll(user.id, cursor, limit);
  }

  @Get('unread')
  @ApiOperation({ summary: '읽지 않은 알림 수 조회' })
  @ApiResponse({ status: 200, description: '성공' })
  getUnreadCount(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Get('settings')
  @ApiOperation({ summary: '알림 설정 조회' })
  @ApiResponse({ status: 200, description: '성공' })
  getSettings(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.getSettings(user.id);
  }

  @Patch('readAll')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '전체 알림 읽음 처리' })
  @ApiResponse({ status: 204, description: '성공' })
  markAllAsRead(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Patch('settings')
  @ApiOperation({ summary: '알림 설정 변경' })
  @ApiResponse({ status: 200, description: '성공' })
  updateSettings(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(UpdateNotificationSettingsSchema))
    dto: UpdateNotificationSettingsDto,
  ) {
    return this.notificationsService.updateSettings(user.id, dto);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: '개별 알림 읽음 처리' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({ status: 403, description: 'NOTIFICATION_FORBIDDEN' })
  @ApiResponse({ status: 404, description: 'NOTIFICATION_NOT_FOUND' })
  markAsRead(
    @Param('id', ParseUlidPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.notificationsService.markAsRead(user.id, id);
  }
}
