import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireMemberRole } from '../common/decorators/member-role.decorator';
import { MemberRole } from '../common/enums/member-role.enum';
import { HostGuard } from '../common/guards/host.guard';
import { ParseUlidPipe } from '../common/pipes/parse-ulid.pipe';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { JwtPayload } from '../common/types/jwt-payload.type';
import {
  CreateMissionDto,
  CreateMissionSchema,
} from './dto/create-mission.dto';
import {
  UpdateMissionDto,
  UpdateMissionSchema,
} from './dto/update-mission.dto';
import { MissionsService } from './missions.service';

@Controller('invitations/:invitationId/missions')
export class MissionsController {
  constructor(private readonly missionsService: MissionsService) {}

  @Get()
  async list(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.missionsService.list(invitationId, user.id);
  }

  @Post()
  @UseGuards(HostGuard)
  @RequireMemberRole(MemberRole.HOST)
  async create(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Body(new ZodValidationPipe(CreateMissionSchema)) dto: CreateMissionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.missionsService.create(invitationId, user.id, dto);
  }

  @Patch(':id')
  @UseGuards(HostGuard)
  @RequireMemberRole(MemberRole.HOST)
  async update(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Param('id', ParseUlidPipe) missionId: string,
    @Body(new ZodValidationPipe(UpdateMissionSchema)) dto: UpdateMissionDto,
  ) {
    return this.missionsService.update(invitationId, missionId, dto);
  }

  @Delete(':id')
  @UseGuards(HostGuard)
  @RequireMemberRole(MemberRole.HOST)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Param('id', ParseUlidPipe) missionId: string,
  ): Promise<void> {
    await this.missionsService.delete(invitationId, missionId);
  }
}
