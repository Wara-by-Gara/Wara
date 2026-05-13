import { Body, Controller, Param, Patch } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminOnly } from '../../common/decorators/admin-only.decorator';
import { ParseUlidPipe } from '../../common/pipes/parse-ulid.pipe';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtPayload } from '../../common/types/jwt-payload.type';
import { AdminAction } from '../decorators/admin-action.decorator';
import {
  UpdateUserStatusDto,
  UpdateUserStatusSchema,
} from '../dto/update-user-status.dto';
import { AdminUsersService } from '../services/admin-users.service';

@AdminOnly()
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Patch(':id/status')
  @AdminAction('users.status.update', 'user')
  async updateStatus(
    @CurrentUser() actor: JwtPayload,
    @Param('id', ParseUlidPipe) targetUserId: string,
    @Body(new ZodValidationPipe(UpdateUserStatusSchema))
    dto: UpdateUserStatusDto,
  ) {
    return this.adminUsersService.updateStatus(actor.id, targetUserId, dto);
  }
}
