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
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireMemberRole } from '../common/decorators/member-role.decorator';
import { MemberRole } from '../common/enums/member-role.enum';
import { BlocklistGuard } from '../common/guards/blocklist.guard';
import { HostGuard } from '../common/guards/host.guard';
import { ParticipantGuard } from '../common/guards/participant.guard';
import { ParseUlidPipe } from '../common/pipes/parse-ulid.pipe';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { JwtPayload } from '../common/types/jwt-payload.type';
import {
  CreateTextBlastDto,
  CreateTextBlastSchema,
} from './dto/create-text-blast.dto';
import { TextBlastsService } from './text-blasts.service';

@Controller('invitations/:invitationId/text-blasts')
export class TextBlastsController {
  constructor(private readonly textBlastsService: TextBlastsService) {}

  /** 참석자(호스트·게스트)는 공지 목록 열람 가능 */
  @Get()
  @UseGuards(BlocklistGuard, ParticipantGuard)
  async list(@Param('invitationId', ParseUlidPipe) invitationId: string) {
    return this.textBlastsService.list(invitationId);
  }

  /** 호스트만 단체 공지 발송 */
  @Post()
  @UseGuards(HostGuard)
  @RequireMemberRole(MemberRole.HOST)
  async create(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Body(new ZodValidationPipe(CreateTextBlastSchema)) dto: CreateTextBlastDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.textBlastsService.create(invitationId, user.id, dto);
  }

  @Delete(':id')
  @UseGuards(HostGuard)
  @RequireMemberRole(MemberRole.HOST)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Param('id', ParseUlidPipe) id: string,
  ): Promise<void> {
    await this.textBlastsService.delete(invitationId, id);
  }
}
