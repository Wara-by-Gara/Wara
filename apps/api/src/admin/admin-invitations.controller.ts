import { Body, Controller, Delete, Get, Param, Patch, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { AdminOnly } from '../common/decorators/admin-only.decorator';
import { ParseUlidPipe } from '../common/pipes/parse-ulid.pipe';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AdminManagementService } from './admin-management.service';
import {
  listInvitationsSchema,
  updateInvitationStatusSchema,
  type ListInvitationsDto,
  type UpdateInvitationStatusDto,
} from './dto/admin-management.dto';

@Controller('admin/invitations')
@AdminOnly()
export class AdminInvitationsController {
  constructor(private readonly service: AdminManagementService) {}

  @Get()
  list(@Query(new ZodValidationPipe(listInvitationsSchema)) dto: ListInvitationsDto) {
    return this.service.listInvitations(dto);
  }

  @Get(':id')
  get(@Param('id', ParseUlidPipe) id: string) {
    return this.service.getInvitation(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUlidPipe) id: string,
    @Body(new ZodValidationPipe(updateInvitationStatusSchema)) dto: UpdateInvitationStatusDto,
  ) {
    return this.service.setInvitationStatus(id, dto.status);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUlidPipe) id: string) {
    await this.service.deleteInvitation(id);
  }
}
