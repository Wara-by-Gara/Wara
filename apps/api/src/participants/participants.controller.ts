import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ParticipantsService } from './participants.service';
import { JoinInvitationSchema, JoinInvitationDto } from './dto/join-invitation.dto';
import { UpdateRsvpSchema, UpdateRsvpDto } from './dto/update-rsvp.dto';
import { UpdateHiddenSchema, UpdateHiddenDto } from './dto/update-hidden.dto';
import { UpdateHostMemoSchema, UpdateHostMemoDto } from './dto/update-host-memo.dto';
import { ParticipantGuard } from '../common/guards/participant.guard';
import { HostGuard } from '../common/guards/host.guard';
import { RsvpStatusGuard } from '../common/guards/rsvp-status.guard';
import { RequireRsvpStatus } from '../common/decorators/require-rsvp-status.decorator';
import { RequireMemberRole } from '../common/decorators/member-role.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentParticipant } from '../common/decorators/current-participant.decorator';
import { ParseUlidPipe } from '../common/pipes/parse-ulid.pipe';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { RsvpStatus } from '../common/enums/rsvp-status.enum';
import { MemberRole } from '../common/enums/member-role.enum';
import type { JwtPayload } from '../common/types/jwt-payload.type';
import type { Participant } from '../database/schema';

@Controller('invitations/:invitationId/participants')
export class ParticipantsController {
  constructor(private readonly participantsService: ParticipantsService) {}

  @Get()
  @UseGuards(ParticipantGuard)
  findAll(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @CurrentParticipant() viewer: Participant,
  ) {
    return this.participantsService.findAll(invitationId, viewer);
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

  @Patch(':participantId/host-memo')
  @UseGuards(ParticipantGuard, HostGuard)
  @RequireMemberRole(MemberRole.HOST)
  updateHostMemo(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Param('participantId', ParseUlidPipe) participantId: string,
    @Body(new ZodValidationPipe(UpdateHostMemoSchema)) dto: UpdateHostMemoDto,
  ) {
    return this.participantsService.updateHostMemo(invitationId, participantId, dto.memo);
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
