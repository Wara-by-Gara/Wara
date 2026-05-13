import { SetMetadata } from '@nestjs/common';
import { MemberRole } from '../enums/member-role.enum';

export const MEMBER_ROLE_KEY = 'memberRoles';

export const RequireMemberRole = (...roles: MemberRole[]) =>
  SetMetadata(MEMBER_ROLE_KEY, roles);
