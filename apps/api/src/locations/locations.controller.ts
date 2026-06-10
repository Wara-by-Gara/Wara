import {
  Controller,
  Get,
  Put,
  Patch,
  Post,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { LocationsService } from './locations.service';
import { BlocklistGuard } from '../common/guards/blocklist.guard';
import { HostGuard } from '../common/guards/host.guard';
import { ParticipantGuard } from '../common/guards/participant.guard';
import { RequireMemberRole } from '../common/decorators/member-role.decorator';
import { MemberRole } from '../common/enums/member-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  SetEventLocationSchema,
  type SetEventLocationDto,
} from './dto/set-event-location.dto';
import {
  UpdateParticipantLocationSchema,
  type UpdateParticipantLocationDto,
} from './dto/update-participant-location.dto';
import {
  UpdateStatusMessageSchema,
  type UpdateStatusMessageDto,
} from './dto/update-status-message.dto';
import { ParseUlidPipe } from '../common/pipes/parse-ulid.pipe';
import type { JwtPayload } from '../common/types/jwt-payload.type';

@Controller('invitations/:invitationId')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get('location')
  @UseGuards(BlocklistGuard, ParticipantGuard)
  getEventLocation(@Param('invitationId') invitationId: string) {
    return this.locationsService.getEventLocation(invitationId);
  }

  @Put('location')
  @UseGuards(HostGuard)
  @RequireMemberRole(MemberRole.HOST)
  setEventLocation(
    @Param('invitationId') invitationId: string,
    @Body(new ZodValidationPipe(SetEventLocationSchema))
    dto: SetEventLocationDto,
  ) {
    return this.locationsService.setEventLocation(invitationId, dto);
  }

  @Delete('location')
  @UseGuards(HostGuard)
  @RequireMemberRole(MemberRole.HOST)
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteEventLocation(@Param('invitationId') invitationId: string) {
    return this.locationsService.deleteEventLocation(invitationId);
  }

  @Get('participant/locations')
  @UseGuards(BlocklistGuard, ParticipantGuard)
  getParticipantLocations(@Param('invitationId') invitationId: string) {
    return this.locationsService.getParticipantLocations(invitationId);
  }

  @Put('participant/me/location')
  @UseGuards(BlocklistGuard, ParticipantGuard)
  updateMyLocation(
    @Param('invitationId') invitationId: string,
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(UpdateParticipantLocationSchema))
    dto: UpdateParticipantLocationDto,
  ) {
    return this.locationsService.updateMyLocation(invitationId, user.id, dto);
  }

  // 사용자가 자기 GPS 공유를 즉시 종료. 본인 entry만 정리, 다른 참여자 무영향.
  @Delete('participant/me/location')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(BlocklistGuard, ParticipantGuard)
  stopMyLocationSharing(
    @Param('invitationId') invitationId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.locationsService.stopMyLocationSharing(invitationId, user.id);
  }

  // 미도착 멤버가 broadcast하는 상태메시지 설정/수정. 위치 공유 중에만 가능.
  @Patch('participant/me/status-message')
  @UseGuards(BlocklistGuard, ParticipantGuard)
  updateMyStatusMessage(
    @Param('invitationId') invitationId: string,
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(UpdateStatusMessageSchema))
    dto: UpdateStatusMessageDto,
  ) {
    return this.locationsService.updateMyStatusMessage(
      invitationId,
      user.id,
      dto.message,
    );
  }

  @Delete('participant/me/status-message')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(BlocklistGuard, ParticipantGuard)
  deleteMyStatusMessage(
    @Param('invitationId') invitationId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.locationsService.deleteMyStatusMessage(invitationId, user.id);
  }

  @Post('participants/:participantId/nudge')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(HostGuard)
  @RequireMemberRole(MemberRole.HOST)
  nudgeParticipant(
    @Param('invitationId') invitationId: string,
    @Param('participantId', ParseUlidPipe) participantId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.locationsService.nudgeParticipant(invitationId, user.id, participantId);
  }
}
