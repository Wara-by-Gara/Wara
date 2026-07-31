import { Body, Controller, Get, Param, Patch, Post, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { AdminOnly } from '../common/decorators/admin-only.decorator';
import { ParseUlidPipe } from '../common/pipes/parse-ulid.pipe';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AdminManagementService } from './admin-management.service';
import {
  listUsersSchema,
  suspendUserSchema,
  updateUserRoleSchema,
  type ListUsersDto,
  type SuspendUserDto,
  type UpdateUserRoleDto,
} from './dto/admin-management.dto';

@Controller('admin/users')
@AdminOnly()
export class AdminUsersController {
  constructor(private readonly service: AdminManagementService) {}

  @Get()
  list(@Query(new ZodValidationPipe(listUsersSchema)) dto: ListUsersDto) {
    return this.service.listUsers(dto);
  }

  @Get(':id')
  get(@Param('id', ParseUlidPipe) id: string) {
    return this.service.getUser(id);
  }

  @Post(':id/suspend')
  @HttpCode(HttpStatus.OK)
  suspend(
    @Param('id', ParseUlidPipe) id: string,
    @Body(new ZodValidationPipe(suspendUserSchema)) dto: SuspendUserDto,
  ) {
    return this.service.suspendUser(id, dto.reason ?? null);
  }

  @Post(':id/unsuspend')
  @HttpCode(HttpStatus.OK)
  unsuspend(@Param('id', ParseUlidPipe) id: string) {
    return this.service.unsuspendUser(id);
  }

  @Patch(':id/role')
  @HttpCode(HttpStatus.OK)
  updateRole(
    @Param('id', ParseUlidPipe) id: string,
    @Body(new ZodValidationPipe(updateUserRoleSchema)) dto: UpdateUserRoleDto,
  ) {
    return this.service.updateUserRole(id, dto.role);
  }
}
