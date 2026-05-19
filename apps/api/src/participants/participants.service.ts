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
import { JoinInvitationDto } from './dto/join-invitation.dto';
import { UpdateRsvpDto } from './dto/update-rsvp.dto';

@Injectable()
export class ParticipantsService {
  constructor(
    private readonly repository: ParticipantsRepository,
    private readonly blocklistRepository: BlocklistRepository,
  ) {}

  async findAll(invitationId: string, filter?: string) {
    const all = await this.repository.findAllByInvitation(invitationId);

    const summary = {
      totalCount: all.length,
      attendingCount: all.filter((r) => r.participant.rsvpStatus === 'attending').length,
      undecidedCount: all.filter((r) => r.participant.rsvpStatus === 'undecided').length,
      absentCount: all.filter((r) => r.participant.rsvpStatus === 'absent').length,
    };

    // 필터 없으면 absent 제외, 필터 있으면 해당 status만
    const list = filter
      ? all.filter((r) => r.participant.rsvpStatus === filter)
      : all.filter((r) => r.participant.rsvpStatus !== 'absent');

    return { summary, participants: list };
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

    const status = await this.repository.findInvitationStatus(invitationId);
    if (!status) {
      throw new NotFoundException(ErrorCode.PARTICIPANT_NOT_FOUND);
    }
    if (status === 'closed') {
      throw new UnprocessableEntityException(ErrorCode.INVITATION_CLOSED);
    }

    return this.repository.create({ userId, invitationId, rsvpStatus: dto.rsvpStatus });
  }

  async updateRsvp(
    invitationId: string,
    participantId: string,
    dto: UpdateRsvpDto,
    viewer: Participant,
  ) {
    if (viewer.id !== participantId) {
      throw new ForbiddenException(ErrorCode.RSVP_PERMISSION_DENIED);
    }
    if (viewer.memberRole === 'HOST') {
      throw new ForbiddenException(ErrorCode.RSVP_PERMISSION_DENIED);
    }

    const status = await this.repository.findInvitationStatus(invitationId);
    if (!status) {
      throw new NotFoundException(ErrorCode.PARTICIPANT_NOT_FOUND);
    }
    if (status === 'closed') {
      throw new UnprocessableEntityException(ErrorCode.INVITATION_CLOSED);
    }

    return this.repository.updateRsvpStatus(participantId, dto.rsvpStatus);
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
