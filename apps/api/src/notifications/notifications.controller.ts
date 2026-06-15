import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
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

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query(new ZodValidationPipe(CursorPaginationSchema))
    { cursor, limit }: CursorPaginationDto,
  ) {
    return this.notificationsService.findAll(user.id, cursor, limit);
  }

  @Get('unread')
  getUnreadCount(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Get('settings')
  getSettings(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.getSettings(user.id);
  }

  @Patch('readAll')
  @HttpCode(HttpStatus.NO_CONTENT)
  markAllAsRead(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Patch('settings')
  updateSettings(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(UpdateNotificationSettingsSchema))
    dto: UpdateNotificationSettingsDto,
  ) {
    return this.notificationsService.updateSettings(user.id, dto);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteAllNotifications(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.deleteAllNotifications(user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteNotification(
    @Param('id', ParseUlidPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.notificationsService.deleteNotification(user.id, id);
  }

  @Patch(':id/read')
  markAsRead(
    @Param('id', ParseUlidPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.notificationsService.markAsRead(user.id, id);
  }
}
