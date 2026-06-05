import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ParticipantGuard } from '../common/guards/participant.guard';
import { ParseUlidPipe } from '../common/pipes/parse-ulid.pipe';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { JwtPayload } from '../common/types/jwt-payload.type';
import {
  CreateSendLogDto,
  CreateSendLogSchema,
} from './dto/create-send-log.dto';
import { SendLogsService } from './send-logs.service';

@Controller('invitations/:invitationId/logs')
export class SendLogsController {
  constructor(private readonly sendLogsService: SendLogsService) {}

  @Post()
  @UseGuards(ParticipantGuard)
  async create(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Body(new ZodValidationPipe(CreateSendLogSchema)) dto: CreateSendLogDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.sendLogsService.create(user.id, invitationId, dto);
  }

  @Public()
  @Patch(':logId/open')
  @HttpCode(HttpStatus.NO_CONTENT)
  async recordOpen(
    @Param('logId', ParseUlidPipe) logId: string,
  ): Promise<void> {
    await this.sendLogsService.recordOpen(logId);
  }

  @Patch(':logId/joined')
  @HttpCode(HttpStatus.NO_CONTENT)
  async recordJoin(
    @Param('logId', ParseUlidPipe) logId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    await this.sendLogsService.recordJoin(logId, user.id);
  }
}
