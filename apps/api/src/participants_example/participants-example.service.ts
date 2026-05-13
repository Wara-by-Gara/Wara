import {
  Injectable,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ParticipantsExampleRepository } from './participants-example.repository';
import { UpdateRsvpDto } from './dto/update-rsvp.dto';

/**
 * 참가자 관리 서비스 — 비즈니스 로직만 담당
 *
 * SKILL Rule:
 * - DB 쿼리는 Repository에 위임 (db를 직접 사용 금지)
 * - 데이터만 return (interceptor가 래핑)
 * - 다른 도메인 테이블 write 시 → 해당 도메인 Service 주입해서 호출
 */
@Injectable()
export class ParticipantsExampleService {
  constructor(private readonly repository: ParticipantsExampleRepository) {}

  async findAll(invitationId: string) {
    return this.repository.findAllByInvitation(invitationId);
  }

  /**
   * 초대장 참가
   * 중복 참가 시 ConflictException (409)
   */
  async join(userId: string, invitationId: string) {
    const existing = await this.repository.findByUserAndInvitation(userId, invitationId);
    if (existing) {
      throw new ConflictException('이미 이 초대장에 참가했습니다');
    }
    return this.repository.create({ userId, invitationId });
  }

  /**
   * RSVP 상태 업데이트
   *
   * TODO(human): 아래 소유권 체크 로직을 직접 구현해보세요
   *
   * 요구사항:
   * 1. findById로 participant 조회 → 없으면 NotFoundException
   * 2. participant.userId !== userId → ForbiddenException
   * 3. repository.updateRsvpStatus() 호출
   * 4. 수정된 row return
   *
   * 힌트:
   *   const participant = await this.repository.findById(id);
   *   if (!participant) throw new NotFoundException(...);
   *   if (participant.userId !== userId) throw new ForbiddenException(...);
   *   return this.repository.updateRsvpStatus(id, dto.rsvpStatus);
   */
  async updateRsvp(_userId: string, _id: string, _dto: UpdateRsvpDto) {
    // TODO(human): 여기에 구현하세요
  }

  /**
   * 참가 취소
   * SKILL Rule: Soft Delete 사용 (스키마에 deletedAt 추가 후 활성화)
   */
  async leave(userId: string, id: string) {
    const participant = await this.repository.findById(id);
    if (!participant) {
      throw new NotFoundException('참가자를 찾을 수 없습니다');
    }
    if (participant.userId !== userId) {
      throw new ForbiddenException('자신의 참가만 취소할 수 있습니다');
    }
    await this.repository.softDelete(id);
  }
}
