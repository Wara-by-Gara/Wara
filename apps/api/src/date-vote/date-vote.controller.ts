import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
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
import { DateVoteService } from './date-vote.service';
import { createPollSchema, type CreatePollDto } from './dto/create-poll.dto';
import { updatePollSchema, type UpdatePollDto } from './dto/update-poll.dto';
import { addSlotSchema, type AddSlotDto } from './dto/add-slot.dto';
import { submitResponsesSchema, type SubmitResponsesDto } from './dto/submit-responses.dto';
import { confirmSlotSchema, type ConfirmSlotDto } from './dto/confirm-slot.dto';

@Controller('invitations/:invitationId/vote')
@UseGuards(BlocklistGuard)
export class DateVoteController {
  constructor(private readonly service: DateVoteService) {}

  // ── Poll ────────────────────────────────────────────────────────────────────

  @Post()
  @UseGuards(HostGuard)
  @RequireMemberRole(MemberRole.HOST)
  @HttpCode(HttpStatus.CREATED)
  async createPoll(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Body(new ZodValidationPipe(createPollSchema)) dto: CreatePollDto,
  ) {
    return this.service.createPoll(invitationId, dto);
  }

  @Get()
  async getPoll(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.getPoll(invitationId, user.id);
  }

  @Patch()
  @UseGuards(HostGuard)
  @RequireMemberRole(MemberRole.HOST)
  async updatePoll(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Body(new ZodValidationPipe(updatePollSchema)) dto: UpdatePollDto,
  ) {
    return this.service.updatePoll(invitationId, dto);
  }

  // ── Slots ───────────────────────────────────────────────────────────────────

  @Post('slots')
  @UseGuards(HostGuard)
  @RequireMemberRole(MemberRole.HOST)
  @HttpCode(HttpStatus.CREATED)
  async addSlot(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Body(new ZodValidationPipe(addSlotSchema)) dto: AddSlotDto,
  ) {
    return this.service.addSlot(invitationId, dto);
  }

  @Delete('slots/:slotId')
  @UseGuards(HostGuard)
  @RequireMemberRole(MemberRole.HOST)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSlot(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Param('slotId', ParseUlidPipe) slotId: string,
  ) {
    await this.service.deleteSlot(invitationId, slotId);
  }

  // ── Responses ───────────────────────────────────────────────────────────────

  @Put('responses')
  @UseGuards(ParticipantGuard)
  @HttpCode(HttpStatus.OK)
  async submitResponses(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(submitResponsesSchema)) dto: SubmitResponsesDto,
  ) {
    return this.service.submitResponses(invitationId, user.id, dto);
  }

  // ── Results ─────────────────────────────────────────────────────────────────

  @Get('results')
  @UseGuards(ParticipantGuard)
  async getResults(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
  ) {
    return this.service.getResults(invitationId);
  }

  // ── Close / Confirm ─────────────────────────────────────────────────────────

  @Post('close')
  @UseGuards(HostGuard)
  @RequireMemberRole(MemberRole.HOST)
  @HttpCode(HttpStatus.OK)
  async closePoll(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
  ) {
    return this.service.closePoll(invitationId);
  }

  @Post('confirm')
  @UseGuards(HostGuard)
  @RequireMemberRole(MemberRole.HOST)
  @HttpCode(HttpStatus.OK)
  async confirmSlot(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Body(new ZodValidationPipe(confirmSlotSchema)) dto: ConfirmSlotDto,
  ) {
    return this.service.confirmSlot(invitationId, dto);
  }
}
