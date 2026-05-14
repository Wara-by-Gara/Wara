import { Injectable } from '@nestjs/common';

/**
 * invitation 차단 조회 Repository (placeholder).
 *
 * 현재는 `NotImplemented`를 throw하는 placeholder.
 * 하림 schema 추가 후 Drizzle 구현으로 본문을 교체한다.
 *
 * - 필요 schema: `invitation_blocklists` 테이블 (아직 미존재 — 후속 이슈)
 *   컬럼: `(invitation_id, blocked_user_id, blocked_by_user_id, reason?, created_at)`
 * - DI 등록 위치: `apps/api/src/auth/auth.module.ts`
 * - 사용처: `apps/api/src/common/guards/blocklist.guard.ts`
 */
@Injectable()
export class BlocklistRepository {
  async isBlocked(_userId: string, _invitationId: string): Promise<boolean> {
    throw new Error('BlocklistRepository.isBlocked: NotImplemented');
  }
}
