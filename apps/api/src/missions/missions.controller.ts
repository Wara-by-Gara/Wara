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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireMemberRole } from '../common/decorators/member-role.decorator';
import { MemberRole } from '../common/enums/member-role.enum';
import { HostGuard } from '../common/guards/host.guard';
import { ParseUlidPipe } from '../common/pipes/parse-ulid.pipe';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { JwtPayload } from '../common/types/jwt-payload.type';
import {
  AssignMissionsDto,
  AssignMissionsSchema,
} from './dto/assign-missions.dto';
import {
  CreateMissionDto,
  CreateMissionSchema,
} from './dto/create-mission.dto';
import {
  UpdateMissionDto,
  UpdateMissionSchema,
} from './dto/update-mission.dto';
import { MissionsService } from './missions.service';

@ApiTags('Missions')
@ApiBearerAuth('access-token')
@Controller('invitations/:invitationId/missions')
export class MissionsController {
  constructor(private readonly missionsService: MissionsService) {}

  @Get()
  @ApiOperation({ summary: '미션 목록 조회' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({ status: 404, description: 'PARTICIPANT_NOT_FOUND' })
  async list(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.missionsService.list(invitationId, user.id);
  }

  @Get('me')
  @ApiOperation({ summary: '내 미션 조회' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({ status: 404, description: 'MISSION_NOT_ASSIGNED' })
  async getMine(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.missionsService.getMyMission(invitationId, user.id);
  }

  @Post()
  @UseGuards(HostGuard)
  @RequireMemberRole(MemberRole.HOST)
  @ApiOperation({ summary: '미션 생성 (HOST 전용)' })
  @ApiResponse({ status: 201, description: '성공' })
  @ApiResponse({ status: 400, description: 'MISSION_NOT_ENABLED' })
  @ApiResponse({ status: 403, description: 'INSUFFICIENT_ROLE' })
  async create(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Body(new ZodValidationPipe(CreateMissionSchema)) dto: CreateMissionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.missionsService.create(invitationId, user.id, dto);
  }

  @Post('assign')
  @UseGuards(HostGuard)
  @RequireMemberRole(MemberRole.HOST)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '미션 일괄 배정 (HOST 전용)' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({ status: 400, description: 'MISSION_NO_MISSIONS_TO_ASSIGN | MISSION_NO_PARTICIPANTS_TO_ASSIGN' })
  @ApiResponse({ status: 403, description: 'INSUFFICIENT_ROLE' })
  async assign(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Body(new ZodValidationPipe(AssignMissionsSchema))
    dto: AssignMissionsDto,
  ) {
    return this.missionsService.assignMissions(invitationId, dto);
  }

  @Patch(':id')
  @UseGuards(HostGuard)
  @RequireMemberRole(MemberRole.HOST)
  @ApiOperation({ summary: '미션 수정 (HOST 전용)' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({ status: 403, description: 'INSUFFICIENT_ROLE' })
  @ApiResponse({ status: 404, description: 'MISSION_NOT_FOUND' })
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
  @ApiOperation({ summary: '미션 삭제 (HOST 전용)' })
  @ApiResponse({ status: 204, description: '성공' })
  @ApiResponse({ status: 403, description: 'INSUFFICIENT_ROLE' })
  @ApiResponse({ status: 404, description: 'MISSION_NOT_FOUND' })
  async remove(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Param('id', ParseUlidPipe) missionId: string,
  ): Promise<void> {
    await this.missionsService.delete(invitationId, missionId);
  }
}
