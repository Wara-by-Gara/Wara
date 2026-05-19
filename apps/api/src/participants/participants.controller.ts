import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ParticipantsService } from './participants.service';
import { JoinInvitationSchema, JoinInvitationDto } from './dto/join-invitation.dto';
import { UpdateRsvpSchema, UpdateRsvpDto } from './dto/update-rsvp.dto';
import { UpdateHiddenSchema, UpdateHiddenDto } from './dto/update-hidden.dto';
import { ListParticipantsQuerySchema, ListParticipantsQuery } from './dto/list-participants.dto';
import { ParticipantGuard } from '../common/guards/participant.guard';
import { RsvpStatusGuard } from '../common/guards/rsvp-status.guard';
import { RequireRsvpStatus } from '../common/decorators/require-rsvp-status.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentParticipant } from '../common/decorators/current-participant.decorator';
import { ParseUlidPipe } from '../common/pipes/parse-ulid.pipe';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { RsvpStatus } from '../common/enums/rsvp-status.enum';
import type { JwtPayload } from '../common/types/jwt-payload.type';
import type { Participant } from '../database/schema';

@Controller('invitations/:invitationId/participants')
export class ParticipantsController {
  constructor(private readonly participantsService: ParticipantsService) {}

  @Get()
  @UseGuards(ParticipantGuard, RsvpStatusGuard)
  @RequireRsvpStatus(RsvpStatus.ATTENDING, RsvpStatus.UNDECIDED)
  findAll(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Query(new ZodValidationPipe(ListParticipantsQuerySchema)) query: ListParticipantsQuery,
  ) {
    return this.participantsService.findAll(invitationId, query.rsvpStatus);
  }

  @Get('me')
  @UseGuards(ParticipantGuard)
  getMyParticipant(@CurrentParticipant() participant: Participant) {
    return { participant };
  }

  @Get(':participantId/profile')
  @UseGuards(ParticipantGuard, RsvpStatusGuard)
  @RequireRsvpStatus(RsvpStatus.ATTENDING, RsvpStatus.UNDECIDED)
  getProfile(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Param('participantId', ParseUlidPipe) participantId: string,
  ) {
    return this.participantsService.getProfile(invitationId, participantId);
  }

  @Get(':participantId/mutual')
  @UseGuards(ParticipantGuard, RsvpStatusGuard)
  @RequireRsvpStatus(RsvpStatus.ATTENDING, RsvpStatus.UNDECIDED)
  getMutual(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Param('participantId', ParseUlidPipe) participantId: string,
    @CurrentParticipant() viewer: Participant,
  ) {
    return this.participantsService.getMutual(invitationId, participantId, viewer);
  }

  @Get(':participantId/shared-invitations')
  @UseGuards(ParticipantGuard, RsvpStatusGuard)
  @RequireRsvpStatus(RsvpStatus.ATTENDING, RsvpStatus.UNDECIDED)
  getSharedInvitations(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Param('participantId', ParseUlidPipe) participantId: string,
    @CurrentParticipant() viewer: Participant,
  ) {
    return this.participantsService.getSharedInvitations(invitationId, participantId, viewer);
  }

  @Post()
  join(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(JoinInvitationSchema)) dto: JoinInvitationDto,
  ) {
    return this.participantsService.join(user!.id, invitationId, dto);
  }

  @Patch('me/hidden')
  @UseGuards(ParticipantGuard)
  updateHidden(
    @CurrentParticipant() viewer: Participant,
    @Body(new ZodValidationPipe(UpdateHiddenSchema)) dto: UpdateHiddenDto,
  ) {
    return this.participantsService.updateHidden(dto.isHidden, viewer);
  }

  @Patch(':participantId/rsvp')
  @UseGuards(ParticipantGuard)
  updateRsvp(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Param('participantId', ParseUlidPipe) participantId: string,
    @CurrentParticipant() viewer: Participant,
    @Body(new ZodValidationPipe(UpdateRsvpSchema)) dto: UpdateRsvpDto,
  ) {
    return this.participantsService.updateRsvp(invitationId, participantId, dto, viewer);
  }

  @Delete(':participantId')
  @UseGuards(ParticipantGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  leave(
    @Param('participantId', ParseUlidPipe) participantId: string,
    @CurrentParticipant() viewer: Participant,
  ) {
    return this.participantsService.leave(participantId, viewer);
  }
}
