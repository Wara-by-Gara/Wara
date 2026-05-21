import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LocationsService } from './locations.service';
import { HostGuard } from '../common/guards/host.guard';
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
import type { JwtPayload } from '../common/types/jwt-payload.type';

@ApiTags('Locations')
@ApiBearerAuth('access-token')
@Controller('invitations/:invitationId')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get('location')
  @ApiOperation({ summary: '행사 장소 조회' })
  @ApiResponse({ status: 200, description: '성공 (장소 미설정 시 null)' })
  getEventLocation(@Param('invitationId') invitationId: string) {
    return this.locationsService.getEventLocation(invitationId);
  }

  @Put('location')
  @UseGuards(HostGuard)
  @RequireMemberRole(MemberRole.HOST)
  @ApiOperation({ summary: '행사 장소 등록/수정 (HOST 전용)' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({ status: 400, description: 'VALIDATION_ERROR' })
  @ApiResponse({ status: 403, description: 'INSUFFICIENT_ROLE' })
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
  @ApiOperation({ summary: '행사 장소 삭제 (HOST 전용)' })
  @ApiResponse({ status: 204, description: '성공' })
  @ApiResponse({ status: 403, description: 'INSUFFICIENT_ROLE' })
  deleteEventLocation(@Param('invitationId') invitationId: string) {
    return this.locationsService.deleteEventLocation(invitationId);
  }

  @Get('participant/locations')
  @ApiOperation({ summary: '참가자 위치 목록 조회' })
  @ApiResponse({ status: 200, description: '성공' })
  getParticipantLocations(@Param('invitationId') invitationId: string) {
    return this.locationsService.getParticipantLocations(invitationId);
  }

  @Put('participant/me/location')
  @ApiOperation({ summary: '내 위치 등록/수정' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({ status: 400, description: 'VALIDATION_ERROR' })
  updateMyLocation(
    @Param('invitationId') invitationId: string,
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(UpdateParticipantLocationSchema))
    dto: UpdateParticipantLocationDto,
  ) {
    return this.locationsService.updateMyLocation(invitationId, user.id, dto);
  }
}
