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
import { JoinInvitationDto } from './dto/join-invitation.dto';
import { UpdateRsvpDto } from './dto/update-rsvp.dto';

@Injectable()
export class ParticipantsService {
  constructor(
    private readonly repository: ParticipantsRepository,
    private readonly blocklistRepository: BlocklistRepository,
    private readonly s3Service: S3Service,
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

  async getProfile(invitationId: string, participantId: string) {
    const result = await this.repository.findByIdWithUser(participantId);
    if (!result || result.participant.invitationId !== invitationId) {
      throw new NotFoundException(ErrorCode.PARTICIPANT_NOT_FOUND);
    }
    return result;
  }

  async getMutual(invitationId: string, participantId: string, viewer: Participant) {
    const target = await this.repository.findById(participantId);
    if (!target || target.invitationId !== invitationId) {
      throw new NotFoundException(ErrorCode.PARTICIPANT_NOT_FOUND);
    }
    return this.repository.getMutualParticipants(viewer.userId, target.userId);
  }

  async getSharedInvitations(invitationId: string, participantId: string, viewer: Participant) {
    const target = await this.repository.findById(participantId);
    if (!target || target.invitationId !== invitationId) {
      throw new NotFoundException(ErrorCode.PARTICIPANT_NOT_FOUND);
    }
    return this.repository.getSharedInvitations(viewer.userId, target.userId, invitationId);
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

    return this.repository.create({ userId, invitationId, rsvpStatus: dto.rsvpStatus, note: dto.note });
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
    if (info.status === 'closed') {
      throw new UnprocessableEntityException(ErrorCode.INVITATION_CLOSED);
    }

    if (viewer.memberRole !== 'HOST' && info.eventStartAt && info.eventStartAt < new Date()) {
      throw new UnprocessableEntityException(ErrorCode.INVITATION_CLOSED);
    }

    return this.repository.updateRsvpStatus(participantId, dto.rsvpStatus);
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

    if (isHostKick) {
      await this.blocklistRepository.add(viewer.invitationId, target.userId, viewer.userId);
    }
  }
}
