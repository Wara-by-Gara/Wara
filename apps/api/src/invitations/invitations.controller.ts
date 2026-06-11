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
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { InvitationsService } from './invitations.service';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireMemberRole } from '../common/decorators/member-role.decorator';
import { HostGuard } from '../common/guards/host.guard';
import { MemberRole } from '../common/enums/member-role.enum';
import { ParseUlidPipe } from '../common/pipes/parse-ulid.pipe';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  CreateInvitationDto,
  CreateInvitationSchema,
} from './dto/create-invitation.dto';
import {
  UpdateInvitationDto,
  UpdateInvitationSchema,
} from './dto/update-invitation.dto';
import type { JwtPayload } from '../common/types/jwt-payload.type';
import {
  InvitationPresignedUrlDto,
  InvitationPresignedUrlSchema,
} from './dto/invitation-presigned-url.dto';
import { ApplyAiImageDto, ApplyAiImageSchema } from './dto/apply-ai-image.dto';
import {
  ListPublicInvitationsDto,
  ListPublicInvitationsSchema,
} from './dto/list-public-invitations.dto';
import {
  ListPublicMapInvitationsDto,
  ListPublicMapInvitationsSchema,
} from './dto/list-public-map-invitations.dto';

@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.invitationsService.findAll(user.id);
  }

  @Post('presigned-url')
  generatePresignedUrl(
    @Body(new ZodValidationPipe(InvitationPresignedUrlSchema))
    dto: InvitationPresignedUrlDto,
  ) {
    return this.invitationsService.generatePresignedUrl(dto);
  }

  /** 탐색·추천 이벤트 — 공개 초대장만 */
  @Public()
  @Get('explore')
  findPublicExplore(
    @Query(new ZodValidationPipe(ListPublicInvitationsSchema))
    dto: ListPublicInvitationsDto,
  ) {
    return this.invitationsService.findPublicExplore(dto);
  }

  /** 탐색 지도 — bbox 안의 공개 초대장 마커 */
  @Public()
  @Get('explore/map')
  findPublicForMap(
    @Query(new ZodValidationPipe(ListPublicMapInvitationsSchema))
    dto: ListPublicMapInvitationsDto,
  ) {
    return this.invitationsService.findPublicForMap(dto);
  }

  @Get('hidden')
  findHidden(@CurrentUser() user: JwtPayload) {
    return this.invitationsService.findHidden(user.id);
  }

  @Public()
  @Get(':invitationId')
  findOne(@Param('invitationId', ParseUlidPipe) id: string) {
    return this.invitationsService.findOne(id);
  }

  @Post()
  create(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(CreateInvitationSchema))
    dto: CreateInvitationDto,
  ) {
    return this.invitationsService.create(user.id, dto);
  }

  @RequireMemberRole(MemberRole.HOST)
  @UseGuards(HostGuard)
  @Patch(':invitationId')
  update(
    @Param('invitationId', ParseUlidPipe) id: string,
    @Body(new ZodValidationPipe(UpdateInvitationSchema))
    dto: UpdateInvitationDto,
  ) {
    return this.invitationsService.update(id, dto);
  }

  @RequireMemberRole(MemberRole.HOST)
  @UseGuards(HostGuard)
  @Delete(':invitationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('invitationId', ParseUlidPipe) id: string) {
    return this.invitationsService.remove(id);
  }

  /** AI 합성 잡 생성 — 즉시 { jobId } 반환 (202), 백그라운드 처리 */
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @RequireMemberRole(MemberRole.HOST)
  @UseGuards(HostGuard)
  @Post(':invitationId/main-image/ai')
  @HttpCode(HttpStatus.ACCEPTED)
  applyAiToMainImage(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Body(new ZodValidationPipe(ApplyAiImageSchema)) dto: ApplyAiImageDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.invitationsService.applyAiToMainImage(invitationId, dto, user.id);
  }

  /** AI 잡 상태 조회 (폴링 fallback 또는 재방문 시 상태 복구용) */
  @RequireMemberRole(MemberRole.HOST)
  @UseGuards(HostGuard)
  @Get(':invitationId/main-image/ai/jobs/:jobId')
  getAiJobStatus(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Param('jobId', ParseUlidPipe) jobId: string,
  ) {
    return this.invitationsService.getAiJobStatus(invitationId, jobId);
  }
}
