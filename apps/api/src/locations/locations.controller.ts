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

@Controller('invitations/:invitationId')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get('location')
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
  getParticipantLocations(@Param('invitationId') invitationId: string) {
    return this.locationsService.getParticipantLocations(invitationId);
  }

  @Put('participant/me/location')
  updateMyLocation(
    @Param('invitationId') invitationId: string,
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(UpdateParticipantLocationSchema))
    dto: UpdateParticipantLocationDto,
  ) {
    return this.locationsService.updateMyLocation(invitationId, user.id, dto);
  }
}
