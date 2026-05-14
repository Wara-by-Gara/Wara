import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ErrorCode } from '../common/constants/error-codes';
import { ParticipantRepository } from '../common/repositories/participant.repository';
import { CreateMissionDto } from './dto/create-mission.dto';
import { UpdateMissionDto } from './dto/update-mission.dto';
import { MissionRow, MissionsRepository } from './missions.repository';

/**
 * 응답 전용 미션 representation.
 * 내부 식별자(`participantId`)는 외부 노출하지 않는다.
 */
export type MissionResponse = {
  id: string;
  invitationId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
};

function toResponse(row: MissionRow): MissionResponse {
  return {
    id: row.id,
    invitationId: row.invitationId,
    content: row.content,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * 미션 도메인 비즈니스 로직.
 *
 * - POST/PATCH/DELETE의 HOST 자격 검증은 `HostGuard`가 담당.
 * - GET은 가드를 두지 않고 서비스가 직접 참가자 멤버십을 검증(IDOR 방지).
 */
@Injectable()
export class MissionsService {
  constructor(
    private readonly repository: MissionsRepository,
    private readonly participantRepository: ParticipantRepository,
  ) {}

  async list(
    invitationId: string,
    requesterUserId: string,
  ): Promise<MissionResponse[]> {
    const memberRole = await this.participantRepository.findMemberRole(
      requesterUserId,
      invitationId,
    );
    if (!memberRole) {
      throw new ForbiddenException(ErrorCode.PARTICIPANT_NOT_FOUND);
    }
    const rows = await this.repository.findManyByInvitationId(invitationId);
    return rows.map(toResponse);
  }

  async create(
    invitationId: string,
    hostUserId: string,
    dto: CreateMissionDto,
  ): Promise<MissionResponse> {
    const enabled =
      await this.repository.findInvitationMissionEnabled(invitationId);
    if (enabled === null) {
      throw new NotFoundException(ErrorCode.INVITATION_NOT_FOUND);
    }
    if (!enabled) {
      throw new BadRequestException(ErrorCode.MISSION_NOT_ENABLED);
    }

    const participantId = await this.repository.findHostParticipantId(
      hostUserId,
      invitationId,
    );
    if (!participantId) {
      throw new ForbiddenException(ErrorCode.PARTICIPANT_NOT_FOUND);
    }

    const created = await this.repository.create({
      invitationId,
      participantId,
      content: dto.content,
    });
    return toResponse(created);
  }

  async update(
    invitationId: string,
    id: string,
    dto: UpdateMissionDto,
  ): Promise<MissionResponse> {
    const updated = await this.repository.updateContent(
      invitationId,
      id,
      dto.content,
    );
    if (!updated) {
      throw new NotFoundException(ErrorCode.MISSION_NOT_FOUND);
    }
    return toResponse(updated);
  }

  async delete(invitationId: string, id: string): Promise<void> {
    const deleted = await this.repository.deleteByIdInInvitation(
      invitationId,
      id,
    );
    if (!deleted) {
      throw new NotFoundException(ErrorCode.MISSION_NOT_FOUND);
    }
  }
}
