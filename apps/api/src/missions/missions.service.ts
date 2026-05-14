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

export type MissionResponse = {
  id: string;
  invitationId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

function toResponse(row: MissionRow): MissionResponse {
  return {
    id: row.id,
    invitationId: row.invitationId,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

@Injectable()
export class MissionsService {
  constructor(
    private readonly repository: MissionsRepository,
    private readonly participantRepository: ParticipantRepository,
  ) {}

  async list(
    invitationId: string,
    userId: string,
  ): Promise<MissionResponse[]> {
    const memberRole = await this.participantRepository.findMemberRole(
      userId,
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
    userId: string,
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
      userId,
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
    missionId: string,
    dto: UpdateMissionDto,
  ): Promise<MissionResponse> {
    const updated = await this.repository.updateContent(
      invitationId,
      missionId,
      dto.content,
    );
    if (!updated) {
      throw new NotFoundException(ErrorCode.MISSION_NOT_FOUND);
    }
    return toResponse(updated);
  }

  async delete(invitationId: string, missionId: string): Promise<void> {
    const deleted = await this.repository.deleteByIdInInvitation(
      invitationId,
      missionId,
    );
    if (!deleted) {
      throw new NotFoundException(ErrorCode.MISSION_NOT_FOUND);
    }
  }
}
