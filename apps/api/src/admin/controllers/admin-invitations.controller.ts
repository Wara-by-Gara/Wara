import { Body, Controller, Param, Patch } from '@nestjs/common';
import { AdminOnly } from '../../common/decorators/admin-only.decorator';
import { ParseUlidPipe } from '../../common/pipes/parse-ulid.pipe';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AdminAction } from '../decorators/admin-action.decorator';
import {
  UpdateInvitationStatusDto,
  UpdateInvitationStatusSchema,
} from '../dto/update-invitation-status.dto';
import { AdminInvitationsService } from '../services/admin-invitations.service';

@AdminOnly()
@Controller('admin/invitations')
export class AdminInvitationsController {
  constructor(
    private readonly adminInvitationsService: AdminInvitationsService,
  ) {}

  @Patch(':id/status')
  @AdminAction('invitations.status.update', 'invitation')
  async updateStatus(
    @Param('id', ParseUlidPipe) invitationId: string,
    @Body(new ZodValidationPipe(UpdateInvitationStatusSchema))
    dto: UpdateInvitationStatusDto,
  ) {
    return this.adminInvitationsService.updateStatus(invitationId, dto);
  }
}
