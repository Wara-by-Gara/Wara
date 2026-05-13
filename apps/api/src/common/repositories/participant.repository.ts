import { Injectable } from '@nestjs/common';
import { MemberRole } from '../enums/member-role.enum';

/**
 * 모임 참가자 조회 Repository.
 * 현재는 placeholder — Drizzle 구현이 들어오면 메서드 본문을 교체한다.
 */
@Injectable()
export class ParticipantRepository {
  async findMemberRole(
    _userId: string,
    _invitationId: string,
  ): Promise<MemberRole | null> {
    throw new Error('ParticipantRepository.findMemberRole: NotImplemented');
  }
}
