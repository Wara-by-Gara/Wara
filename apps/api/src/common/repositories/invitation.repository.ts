import { Injectable } from '@nestjs/common';

/**
 * invitation 조회 Repository (placeholder).
 *
 * 현재는 `NotImplemented`를 throw하는 placeholder.
 * 하림 schema 추가 후 Drizzle 구현으로 본문을 교체한다.
 *
 * - 필요 schema: `invitations.is_private` + `access_password_hash` 컬럼 (아직 미존재 — 후속 이슈)
 * - DI 등록 위치: `apps/api/src/auth/auth.module.ts`
 * - 사용처: `apps/api/src/common/guards/private-invitation.guard.ts`
 */
@Injectable()
export class InvitationRepository {
  async isPrivate(_invitationId: string): Promise<boolean> {
    throw new Error('InvitationRepository.isPrivate: NotImplemented');
  }
}
