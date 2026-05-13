import { Injectable } from '@nestjs/common';

/**
 * invitation 차단 조회 Repository.
 * 현재는 placeholder — Drizzle 구현이 들어오면 메서드 본문을 교체한다.
 */
@Injectable()
export class BlocklistRepository {
  async isBlocked(_userId: string, _invitationId: string): Promise<boolean> {
    throw new Error('BlocklistRepository.isBlocked: NotImplemented');
  }
}
