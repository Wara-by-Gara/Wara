import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { DateVoteRepository } from './date-vote.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { ErrorCode } from '../common/constants/error-codes';
import type { CreatePollDto } from './dto/create-poll.dto';
import type { UpdatePollDto } from './dto/update-poll.dto';
import type { AddSlotDto } from './dto/add-slot.dto';
import type { UpdateSlotDto } from './dto/update-slot.dto';
import type { SubmitResponsesDto } from './dto/submit-responses.dto';
import type { ConfirmSlotDto } from './dto/confirm-slot.dto';
import { findDuplicateVoteSlotKey, voteSlotKey } from './vote-slot.util';
import type { DateVotePoll, DateVoteSlot } from '../database/schema';

const SLOT_LIMIT = 30;

type SlotShape = { date?: string | null; startTime?: string | null; label?: string | null };

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
    // 날짜 확정 투표는 이벤트 날짜가 이미 정해졌으면 만들 수 없음 (custom 투표는 무관).
    if (dto.voteType === 'date' && invitation.eventStartAt !== null) {
      throw new UnprocessableEntityException({
        code: ErrorCode.VOTE_EVENT_DATE_SET,
        message: '이미 날짜가 확정된 초대장에는 날짜 투표를 만들 수 없습니다.',
      });
    }

    this.assertNoDuplicateSlots(dto.slots);

    const poll = await this.repo.createPoll({
      invitationId,
      voteType: dto.voteType,
      title: dto.title ?? null,
      closesAt: dto.closesAt ? new Date(dto.closesAt) : new Date('2099-12-31T23:59:59Z'),
      isAnonymous: dto.isAnonymous,
    });

    const slots = await this.repo.createSlots(
      dto.slots.map((s, i) => ({
        pollId:    poll.id,
        date:      s.date ?? null,
        startTime: s.startTime ?? null,
        label:     s.label ?? null,
        sortOrder: s.sortOrder ?? i,
      })),
    );

    // 투표 생성 직후: 해당 초대장의 전체 참가자에게 투표 시작 알림을 보낸다.
    const allUserIds = await this.repo.findAllParticipantUserIds(invitationId);
    const pollLabel = poll.title ?? (poll.voteType === 'custom' ? '투표' : '일정 투표');
    await Promise.all(
      allUserIds.map((userId) =>
        this.notificationsService.notify({
          userId,
          type: 'vote_reminder',
          content: `[${invitation.title}] ${pollLabel}가 시작됐어요. 원하는 항목을 선택해주세요!`,
          targetType: 'invitation',
          targetId: invitationId,
          invitationId,
        }),
      ),
    );

    return { poll, slots };
  }

  /** 초대장의 투표 목록 (다중 투표). */
  async listPolls(invitationId: string, userId: string) {
    await this.assertParticipant(userId, invitationId);
    const polls = await this.repo.findPollsByInvitationId(invitationId);
    const withSlots = await Promise.all(
      polls.map(async (poll) => ({
        poll,
        slots: await this.repo.findSlotsByPollId(poll.id),
      })),
    );
    return { polls: withSlots };
  }

  async getPoll(invitationId: string, pollId: string, userId: string) {
    const participantId = await this.assertParticipant(userId, invitationId);
    const poll = await this.getOwnedPoll(invitationId, pollId);

    const slots = await this.repo.findSlotsByPollId(poll.id);
    const myResponses = await this.repo.findMyResponsesByPoll(participantId, poll.id);

    return { poll, slots, myResponses };
  }

  async updatePoll(invitationId: string, pollId: string, dto: UpdatePollDto) {
    const poll = await this.getOwnedPoll(invitationId, pollId);
    this.assertOpen(poll);

    return this.repo.updatePoll(poll.id, {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.closesAt && { closesAt: new Date(dto.closesAt) }),
      ...(dto.isAnonymous !== undefined && { isAnonymous: dto.isAnonymous }),
    });
  }

  async deletePoll(invitationId: string, pollId: string) {
    const poll = await this.getOwnedPoll(invitationId, pollId);
    await this.repo.softDeletePoll(poll.id);
  }

  // ── Slots ───────────────────────────────────────────────────────────────────

  async addSlot(invitationId: string, pollId: string, dto: AddSlotDto) {
    const poll = await this.getOwnedPoll(invitationId, pollId);
    this.assertOpen(poll);
    this.assertSlotMatchesType(poll.voteType, dto);

    const currentCount = await this.repo.countSlotsByPollId(poll.id);
    if (currentCount >= SLOT_LIMIT) {
      throw new UnprocessableEntityException({
        code: ErrorCode.VOTE_SLOT_LIMIT_EXCEEDED,
        message: `후보는 최대 ${SLOT_LIMIT}개까지 등록 가능합니다.`,
      });
    }

    const existingSlots = await this.repo.findSlotsByPollId(poll.id);
    const nextKey = voteSlotKey(dto);
    if (existingSlots.some((s) => voteSlotKey(s) === nextKey)) {
      throw new UnprocessableEntityException({
        code: ErrorCode.VOTE_SLOT_DUPLICATE,
        message: '동일한 후보는 중복 등록할 수 없습니다.',
      });
    }

    const [slot] = await this.repo.createSlots([{
      pollId:    poll.id,
      date:      dto.date ?? null,
      startTime: dto.startTime ?? null,
      label:     dto.label ?? null,
      sortOrder: dto.sortOrder ?? currentCount,
    }]);
    return slot!;
  }

  async updateSlot(invitationId: string, pollId: string, slotId: string, dto: UpdateSlotDto) {
    const poll = await this.getOwnedPoll(invitationId, pollId);
    this.assertOpen(poll);

    const slot = await this.repo.findSlotById(slotId);
    if (!slot || slot.pollId !== poll.id) {
      throw new NotFoundException({ code: ErrorCode.VOTE_SLOT_NOT_FOUND, message: '슬롯을 찾을 수 없습니다.' });
    }

    // 수정 후 값이 이 투표 타입과 맞는지 검증
    const merged: SlotShape = {
      date:      dto.date !== undefined ? dto.date : slot.date,
      startTime: dto.startTime !== undefined ? dto.startTime : slot.startTime,
      label:     dto.label !== undefined ? dto.label : slot.label,
    };
    this.assertSlotMatchesType(poll.voteType, merged);

    // 수정 후 다른 슬롯과 겹치는지 검사 (자기 자신 제외)
    const nextKey = voteSlotKey(merged);
    const existingSlots = await this.repo.findSlotsByPollId(poll.id);
    if (existingSlots.some((s) => s.id !== slotId && voteSlotKey(s) === nextKey)) {
      throw new UnprocessableEntityException({
        code: ErrorCode.VOTE_SLOT_DUPLICATE,
        message: '동일한 후보는 중복 등록할 수 없습니다.',
      });
    }

    return this.repo.updateSlot(slotId, {
      ...(dto.date !== undefined && { date: dto.date }),
      ...(dto.startTime !== undefined && { startTime: dto.startTime }),
      ...(dto.label !== undefined && { label: dto.label }),
      ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
    });
  }

  async deleteSlot(invitationId: string, pollId: string, slotId: string) {
    const poll = await this.getOwnedPoll(invitationId, pollId);
    this.assertOpen(poll);

    const slot = await this.repo.findSlotById(slotId);
    if (!slot || slot.pollId !== poll.id) {
      throw new NotFoundException({ code: ErrorCode.VOTE_SLOT_NOT_FOUND, message: '슬롯을 찾을 수 없습니다.' });
    }

    await this.repo.deleteSlot(slotId);
  }

  // ── Responses ───────────────────────────────────────────────────────────────

  async submitResponses(invitationId: string, pollId: string, userId: string, dto: SubmitResponsesDto) {
    const participantId = await this.assertParticipant(userId, invitationId);
    const poll = await this.getOwnedPoll(invitationId, pollId);
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

  async getResults(invitationId: string, pollId: string) {
    const poll = await this.getOwnedPoll(invitationId, pollId);

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
              displayName:   r.name ?? r.nickname ?? null,
              response:      r.response,
            })),
      };
    });

    const voterCount = new Set(allResponses.map((r) => r.participantId)).size;

    return { poll, slotResults, voterCount };
  }

  // ── Close / Confirm ─────────────────────────────────────────────────────────

  async closePoll(invitationId: string, pollId: string) {
    const poll = await this.getOwnedPoll(invitationId, pollId);
    // 수동 마감은 status만 확인 (closesAt 기한과 무관하게 open이면 마감 가능)
    if (poll.status !== 'open') {
      throw new UnprocessableEntityException({
        code: ErrorCode.VOTE_POLL_CLOSED,
        message: '이미 마감된 투표입니다.',
      });
    }
    return this.processClose(poll, invitationId);
  }

  async confirmSlot(invitationId: string, pollId: string, dto: ConfirmSlotDto) {
    const poll = await this.getOwnedPoll(invitationId, pollId);
    if (poll.status !== 'closed') {
      throw new UnprocessableEntityException({
        code: ErrorCode.VOTE_POLL_CLOSED,
        message: '마감된 투표에서만 확정할 수 있습니다.',
      });
    }

    const slot = await this.repo.findSlotById(dto.slotId);
    if (!slot || slot.pollId !== poll.id) {
      throw new NotFoundException({ code: ErrorCode.VOTE_SLOT_NOT_FOUND, message: '슬롯을 찾을 수 없습니다.' });
    }

    await this.applyConfirmation(poll, invitationId, slot);
    return this.repo.findPollById(poll.id);
  }

  /** 확정 되돌리기 — 확정된 투표를 다시 마감(closed) 상태로 되돌린다. date 투표는 초대장 날짜도 해제. */
  async unconfirmSlot(invitationId: string, pollId: string) {
    const poll = await this.getOwnedPoll(invitationId, pollId);
    if (poll.status !== 'confirmed') {
      throw new UnprocessableEntityException({
        code: ErrorCode.VOTE_POLL_CLOSED,
        message: '확정된 투표에서만 되돌릴 수 있습니다.',
      });
    }

    if (poll.voteType === 'date') {
      await this.repo.unconfirmPollAndClearInvitation(poll.id, invitationId);
    } else {
      await this.repo.unconfirmPollOnly(poll.id);
    }

    const invitation = await this.repo.findInvitationById(invitationId);
    const title = invitation?.title ?? '모임';
    const userIds = await this.repo.findAllParticipantUserIds(invitationId);
    await Promise.all(
      userIds.map((userId) =>
        this.notificationsService.notify({
          userId,
          type:       'vote_reminder',
          content:    `[${title}] 확정됐던 항목이 취소됐어요. 호스트가 다시 정할 예정이에요.`,
          targetType: 'invitation',
          targetId:   invitationId,
          invitationId,
        }),
      ),
    );

    return this.repo.findPollById(poll.id);
  }

  // ── Scheduler용 공개 메서드 ──────────────────────────────────────────────────

  async processExpiredPolls() {
    const polls = await this.repo.findExpiredOpenPolls();
    for (const poll of polls) {
      await this.processClose(poll, poll.invitationId);
    }
  }

  async sendReminders() {
    const polls = await this.repo.findPollsNeedingReminder();
    if (polls.length === 0) return;

    const allNonVoters = await this.repo.findNonVotersByPollIds(polls);

    //pollId -> userId []그루핑 (in-memory)
    const nonVotersByPoll = new Map<string, string[]>();
    for (const v of allNonVoters) {
      const list = nonVotersByPoll.get(v.pollId) ?? [];
      list.push(v.userId);
      nonVotersByPoll.set(v.pollId, list);
    }

    await Promise.allSettled(
      polls.flatMap((poll) => {
        const title = poll.invitationTitle ?? '모임';
        const userIds = nonVotersByPoll.get(poll.id) ?? [];
        return userIds.map((userId) =>
          this.notificationsService.notify({
            userId,
            type: 'vote_reminder',
            content: `[${title}] 투표 마감 30분 전입니다. 아직 응답하지 않으셨어요!`,
            targetType: 'invitation',
            targetId: poll.invitationId,
            invitationId: poll.invitationId,
          }),
        );
      }),
    );

    await this.repo.updatePollsReminderSentAt(polls.map((p) => p.id));
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  private async assertParticipant(userId: string, invitationId: string): Promise<string> {
    const participantId = await this.repo.findParticipantIdByUser(userId, invitationId);
    if (!participantId) {
      throw new NotFoundException({
        code: ErrorCode.PARTICIPANT_NOT_FOUND,
        message: '해당 초대장의 참가자가 아닙니다.',
      });
    }
    return participantId;
  }

  /** pollId로 투표를 찾고, 해당 초대장 소속인지 검증. */
  private async getOwnedPoll(invitationId: string, pollId: string): Promise<DateVotePoll> {
    const poll = await this.repo.findPollById(pollId);
    if (!poll || poll.invitationId !== invitationId) {
      throw new NotFoundException({ code: ErrorCode.VOTE_POLL_NOT_FOUND, message: '투표를 찾을 수 없습니다.' });
    }
    return poll;
  }

  private assertNoDuplicateSlots(slots: SlotShape[]) {
    if (findDuplicateVoteSlotKey(slots)) {
      throw new UnprocessableEntityException({
        code: ErrorCode.VOTE_SLOT_DUPLICATE,
        message: '동일한 후보는 중복 등록할 수 없습니다.',
      });
    }
  }

  /** 슬롯 값이 투표 타입에 맞는지 검증 (date 투표=date 필수/label 금지, custom=label 필수/date 금지) */
  private assertSlotMatchesType(voteType: 'date' | 'custom', slot: SlotShape) {
    const hasDate = slot.date != null && slot.date !== '';
    const hasLabel = slot.label != null && slot.label !== '';
    const valid = voteType === 'date' ? hasDate && !hasLabel : hasLabel && !hasDate;
    if (!valid) {
      throw new UnprocessableEntityException({
        code: ErrorCode.VOTE_SLOT_TYPE_MISMATCH,
        message: voteType === 'date'
          ? '날짜 투표의 후보는 날짜여야 합니다.'
          : '커스텀 투표의 후보는 텍스트(label)여야 합니다.',
      });
    }
  }

  private assertOpen(poll: { status: string; closesAt: Date }) {
    if (poll.status !== 'open' || new Date() > poll.closesAt) {
      throw new UnprocessableEntityException({
        code: ErrorCode.VOTE_POLL_CLOSED,
        message: '마감된 투표입니다.',
      });
    }
  }

  private async processClose(poll: DateVotePoll, invitationId: string) {
    await this.repo.updatePoll(poll.id, { status: 'closed' });

    const slots = await this.repo.findSlotsByPollId(poll.id);
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
      await this.applyConfirmation({ ...poll, status: 'closed' }, invitationId, winners[0]!.slot);
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
            type:         'vote_tied',
            content:      userId === hostUserId
              ? `[${title}] 투표가 마감됐어요. 동점이 발생해 직접 선택해주세요.`
              : `[${title}] 투표가 마감됐어요. 호스트가 결과를 선택할 예정이에요.`,
            targetType:   'invitation',
            targetId:     invitationId,
            invitationId,
          }),
        ),
      );
    }

    return this.repo.findPollById(poll.id);
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

  /** 투표 타입에 따라 확정을 적용한다. date 투표만 invitation.eventStartAt을 세팅. */
  private async applyConfirmation(
    poll: DateVotePoll,
    invitationId: string,
    slot: DateVoteSlot,
  ) {
    const invitation = await this.repo.findInvitationById(invitationId);
    const title = invitation?.title ?? '모임';
    const userIds = await this.repo.findAllParticipantUserIds(invitationId);

    let content: string;
    if (poll.voteType === 'date' && slot.date) {
      // 날짜+시간을 eventStartAt으로 변환 (KST 기준, UTC로 저장)
      const eventStartAt = new Date(`${slot.date}T${slot.startTime ?? '00:00'}:00+09:00`);
      await this.repo.confirmPollAndUpdateInvitation(poll.id, slot.id, invitationId, eventStartAt);
      content = `${title} 날짜가 확정됐어요! ${this.formatConfirmedDate(slot.date, slot.startTime)}`;
    } else {
      await this.repo.confirmPollSlotOnly(poll.id, slot.id);
      const pollLabel = poll.title ?? '투표';
      content = `[${title}] ${pollLabel} 결과가 '${slot.label ?? ''}'(으)로 확정됐어요!`;
    }

    await Promise.all(
      userIds.map((userId) =>
        this.notificationsService.notify({
          userId,
          type:         'vote_confirmed',
          content,
          targetType:   'invitation',
          targetId:     invitationId,
          invitationId,
        }),
      ),
    );
  }
}
