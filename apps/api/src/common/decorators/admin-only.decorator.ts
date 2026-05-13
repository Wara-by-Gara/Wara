import { Roles, ROLES_KEY } from './roles.decorator';
import { UserRole } from '../enums/role.enum';

/**
 * 관리자 전용 endpoint 데코레이터.
 * `@Roles(UserRole.ADMIN)`의 별칭 — 의도를 명시하기 위해 별도 이름 제공.
 *
 * 와라는 단순 role(member/admin) 기반 권한 구조라 RolesGuard만으로 검증.
 * scope 기반 세분화 권한이 필요해지면 별도 Guard로 확장.
 */
export const AdminOnly = () => Roles(UserRole.ADMIN);

export { ROLES_KEY };
