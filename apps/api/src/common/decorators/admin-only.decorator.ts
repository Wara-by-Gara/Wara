import { applyDecorators, SetMetadata } from '@nestjs/common';
import { Roles, ROLES_KEY } from './roles.decorator';
import { UserRole } from '../enums/role.enum';

export const ADMIN_SCOPE_KEY = 'requireAdminScope';

export const AdminOnly = () =>
  applyDecorators(
    Roles(UserRole.ADMIN),
    SetMetadata(ADMIN_SCOPE_KEY, true),
  );

export { ROLES_KEY };
