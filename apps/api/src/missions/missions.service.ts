import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ErrorCode } from '../common/constants/error-codes';
import { ParticipantRepository } from '../common/repositories/participant.repository';
import { AssignMissionsDto } from './dto/assign-missions.dto';
import { CreateMissionDto } from './dto/create-mission.dto';
import { UpdateMissionDto } from './dto/update-mission.dto';
import {
  MissionAssignmentRow,
  MissionRow,
  MissionTemplateRow,
  MissionsRepository,
} from './missions.repository';

export type MissionResponse = {
  id: string;
  invitationId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type MissionTemplateResponse = {
  id: string;
  content: string;
};

export type MissionAssignmentResponse = {
  assignmentId: string;
  missionId: string;
  participantId: string;
  content: string;
  assignedAt: string;
  completedAt: string | null;
};

function toMissionResponse(row: MissionRow): MissionResponse {
  return {
    id: row.id,
    invitationId: row.invitationId,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toTemplateResponse(row: MissionTemplateRow): MissionTemplateResponse {
  return { id: row.id, content: row.content };
}

function toAssignmentResponse(
  assignment: MissionAssignmentRow,
  mission: MissionRow,
): MissionAssignmentResponse {
  return {
    assignmentId: assignment.id,
    missionId: mission.id,
    participantId: assignment.participantId,
    content: mission.content,
    assignedAt: assignment.assignedAt.toISOString(),
    completedAt: assignment.completedAt
      ? assignment.completedAt.toISOString()
      : null,
  };
}

// Fisher-Yates 셔플 (V8의 sort 콜백 편향 회피)
function shuffle<T>(arr: readonly T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = result[i]!;
    result[i] = result[j]!;
    result[j] = tmp;
  }
  return result;
}

// 균등 분배 랜덤 배정: 미션 N개를 참가자 M명에게 라운드-로빈으로 배분.
// 미션과 참가자 둘 다 셔플해 한쪽으로 쏠리는 분포 편향 제거.
function distributeRandomly(
  missionIds: string[],
  participantIds: string[],
): Array<{ missionId: string; participantId: string }> {
  const shuffledMissions = shuffle(missionIds);
  const shuffledParticipants = shuffle(participantIds);
  return shuffledParticipants.map((participantId, idx) => ({
    missionId: shuffledMissions[idx % shuffledMissions.length]!,
    participantId,
  }));
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
    return rows.map(toMissionResponse);
  }

  async create(
    invitationId: string,
    userId: string,
    dto: CreateMissionDto,
  ): Promise<MissionResponse> {
    const created = await this.repository.withTransaction(async (tx) => {
      const enabled = await this.repository.findInvitationMissionEnabled(
        invitationId,
        tx,
      );
      if (enabled === null) {
        throw new NotFoundException(ErrorCode.INVITATION_NOT_FOUND);
      }
      if (!enabled) {
        throw new BadRequestException(ErrorCode.MISSION_NOT_ENABLED);
      }

      const participantId = await this.repository.findHostParticipantId(
        userId,
        invitationId,
        tx,
      );
      if (!participantId) {
        throw new ForbiddenException(ErrorCode.PARTICIPANT_NOT_FOUND);
      }

      // template_id가 있으면 active template content를 복사, 없으면 dto.content 사용
      let content: string;
      if (dto.templateId) {
        const template = await this.repository.findActiveTemplateById(
          dto.templateId,
          tx,
        );
        if (!template) {
          throw new NotFoundException(ErrorCode.MISSION_TEMPLATE_NOT_FOUND);
        }
        content = template.content;
      } else if (dto.content) {
        content = dto.content;
      } else {
        // 둘 다 없으면 VALIDATION_ERROR — DTO refine에서 이미 차단되므로 도달 불가
        throw new BadRequestException(ErrorCode.VALIDATION_ERROR);
      }

      return this.repository.create(
        { invitationId, participantId, content },
        tx,
      );
    });
    return toMissionResponse(created);
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
    return toMissionResponse(updated);
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

  // ── Templates (공용 카탈로그) ────────────────────────────────────────────

  async listTemplates(): Promise<MissionTemplateResponse[]> {
    const rows = await this.repository.listActiveTemplates();
    return rows.map(toTemplateResponse);
  }

  // ── Assignment (호스트 발송) ─────────────────────────────────────────────

  /**
   * 그 모임의 등록된 미션들을 참석 확정(attending) 참가자에게 랜덤 균등 배정.
   * 재호출 시 기존 배정 삭제 후 재배정.
   * - 미션 0개 → MISSION_NO_MISSIONS_TO_ASSIGN (400)
   * - 참가자 0명 → MISSION_NO_PARTICIPANTS_TO_ASSIGN (400)
   */
  async assignMissions(
    invitationId: string,
    _dto: AssignMissionsDto,
  ): Promise<MissionAssignmentResponse[]> {
    const result = await this.repository.withTransaction(async (tx) => {
      // invitation row 잠금: 동일 invitation에 대한 동시 assign 호출 직렬화
      const enabled = await this.repository.lockInvitationMissionEnabled(
        invitationId,
        tx,
      );
      if (enabled === null) {
        throw new NotFoundException(ErrorCode.INVITATION_NOT_FOUND);
      }
      if (!enabled) {
        throw new BadRequestException(ErrorCode.MISSION_NOT_ENABLED);
      }

      const missions = await this.repository.findManyByInvitationId(
        invitationId,
        tx,
      );
      if (missions.length === 0) {
        throw new BadRequestException(ErrorCode.MISSION_NO_MISSIONS_TO_ASSIGN);
      }

      const participantIds = await this.repository.findAttendingParticipantIds(
        invitationId,
        tx,
      );
      if (participantIds.length === 0) {
        throw new BadRequestException(
          ErrorCode.MISSION_NO_PARTICIPANTS_TO_ASSIGN,
        );
      }

      // 재배정: 기존 모든 배정 삭제 후 새로 insert
      await this.repository.deleteAssignmentsByMissionIds(
        missions.map((m) => m.id),
        tx,
      );

      const pairs = distributeRandomly(
        missions.map((m) => m.id),
        participantIds,
      );
      const inserted = await this.repository.bulkInsertAssignments(pairs, tx);

      const missionById = new Map(missions.map((m) => [m.id, m]));
      return inserted.map((a) =>
        toAssignmentResponse(a, missionById.get(a.missionId)!),
      );
    });
    return result;
  }

  // ── My Mission (참가자 본인 조회) ────────────────────────────────────────

  async getMyMission(
    invitationId: string,
    userId: string,
  ): Promise<MissionAssignmentResponse> {
    const participantId = await this.repository.findParticipantIdByUser(
      userId,
      invitationId,
    );
    if (!participantId) {
      throw new ForbiddenException(ErrorCode.PARTICIPANT_NOT_FOUND);
    }
    const found = await this.repository.findAssignedMissionForParticipant(
      invitationId,
      participantId,
    );
    if (!found) {
      throw new NotFoundException(ErrorCode.MISSION_NOT_ASSIGNED);
    }
    return toAssignmentResponse(found.assignment, found.mission);
  }
}
