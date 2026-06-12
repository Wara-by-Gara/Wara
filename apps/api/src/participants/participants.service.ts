import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { type Participant } from '../database/schema';
import { ErrorCode } from '../common/constants/error-codes';
import { BlocklistRepository } from '../common/repositories/blocklist.repository';
import { ParticipantsRepository } from './participants.repository';
import { S3Service } from '../s3/s3.service';
import { LocationsService } from '../locations/locations.service';
import { NotificationsService } from '../notifications/notifications.service';
import { JoinInvitationDto } from './dto/join-invitation.dto';
import { UpdateRsvpDto } from './dto/update-rsvp.dto';

const RSVP_STATUS_LABEL: Record<UpdateRsvpDto['rsvpStatus'], string> = {
  attending: '참석',
  undecided: '미정',
  absent: '불참',
};

@Injectable()
export class ParticipantsService {
  constructor(
    private readonly repository: ParticipantsRepository,
    private readonly blocklistRepository: BlocklistRepository,
    private readonly s3Service: S3Service,
    private readonly locationsService: LocationsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async resolveProfileImageUrl(url: string | null): Promise<string | null> {
    if (!url) return null;
    return this.s3Service.getViewPresignedUrl(url);
  }

  async findAll(invitationId: string, viewer: Participant) {
    const all = await this.repository.findAllByInvitation(invitationId);

    const resolved = await Promise.all(
      all.map(async (r) => ({
        ...r,
        user: {
          ...r.user,
          profileImageUrl: await this.resolveProfileImageUrl(r.user.profileImageUrl),
        },
      })),
    );

    const summary = {
      totalCount: resolved.length,
      attendingCount: resolved.filter((r) => r.participant.rsvpStatus === 'attending').length,
      undecidedCount: resolved.filter((r) => r.participant.rsvpStatus === 'undecided').length,
      absentCount: resolved.filter((r) => r.participant.rsvpStatus === 'absent').length,
    };

    const isHost = viewer.memberRole === 'HOST';
    const participants = isHost
      ? resolved
      : resolved.map((r) => ({ ...r, participant: { ...r.participant, note: null } }));

    return { summary, participants };
  }

  async join(userId: string, invitationId: string, dto: JoinInvitationDto) {
    const existing = await this.repository.findByUserAndInvitation(userId, invitationId);
    if (existing) {
      throw new ConflictException(ErrorCode.PARTICIPANT_ALREADY_EXISTS);
    }

    const info = await this.repository.findInvitationInfo(invitationId);
    if (!info) {
      throw new NotFoundException(ErrorCode.PARTICIPANT_NOT_FOUND);
    }
    if (info.status === 'closed') {
      throw new UnprocessableEntityException(ErrorCode.INVITATION_CLOSED);
    }

    const participant = await this.repository.create({ userId, invitationId, rsvpStatus: dto.rsvpStatus, note: dto.note });

    // 호스트 본인이 가입하는 경우는 없지만(이미 participant), 방어적으로 자기 알림 차단
    if (info.hostUserId !== userId) {
      const nickname = (await this.repository.findUserNickname(userId)) ?? '누군가';
      await this.notificationsService.notify({
        userId: info.hostUserId,
        actorUserId: userId,
        type: 'participant_joined',
        content: `${nickname}님이 초대장에 참여했습니다`,
        targetType: 'invitation',
        targetId: invitationId,
        invitationId,
      });
    }

    return participant;
  }

  async updateRsvp(
    invitationId: string,
    participantId: string,
    dto: UpdateRsvpDto,
    viewer: Participant,
  ) {
    if (viewer.memberRole !== 'HOST' && viewer.id !== participantId) {
      throw new ForbiddenException(ErrorCode.RSVP_PERMISSION_DENIED);
    }
    if (viewer.memberRole === 'HOST' && viewer.id === participantId) {
      throw new ForbiddenException(ErrorCode.RSVP_PERMISSION_DENIED);
    }

    const info = await this.repository.findInvitationInfo(invitationId);
    if (!info) {
      throw new NotFoundException(ErrorCode.PARTICIPANT_NOT_FOUND);
    }
    // 호스트가 명시적으로 마감(status='closed')했을 때만 차단.
    // 이벤트 시작 시각 기준 자동 차단은 제거 (날짜만 정한 이벤트가 당일 종일 막히는 문제).
    if (info.status === 'closed') {
      throw new UnprocessableEntityException(ErrorCode.INVITATION_CLOSED);
    }

    const updated = await this.repository.updateRsvpStatus(participantId, dto.rsvpStatus);

    // 게스트가 본인 RSVP를 변경하면 호스트에게 알림 (호스트가 대신 변경한 경우는 제외)
    if (viewer.memberRole !== 'HOST' && viewer.userId !== info.hostUserId) {
      const name = (await this.repository.findUserNickname(viewer.userId)) ?? '누군가';
      await this.notificationsService.notify({
        userId: info.hostUserId,
        actorUserId: viewer.userId,
        type: 'participant_joined',
        content: `${name}님이 참석 여부를 ${RSVP_STATUS_LABEL[dto.rsvpStatus]}(으)로 변경했습니다`,
        targetType: 'invitation',
        targetId: invitationId,
        invitationId,
      });
    }

    return updated;
  }

  async updateHostMemo(invitationId: string, participantId: string, memo: string | null) {
    const target = await this.repository.findById(participantId);
    if (!target || target.invitationId !== invitationId) {
      throw new NotFoundException(ErrorCode.PARTICIPANT_NOT_FOUND);
    }
    return this.repository.updateHostMemo(participantId, memo);
  }

  async updateHidden(isHidden: boolean, viewer: Participant) {
    return this.repository.updateHidden(viewer.id, isHidden);
  }

  async leave(participantId: string, viewer: Participant) {
    const target = await this.repository.findById(participantId);
    if (!target || target.invitationId !== viewer.invitationId) {
      throw new NotFoundException(ErrorCode.PARTICIPANT_NOT_FOUND);
    }
    if (target.memberRole === 'HOST') {
      throw new BadRequestException(ErrorCode.HOST_CANNOT_LEAVE);
    }
    if (viewer.id !== participantId && viewer.memberRole !== 'HOST') {
      throw new ForbiddenException(ErrorCode.RSVP_PERMISSION_DENIED);
    }

    const isHostKick = viewer.memberRole === 'HOST' && viewer.id !== participantId;

    await this.repository.hardDelete(participantId);

    // 떠난 participant의 Redis GPS hash + arrived lock 정리 + 다른 클라이언트 marker 제거.
    // 미정리 시 24h TTL까지 stale 좌표 노출.
    await this.locationsService.cleanupParticipantGpsData(
      viewer.invitationId,
      participantId,
    );

    if (isHostKick) {
      await this.blocklistRepository.add(viewer.invitationId, target.userId, viewer.userId);
    }
  }

  /** 호스트 권한 위임 — viewer(현재 HOST)가 target 참가자에게 HOST 이전 */
  async transferHost(
    invitationId: string,
    targetParticipantId: string,
    viewer: Participant,
  ) {
    const target = await this.repository.findById(targetParticipantId);
    if (!target || target.invitationId !== invitationId) {
      throw new NotFoundException(ErrorCode.PARTICIPANT_NOT_FOUND);
    }
    if (target.memberRole === 'HOST') {
      throw new BadRequestException(ErrorCode.PARTICIPANT_ALREADY_HOST);
    }
    await this.repository.transferHost(
      invitationId,
      viewer.id,
      target.id,
      target.userId,
    );
  }
}
