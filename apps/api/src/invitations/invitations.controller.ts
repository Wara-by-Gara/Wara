import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireMemberRole } from '../common/decorators/member-role.decorator';
import { HostGuard } from '../common/guards/host.guard';
import { MemberRole } from '../common/enums/member-role.enum';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CreateInvitationDto, CreateInvitationSchema } from './dto/create-invitation.dto';
import { UpdateInvitationDto, UpdateInvitationSchema } from './dto/update-invitation.dto';
import type { JwtPayload } from '../common/types/jwt-payload.type';

@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.invitationsService.findAll(user.id);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invitationsService.findOne(id);
  }

  @Post()
  create(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(CreateInvitationSchema)) dto: CreateInvitationDto,
  ) {
    return this.invitationsService.create(user.id, dto);
  }

  @RequireMemberRole(MemberRole.HOST)
  @UseGuards(HostGuard)
  @Patch(':invitationId')
  update(
    @Param('invitationId') id: string,
    @Body(new ZodValidationPipe(UpdateInvitationSchema)) dto: UpdateInvitationDto,
  ) {
    return this.invitationsService.update(id, dto);
  }

  @RequireMemberRole(MemberRole.HOST)
  @UseGuards(HostGuard)
  @Delete(':invitationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('invitationId') id: string) {
    return this.invitationsService.remove(id);
  }
}
