import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { CurrentParticipant } from '../common/decorators/current-participant.decorator';
import { RequireMemberRole } from '../common/decorators/member-role.decorator';
import { MemberRole } from '../common/enums/member-role.enum';
import { BlocklistGuard } from '../common/guards/blocklist.guard';
import { HostGuard } from '../common/guards/host.guard';
import { ParticipantGuard } from '../common/guards/participant.guard';
import { ParseUlidPipe } from '../common/pipes/parse-ulid.pipe';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { Participant } from '../database/schema';
import { SettlementsService } from './settlements.service';
import { SettlementImageService } from './settlement-image.service';
import { upsertExpenseSchema, type UpsertExpenseDto } from './dto/upsert-expense.dto';
import { updateSettlementSchema, type UpdateSettlementDto } from './dto/update-settlement.dto';

@Controller('invitations/:invitationId/settlement')
@UseGuards(BlocklistGuard)
export class SettlementsController {
  constructor(
    private readonly service: SettlementsService,
    private readonly imageService: SettlementImageService,
  ) {}

  @Get()
  @UseGuards(ParticipantGuard)
  getSummary(@Param('invitationId', ParseUlidPipe) invitationId: string) {
    return this.service.getSummary(invitationId);
  }

  @Get('image')
  @UseGuards(ParticipantGuard)
  async getImage(@Param('invitationId', ParseUlidPipe) invitationId: string, @Res() res: Response) {
    const summary = await this.service.getSummary(invitationId);
    const png = await this.imageService.renderCard(summary);
    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'no-store');
    res.send(png);
  }

  // ── 항목 CRUD (참가자 누구나 추가, 수정/삭제는 지불자 또는 HOST) ─────────────────

  @Post('expenses')
  @UseGuards(ParticipantGuard)
  @HttpCode(HttpStatus.CREATED)
  addExpense(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Body(new ZodValidationPipe(upsertExpenseSchema)) dto: UpsertExpenseDto,
  ) {
    return this.service.addExpense(invitationId, dto);
  }

  @Patch('expenses/:expenseId')
  @UseGuards(ParticipantGuard)
  updateExpense(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Param('expenseId', ParseUlidPipe) expenseId: string,
    @CurrentParticipant() viewer: Participant,
    @Body(new ZodValidationPipe(upsertExpenseSchema)) dto: UpsertExpenseDto,
  ) {
    return this.service.updateExpense(invitationId, expenseId, dto, viewer);
  }

  @Delete('expenses/:expenseId')
  @UseGuards(ParticipantGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteExpense(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Param('expenseId', ParseUlidPipe) expenseId: string,
    @CurrentParticipant() viewer: Participant,
  ) {
    await this.service.deleteExpense(invitationId, expenseId, viewer);
  }

  // ── 상태 / 공유 (HOST·공동호스트) ──────────────────────────────────────────────

  @Post('confirm')
  @UseGuards(HostGuard)
  @RequireMemberRole(MemberRole.HOST)
  @HttpCode(HttpStatus.OK)
  confirm(@Param('invitationId', ParseUlidPipe) invitationId: string) {
    return this.service.confirm(invitationId);
  }

  @Post('reopen')
  @UseGuards(HostGuard)
  @RequireMemberRole(MemberRole.HOST)
  @HttpCode(HttpStatus.OK)
  reopen(@Param('invitationId', ParseUlidPipe) invitationId: string) {
    return this.service.reopen(invitationId);
  }

  @Patch()
  @UseGuards(HostGuard)
  @RequireMemberRole(MemberRole.HOST)
  update(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Body(new ZodValidationPipe(updateSettlementSchema)) dto: UpdateSettlementDto,
  ) {
    return this.service.setAnonymized(invitationId, dto.isAnonymized!);
  }

  @Post('share')
  @UseGuards(HostGuard)
  @RequireMemberRole(MemberRole.HOST)
  @HttpCode(HttpStatus.OK)
  enableShare(@Param('invitationId', ParseUlidPipe) invitationId: string) {
    return this.service.enableShare(invitationId);
  }

  @Delete('share')
  @UseGuards(HostGuard)
  @RequireMemberRole(MemberRole.HOST)
  @HttpCode(HttpStatus.NO_CONTENT)
  async disableShare(@Param('invitationId', ParseUlidPipe) invitationId: string) {
    await this.service.disableShare(invitationId);
  }
}
