import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InvitationsService } from './invitations.service';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireMemberRole } from '../common/decorators/member-role.decorator';
import { HostGuard } from '../common/guards/host.guard';
import { MemberRole } from '../common/enums/member-role.enum';
import { ParseUlidPipe } from '../common/pipes/parse-ulid.pipe';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CreateInvitationDto, CreateInvitationSchema } from './dto/create-invitation.dto';
import { UpdateInvitationDto, UpdateInvitationSchema } from './dto/update-invitation.dto';
import type { JwtPayload } from '../common/types/jwt-payload.type';

@ApiTags('Invitations')
@ApiBearerAuth('access-token')
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Get()
  @ApiOperation({ summary: '내 초대장 목록 조회' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({ status: 401, description: 'TOKEN_INVALID | TOKEN_EXPIRED' })
  async findAll(@CurrentUser() user: JwtPayload) {
    return this.invitationsService.findAll(user.id);
  }

  @Public()
  @Get(':invitationId')
  @ApiOperation({ summary: '초대장 단건 조회 (공개)' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({ status: 404, description: 'INVITATION_NOT_FOUND' })
  findOne(@Param('invitationId', ParseUlidPipe) id: string) {
    return this.invitationsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '초대장 생성' })
  @ApiResponse({ status: 201, description: '성공' })
  @ApiResponse({ status: 401, description: 'TOKEN_INVALID | TOKEN_EXPIRED' })
  create(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(CreateInvitationSchema)) dto: CreateInvitationDto,
  ) {
    return this.invitationsService.create(user.id, dto);
  }

  @RequireMemberRole(MemberRole.HOST)
  @UseGuards(HostGuard)
  @Patch(':invitationId')
  @ApiOperation({ summary: '초대장 수정 (HOST 전용)' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({ status: 403, description: 'INSUFFICIENT_ROLE' })
  @ApiResponse({ status: 404, description: 'INVITATION_NOT_FOUND' })
  update(
    @Param('invitationId', ParseUlidPipe) id: string,
    @Body(new ZodValidationPipe(UpdateInvitationSchema)) dto: UpdateInvitationDto,
  ) {
    return this.invitationsService.update(id, dto);
  }

  @RequireMemberRole(MemberRole.HOST)
  @UseGuards(HostGuard)
  @Delete(':invitationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '초대장 삭제 (HOST 전용)' })
  @ApiResponse({ status: 204, description: '성공' })
  @ApiResponse({ status: 403, description: 'INSUFFICIENT_ROLE' })
  @ApiResponse({ status: 404, description: 'INVITATION_NOT_FOUND' })
  remove(@Param('invitationId', ParseUlidPipe) id: string) {
    return this.invitationsService.remove(id);
  }
}
