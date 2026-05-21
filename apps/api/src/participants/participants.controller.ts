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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
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

@ApiTags('Participants')
@ApiBearerAuth('access-token')
@Controller('invitations/:invitationId/participants')
export class ParticipantsController {
  constructor(private readonly participantsService: ParticipantsService) {}

  @Get()
  @UseGuards(ParticipantGuard, RsvpStatusGuard)
  @RequireRsvpStatus(RsvpStatus.ATTENDING, RsvpStatus.UNDECIDED)
  @ApiOperation({ summary: '참가자 목록 조회' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({ status: 403, description: 'RSVP_PERMISSION_DENIED | INVITATION_ACCESS_REVOKED' })
  @ApiResponse({ status: 404, description: 'PARTICIPANT_NOT_FOUND' })
  findAll(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Query(new ZodValidationPipe(ListParticipantsQuerySchema)) query: ListParticipantsQuery,
    @CurrentParticipant() viewer: Participant,
  ) {
    return this.participantsService.findAll(invitationId, query.rsvpStatus, viewer.memberRole);
  }

  @Get('me')
  @UseGuards(ParticipantGuard)
  getMyParticipant(@CurrentParticipant() participant: Participant) {
    return { participant };
  }

  @Get(':participantId/profile')
  @UseGuards(ParticipantGuard, RsvpStatusGuard)
  @RequireRsvpStatus(RsvpStatus.ATTENDING, RsvpStatus.UNDECIDED)
  @ApiOperation({ summary: '참가자 프로필 조회' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({ status: 403, description: 'RSVP_PERMISSION_DENIED' })
  @ApiResponse({ status: 404, description: 'PARTICIPANT_NOT_FOUND' })
  getProfile(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Param('participantId', ParseUlidPipe) participantId: string,
  ) {
    return this.participantsService.getProfile(invitationId, participantId);
  }

  @Get(':participantId/mutual')
  @UseGuards(ParticipantGuard, RsvpStatusGuard)
  @RequireRsvpStatus(RsvpStatus.ATTENDING, RsvpStatus.UNDECIDED)
  @ApiOperation({ summary: '공통 참가 초대장 수 조회' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({ status: 404, description: 'PARTICIPANT_NOT_FOUND' })
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
  @ApiOperation({ summary: '함께 참가한 초대장 목록 조회' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({ status: 404, description: 'PARTICIPANT_NOT_FOUND' })
  getSharedInvitations(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Param('participantId', ParseUlidPipe) participantId: string,
    @CurrentParticipant() viewer: Participant,
  ) {
    return this.participantsService.getSharedInvitations(invitationId, participantId, viewer);
  }

  @Post()
  @ApiOperation({ summary: '초대장 참가' })
  @ApiResponse({ status: 201, description: '성공' })
  @ApiResponse({ status: 403, description: 'INVITATION_ACCESS_REVOKED' })
  @ApiResponse({ status: 404, description: 'PARTICIPANT_NOT_FOUND' })
  @ApiResponse({ status: 409, description: 'PARTICIPANT_ALREADY_EXISTS' })
  @ApiResponse({ status: 422, description: 'INVITATION_CLOSED' })
  join(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(JoinInvitationSchema)) dto: JoinInvitationDto,
  ) {
    return this.participantsService.join(user!.id, invitationId, dto);
  }

  @Patch('me/hidden')
  @UseGuards(ParticipantGuard)
  @ApiOperation({ summary: '내 프로필 숨김 설정' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({ status: 404, description: 'PARTICIPANT_NOT_FOUND' })
  updateHidden(
    @CurrentParticipant() viewer: Participant,
    @Body(new ZodValidationPipe(UpdateHiddenSchema)) dto: UpdateHiddenDto,
  ) {
    return this.participantsService.updateHidden(dto.isHidden, viewer);
  }

  @Patch(':participantId/rsvp')
  @UseGuards(ParticipantGuard)
  @ApiOperation({ summary: 'RSVP 상태 변경' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({ status: 403, description: 'RSVP_PERMISSION_DENIED' })
  @ApiResponse({ status: 422, description: 'INVITATION_CLOSED' })
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
  @ApiOperation({ summary: '초대장 탈퇴 / HOST의 GUEST 강퇴' })
  @ApiResponse({ status: 204, description: '성공' })
  @ApiResponse({ status: 400, description: 'HOST_CANNOT_LEAVE' })
  @ApiResponse({ status: 403, description: 'RSVP_PERMISSION_DENIED' })
  @ApiResponse({ status: 404, description: 'PARTICIPANT_NOT_FOUND' })
  leave(
    @Param('participantId', ParseUlidPipe) participantId: string,
    @CurrentParticipant() viewer: Participant,
  ) {
    return this.participantsService.leave(participantId, viewer);
  }
}
