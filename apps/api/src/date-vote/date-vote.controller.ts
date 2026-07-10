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
import { updateSlotSchema, type UpdateSlotDto } from './dto/update-slot.dto';
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

  /** 초대장의 투표 목록 (다중 투표). */
  @Get()
  async listPolls(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.listPolls(invitationId, user.id);
  }

  @Get(':pollId')
  async getPoll(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Param('pollId', ParseUlidPipe) pollId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.getPoll(invitationId, pollId, user.id);
  }

  @Patch(':pollId')
  @UseGuards(HostGuard)
  @RequireMemberRole(MemberRole.HOST)
  async updatePoll(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Param('pollId', ParseUlidPipe) pollId: string,
    @Body(new ZodValidationPipe(updatePollSchema)) dto: UpdatePollDto,
  ) {
    return this.service.updatePoll(invitationId, pollId, dto);
  }

  @Delete(':pollId')
  @UseGuards(HostGuard)
  @RequireMemberRole(MemberRole.HOST)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePoll(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Param('pollId', ParseUlidPipe) pollId: string,
  ) {
    await this.service.deletePoll(invitationId, pollId);
  }

  // ── Slots ───────────────────────────────────────────────────────────────────

  @Post(':pollId/slots')
  @UseGuards(HostGuard)
  @RequireMemberRole(MemberRole.HOST)
  @HttpCode(HttpStatus.CREATED)
  async addSlot(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Param('pollId', ParseUlidPipe) pollId: string,
    @Body(new ZodValidationPipe(addSlotSchema)) dto: AddSlotDto,
  ) {
    return this.service.addSlot(invitationId, pollId, dto);
  }

  @Patch(':pollId/slots/:slotId')
  @UseGuards(HostGuard)
  @RequireMemberRole(MemberRole.HOST)
  async updateSlot(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Param('pollId', ParseUlidPipe) pollId: string,
    @Param('slotId', ParseUlidPipe) slotId: string,
    @Body(new ZodValidationPipe(updateSlotSchema)) dto: UpdateSlotDto,
  ) {
    return this.service.updateSlot(invitationId, pollId, slotId, dto);
  }

  @Delete(':pollId/slots/:slotId')
  @UseGuards(HostGuard)
  @RequireMemberRole(MemberRole.HOST)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSlot(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Param('pollId', ParseUlidPipe) pollId: string,
    @Param('slotId', ParseUlidPipe) slotId: string,
  ) {
    await this.service.deleteSlot(invitationId, pollId, slotId);
  }

  // ── Responses ───────────────────────────────────────────────────────────────

  @Put(':pollId/responses')
  @UseGuards(ParticipantGuard)
  @HttpCode(HttpStatus.OK)
  async submitResponses(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Param('pollId', ParseUlidPipe) pollId: string,
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(submitResponsesSchema)) dto: SubmitResponsesDto,
  ) {
    return this.service.submitResponses(invitationId, pollId, user.id, dto);
  }

  // ── Results ─────────────────────────────────────────────────────────────────

  @Get(':pollId/results')
  @UseGuards(ParticipantGuard)
  async getResults(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Param('pollId', ParseUlidPipe) pollId: string,
  ) {
    return this.service.getResults(invitationId, pollId);
  }

  // ── Close / Confirm ─────────────────────────────────────────────────────────

  @Post(':pollId/close')
  @UseGuards(HostGuard)
  @RequireMemberRole(MemberRole.HOST)
  @HttpCode(HttpStatus.OK)
  async closePoll(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Param('pollId', ParseUlidPipe) pollId: string,
  ) {
    return this.service.closePoll(invitationId, pollId);
  }

  @Post(':pollId/confirm')
  @UseGuards(HostGuard)
  @RequireMemberRole(MemberRole.HOST)
  @HttpCode(HttpStatus.OK)
  async confirmSlot(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Param('pollId', ParseUlidPipe) pollId: string,
    @Body(new ZodValidationPipe(confirmSlotSchema)) dto: ConfirmSlotDto,
  ) {
    return this.service.confirmSlot(invitationId, pollId, dto);
  }

  @Post(':pollId/unconfirm')
  @UseGuards(HostGuard)
  @RequireMemberRole(MemberRole.HOST)
  @HttpCode(HttpStatus.OK)
  async unconfirmSlot(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Param('pollId', ParseUlidPipe) pollId: string,
  ) {
    return this.service.unconfirmSlot(invitationId, pollId);
  }
}
