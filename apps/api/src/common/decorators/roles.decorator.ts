import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * 라우트에 허용 role을 지정하는 데코레이터
 *
 * 사용: @Roles('HOST') 또는 @Roles('HOST', 'admin')
 * RolesGuard와 항상 함께 사용해야 동작함
 *
 * 예시:
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   @Roles('HOST')
 *   @Delete(':id')
 *   deleteParticipant() { ... }
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
