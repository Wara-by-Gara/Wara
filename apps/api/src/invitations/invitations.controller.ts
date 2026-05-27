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

@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Get()
  async findAll(@CurrentUser() user: JwtPayload) {
    return this.invitationsService.findAll(user.id);
  }

  @Post('presigned-url')
  generatePresignedUrl(
    @Body(new ZodValidationPipe(InvitationPresignedUrlSchema))
    dto: InvitationPresignedUrlDto,
  ) {
    return this.invitationsService.generatePresignedUrl(dto);
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

  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 1분에 3회 제한 (AI 비용 보호)
  @RequireMemberRole(MemberRole.HOST)
  @UseGuards(HostGuard)
  @Post(':invitationId/main-image/ai')
  applyAiToMainImage(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Body(new ZodValidationPipe(ApplyAiImageSchema)) dto: ApplyAiImageDto,
  ) {
    return this.invitationsService.applyAiToMainImage(invitationId, dto);
  }
}
