import { Injectable } from '@nestjs/common';

export interface AdminInvitationView {
  id: string;
  userId: string;
  title: string;
  status: 'active' | 'closed';
  closedAt: Date | null;
  closedReason: string | null;
}

/**
 * Admin이 사용하는 invitation 조회/강제 종료 Repository.
 * 현재는 placeholder — Drizzle 구현이 들어오면 메서드 본문을 교체한다.
 */
@Injectable()
export class InvitationAdminRepository {
  async findById(_id: string): Promise<AdminInvitationView | null> {
    throw new Error('InvitationAdminRepository.findById: NotImplemented');
  }

  async close(
    _id: string,
    _reason: string | null,
  ): Promise<AdminInvitationView> {
    throw new Error('InvitationAdminRepository.close: NotImplemented');
  }
}
