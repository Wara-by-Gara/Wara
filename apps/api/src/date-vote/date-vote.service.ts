import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { DateVoteRepository } from './date-vote.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { ErrorCode } from '../common/constants/error-codes';
import type { CreatePollDto } from './dto/create-poll.dto';
import type { UpdatePollDto } from './dto/update-poll.dto';
import type { AddSlotDto } from './dto/add-slot.dto';
import type { SubmitResponsesDto } from './dto/submit-responses.dto';
import type { ConfirmSlotDto } from './dto/confirm-slot.dto';

const SLOT_LIMIT = 30;

@Injectable()
export class DateVoteService {
  constructor(
    private readonly repo: DateVoteRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ── Poll ────────────────────────────────────────────────────────────────────

  async createPoll(invitationId: string, dto: CreatePollDto) {
    const invitation = await this.repo.findInvitationById(invitationId);
    if (!invitation) {
      throw new NotFoundException({
        code: ErrorCode.INVITATION_NOT_FOUND,
        message: '초대장을 찾을 수 없습니다.',
      });
    }
    if (invitation.eventStartAt !== null) {
      throw new UnprocessableEntityException({
        code: ErrorCode.VOTE_EVENT_DATE_SET,
        message: '이미 날짜가 확정된 초대장에는 투표를 만들 수 없습니다.',
      });
    }

    const existing = await this.repo.findPollByInvitationId(invitationId);
    if (existing) {
      throw new ConflictException({
        code: ErrorCode.VOTE_POLL_ALREADY_EXISTS,
        message: '이미 투표가 존재합니다.',
      });
    }

    const poll = await this.repo.createPoll({
      invitationId,
      closesAt: dto.closesAt ? new Date(dto.closesAt) : new Date('2099-12-31T23:59:59Z'),
      isAnonymous: dto.isAnonymous,
    });

    const slots = await this.repo.createSlots(
      dto.slots.map((s, i) => ({
        pollId:    poll.id,
        date:      s.date,
        startTime: s.startTime ?? null,
        sortOrder: s.sortOrder ?? i,
      })),
    );

    return { poll, slots };
  }

  async getPoll(invitationId: string, userId: string) {
    const participantId = await this.repo.findParticipantIdByUser(userId, invitationId);
    if (!participantId) {
      throw new NotFoundException({
        code: ErrorCode.PARTICIPANT_NOT_FOUND,
        message: '해당 초대장의 참가자가 아닙니다.',
      });
    }
    const poll = await this.repo.findPollByInvitationId(invitationId);
    if (!poll) {
      throw new NotFoundException({
        code: ErrorCode.VOTE_POLL_NOT_FOUND,
        message: '투표를 찾을 수 없습니다.',
      });
    }

    const slots = await this.repo.findSlotsByPollId(poll.id);
    const myResponses = await this.repo.findMyResponsesByPoll(participantId, poll.id);

    return { poll, slots, myResponses };
  }

  async updatePoll(invitationId: string, dto: UpdatePollDto) {
    const poll = await this.repo.findPollByInvitationId(invitationId);
    if (!poll) {
      throw new NotFoundException({
        code: ErrorCode.VOTE_POLL_NOT_FOUND,
        message: '투표를 찾을 수 없습니다.',
      });
    }
    this.assertOpen(poll);

    return this.repo.updatePoll(poll.id, {
      ...(dto.closesAt && { closesAt: new Date(dto.closesAt) }),
      ...(dto.isAnonymous !== undefined && { isAnonymous: dto.isAnonymous }),
    });
  }

  // ── Slots ───────────────────────────────────────────────────────────────────

  async addSlot(invitationId: string, dto: AddSlotDto) {
    const poll = await this.repo.findPollByInvitationId(invitationId);
    if (!poll) {
      throw new NotFoundException({ code: ErrorCode.VOTE_POLL_NOT_FOUND, message: '투표를 찾을 수 없습니다.' });
    }
    this.assertOpen(poll);

    const currentCount = await this.repo.countSlotsByPollId(poll.id);
    if (currentCount >= SLOT_LIMIT) {
      throw new UnprocessableEntityException({
        code: ErrorCode.VOTE_SLOT_LIMIT_EXCEEDED,
        message: `후보는 최대 ${SLOT_LIMIT}개까지 등록 가능합니다.`,
      });
    }

    const [slot] = await this.repo.createSlots([{
      pollId:    poll.id,
      date:      dto.date,
      startTime: dto.startTime ?? null,
      sortOrder: dto.sortOrder ?? currentCount,
    }]);
    return slot!;
  }

  async deleteSlot(invitationId: string, slotId: string) {
    const poll = await this.repo.findPollByInvitationId(invitationId);
    if (!poll) {
      throw new NotFoundException({ code: ErrorCode.VOTE_POLL_NOT_FOUND, message: '투표를 찾을 수 없습니다.' });
    }
    this.assertOpen(poll);

    const slot = await this.repo.findSlotById(slotId);
    if (!slot || slot.pollId !== poll.id) {
      throw new NotFoundException({ code: ErrorCode.VOTE_SLOT_NOT_FOUND, message: '슬롯을 찾을 수 없습니다.' });
    }

    await this.repo.deleteSlot(slotId);
  }

  // ── Responses ───────────────────────────────────────────────────────────────

  async submitResponses(invitationId: string, userId: string, dto: SubmitResponsesDto) {
    const participantId = await this.repo.findParticipantIdByUser(userId, invitationId);
    if (!participantId) {
      throw new NotFoundException({
        code: ErrorCode.PARTICIPANT_NOT_FOUND,
        message: '해당 초대장의 참가자가 아닙니다.',
      });
    }
    const poll = await this.repo.findPollByInvitationId(invitationId);
    if (!poll) {
      throw new NotFoundException({ code: ErrorCode.VOTE_POLL_NOT_FOUND, message: '투표를 찾을 수 없습니다.' });
    }
    this.assertOpen(poll);

    // 요청의 slotId들이 모두 이 폴의 슬롯인지 검증
    if (dto.responses.length > 0) {
      const pollSlots = await this.repo.findSlotsByPollId(poll.id);
      const pollSlotIds = new Set(pollSlots.map((s) => s.id));
      const invalid = dto.responses.find((r) => !pollSlotIds.has(r.slotId));
      if (invalid) {
        throw new NotFoundException({ code: ErrorCode.VOTE_SLOT_NOT_FOUND, message: '유효하지 않은 슬롯입니다.' });
      }
    }

    // PUT semantics: 트랜잭션으로 기존 응답 전체 삭제 후 새로 삽입
    return this.repo.replaceResponses(participantId, poll.id, dto.responses);
  }

  // ── Results ─────────────────────────────────────────────────────────────────

  async getResults(invitationId: string) {
    const poll = await this.repo.findPollByInvitationId(invitationId);
    if (!poll) {
      throw new NotFoundException({ code: ErrorCode.VOTE_POLL_NOT_FOUND, message: '투표를 찾을 수 없습니다.' });
    }

    const slots = await this.repo.findSlotsByPollId(poll.id);
    const allResponses = await this.repo.findResponsesBySlotIds(slots.map((s) => s.id));

    // 슬롯별 집계
    const slotResults = slots.map((slot) => {
      const responses = allResponses.filter((r) => r.slotId === slot.id);
      const counts = {
        good:  responses.filter((r) => r.response === 'good').length,
        maybe: responses.filter((r) => r.response === 'maybe').length,
        bad:   responses.filter((r) => r.response === 'bad').length,
      };

      return {
        slot,
        counts,
        // 공개 설정일 때만 응답자 이름 포함
        voters: poll.isAnonymous
          ? undefined
          : responses.map((r) => ({
              participantId: r.participantId,
              displayName:   r.nickname ?? null,
              response:      r.response,
            })),
      };
    });

    const voterCount = new Set(allResponses.map((r) => r.participantId)).size;

    return { poll, slotResults, voterCount };
  }

  // ── Close / Confirm ─────────────────────────────────────────────────────────

  async closePoll(invitationId: string) {
    const poll = await this.repo.findPollByInvitationId(invitationId);
    if (!poll) {
      throw new NotFoundException({ code: ErrorCode.VOTE_POLL_NOT_FOUND, message: '투표를 찾을 수 없습니다.' });
    }
    // 수동 마감은 status만 확인 (closesAt 기한과 무관하게 open이면 마감 가능)
    if (poll.status !== 'open') {
      throw new UnprocessableEntityException({
        code: ErrorCode.VOTE_POLL_CLOSED,
        message: '이미 마감된 투표입니다.',
      });
    }
    return this.processClose(poll.id, invitationId);
  }

  async confirmSlot(invitationId: string, dto: ConfirmSlotDto) {
    const poll = await this.repo.findPollByInvitationId(invitationId);
    if (!poll) {
      throw new NotFoundException({ code: ErrorCode.VOTE_POLL_NOT_FOUND, message: '투표를 찾을 수 없습니다.' });
    }
    if (poll.status !== 'closed') {
      throw new UnprocessableEntityException({
        code: ErrorCode.VOTE_POLL_CLOSED,
        message: '마감된 투표에서만 날짜를 확정할 수 있습니다.',
      });
    }

    const slot = await this.repo.findSlotById(dto.slotId);
    if (!slot || slot.pollId !== poll.id) {
      throw new NotFoundException({ code: ErrorCode.VOTE_SLOT_NOT_FOUND, message: '슬롯을 찾을 수 없습니다.' });
    }

    await this.applyConfirmation(poll.id, invitationId, slot);
    return this.repo.findPollById(poll.id);
  }

  // ── Scheduler용 공개 메서드 ──────────────────────────────────────────────────

  async processExpiredPolls() {
    const polls = await this.repo.findExpiredOpenPolls();
    for (const poll of polls) {
      await this.processClose(poll.id, poll.invitationId);
    }
  }

  async sendReminders() {
    const polls = await this.repo.findPollsNeedingReminder();
    for (const poll of polls) {
      const invitation = await this.repo.findInvitationById(poll.invitationId);
      const title = invitation?.title ?? '모임';
      const nonVoters = await this.repo.findNonVotersByPoll(poll.id);
      for (const participant of nonVoters) {
        await this.notificationsService.notify({
          userId:     participant.userId,
          type:       'vote_reminder',
          content:    `[${title}] 투표 마감 30분 전입니다. 아직 응답하지 않으셨어요!`,
          targetType: 'invitation',
          targetId:   poll.invitationId,
        });
      }
      await this.repo.updatePoll(poll.id, { reminderSentAt: new Date() });
    }
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  private assertOpen(poll: { status: string; closesAt: Date }) {
    if (poll.status !== 'open' || new Date() > poll.closesAt) {
      throw new UnprocessableEntityException({
        code: ErrorCode.VOTE_POLL_CLOSED,
        message: '마감된 투표입니다.',
      });
    }
  }

  private async processClose(pollId: string, invitationId: string) {
    await this.repo.updatePoll(pollId, { status: 'closed' });

    const slots = await this.repo.findSlotsByPollId(pollId);
    const allResponses = await this.repo.findResponsesBySlotIds(slots.map((s) => s.id));

    // 슬롯별 good 응답 수 집계
    const counts = slots.map((slot) => ({
      slot,
      goodCount: allResponses.filter((r) => r.slotId === slot.id && r.response === 'good').length,
    }));
    const maxGood = counts.length > 0 ? Math.max(...counts.map((c) => c.goodCount)) : 0;
    const winners = counts.filter((c) => c.goodCount === maxGood);

    if (maxGood > 0 && winners.length === 1) {
      // 단독 최다 득표 → 자동 확정
      await this.applyConfirmation(pollId, invitationId, winners[0]!.slot);
    } else {
      // 동점 또는 응답 없음 → 호스트에게 동점 알림, 참가자 전체에게 마감 알림
      const invitation = await this.repo.findInvitationById(invitationId);
      const title = invitation?.title ?? '모임';
      const hostUserId = await this.repo.findHostUserIdByInvitation(invitationId);
      const allUserIds = await this.repo.findAllParticipantUserIds(invitationId);

      await Promise.all(
        allUserIds.map((userId) =>
          this.notificationsService.notify({
            userId,
            type:       'vote_tied',
            content:    userId === hostUserId
              ? `[${title}] 투표가 마감됐어요. 동점이 발생해 날짜를 직접 선택해주세요.`
              : `[${title}] 일정 투표가 마감됐어요. 호스트가 날짜를 선택할 예정이에요.`,
            targetType: 'invitation',
            targetId:   invitationId,
          }),
        ),
      );
    }

    return this.repo.findPollById(pollId);
  }

  private formatConfirmedDate(date: string, startTime: string | null): string {
    const [y, m, d] = date.split('-').map(Number);
    const dateStr = `${String(y! % 100).padStart(2, '0')}년 ${m}월 ${d}일`;
    if (!startTime) return dateStr;
    const [hStr, mStr] = startTime.split(':');
    const h = Number(hStr);
    const min = Number(mStr);
    const ampm = h < 12 ? '오전' : '오후';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const minStr = min === 0 ? '' : ` ${min}분`;
    return `${dateStr} ${ampm} ${h12}시${minStr}`;
  }

  private async applyConfirmation(
    pollId: string,
    invitationId: string,
    slot: { id: string; date: string; startTime: string | null },
  ) {
    // 날짜+시간을 eventStartAt으로 변환 (KST 기준, UTC로 저장)
    const dateStr = `${slot.date}T${slot.startTime ?? '00:00'}:00+09:00`;
    const eventStartAt = new Date(dateStr);

    await this.repo.confirmPollAndUpdateInvitation(pollId, slot.id, invitationId, eventStartAt);

    const invitation = await this.repo.findInvitationById(invitationId);
    const formattedDate = this.formatConfirmedDate(slot.date, slot.startTime);
    const title = invitation?.title ?? '모임';

    // 전체 참가자에게 확정 알림
    const userIds = await this.repo.findAllParticipantUserIds(invitationId);
    await Promise.all(
      userIds.map((userId) =>
        this.notificationsService.notify({
          userId,
          type:       'vote_confirmed',
          content:    `${title} 날짜가 확정됐어요! ${formattedDate}`,
          targetType: 'invitation',
          targetId:   invitationId,
        }),
      ),
    );
  }
}
