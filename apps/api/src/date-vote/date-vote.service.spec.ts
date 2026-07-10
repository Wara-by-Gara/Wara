import { NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { DateVoteService } from './date-vote.service';
import type { DateVoteRepository } from './date-vote.repository';
import type { NotificationsService } from '../notifications/notifications.service';
import { ErrorCode } from '../common/constants/error-codes';

// 다중화/커스텀 재설계 후 신규 로직(updateSlot / unconfirmSlot / 타입검증) 검증. repo/notifications mock.
describe('DateVoteService — updateSlot / unconfirmSlot', () => {
  let repo: jest.Mocked<Pick<
    DateVoteRepository,
    | 'findPollById'
    | 'findSlotById'
    | 'findSlotsByPollId'
    | 'updateSlot'
    | 'unconfirmPollAndClearInvitation'
    | 'unconfirmPollOnly'
    | 'findInvitationById'
    | 'findAllParticipantUserIds'
  >>;
  let notifications: jest.Mocked<Pick<NotificationsService, 'notify'>>;
  let service: DateVoteService;

  const inv = 'inv1';
  const openDatePoll = {
    id: 'poll1', invitationId: inv, voteType: 'date',
    status: 'open', closesAt: new Date(Date.now() + 3_600_000),
  };

  beforeEach(() => {
    repo = {
      findPollById: jest.fn(),
      findSlotById: jest.fn(),
      findSlotsByPollId: jest.fn(),
      updateSlot: jest.fn(),
      unconfirmPollAndClearInvitation: jest.fn(),
      unconfirmPollOnly: jest.fn(),
      findInvitationById: jest.fn(),
      findAllParticipantUserIds: jest.fn(),
    } as never;
    notifications = { notify: jest.fn().mockResolvedValue(undefined) } as never;
    service = new DateVoteService(repo as never, notifications as never);
  });

  describe('updateSlot', () => {
    it('다른 슬롯과 날짜·시간이 겹치면 VOTE_SLOT_DUPLICATE', async () => {
      repo.findPollById.mockResolvedValue(openDatePoll as never);
      repo.findSlotById.mockResolvedValue({ id: 's1', pollId: 'poll1', date: '2026-08-01', startTime: null, label: null } as never);
      repo.findSlotsByPollId.mockResolvedValue([
        { id: 's1', date: '2026-08-01', startTime: null, label: null },
        { id: 's2', date: '2026-08-02', startTime: '10:00', label: null },
      ] as never);

      await expect(
        service.updateSlot(inv, 'poll1', 's1', { date: '2026-08-02', startTime: '10:00' }),
      ).rejects.toMatchObject({ response: { code: ErrorCode.VOTE_SLOT_DUPLICATE } });
      expect(repo.updateSlot).not.toHaveBeenCalled();
    });

    it('자기 자신과만 겹치는 변경은 허용하고 updateSlot 호출', async () => {
      repo.findPollById.mockResolvedValue(openDatePoll as never);
      repo.findSlotById.mockResolvedValue({ id: 's1', pollId: 'poll1', date: '2026-08-01', startTime: null, label: null } as never);
      repo.findSlotsByPollId.mockResolvedValue([{ id: 's1', date: '2026-08-01', startTime: null, label: null }] as never);
      repo.updateSlot.mockResolvedValue({ id: 's1' } as never);

      await service.updateSlot(inv, 'poll1', 's1', { sortOrder: 5 });
      expect(repo.updateSlot).toHaveBeenCalledWith('s1', { sortOrder: 5 });
    });

    it('date 투표 슬롯에 label을 주면 VOTE_SLOT_TYPE_MISMATCH', async () => {
      repo.findPollById.mockResolvedValue(openDatePoll as never);
      repo.findSlotById.mockResolvedValue({ id: 's1', pollId: 'poll1', date: '2026-08-01', startTime: null, label: null } as never);

      await expect(
        service.updateSlot(inv, 'poll1', 's1', { label: '카페' }),
      ).rejects.toMatchObject({ response: { code: ErrorCode.VOTE_SLOT_TYPE_MISMATCH } });
    });

    it('다른 초대장 소속 투표면 VOTE_POLL_NOT_FOUND', async () => {
      repo.findPollById.mockResolvedValue({ ...openDatePoll, invitationId: 'OTHER' } as never);
      await expect(service.updateSlot(inv, 'poll1', 's1', { sortOrder: 1 })).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('unconfirmSlot', () => {
    it('confirmed 상태가 아니면 VOTE_POLL_CLOSED로 거부', async () => {
      repo.findPollById.mockResolvedValue({ ...openDatePoll, status: 'closed' } as never);
      await expect(service.unconfirmSlot(inv, 'poll1')).rejects.toBeInstanceOf(UnprocessableEntityException);
      expect(repo.unconfirmPollAndClearInvitation).not.toHaveBeenCalled();
    });

    it('date 투표 되돌리기는 invitation 날짜까지 해제', async () => {
      repo.findPollById.mockResolvedValue({ id: 'poll1', invitationId: inv, voteType: 'date', status: 'confirmed' } as never);
      repo.findInvitationById.mockResolvedValue({ title: '모임A' } as never);
      repo.findAllParticipantUserIds.mockResolvedValue(['u1', 'u2']);

      await service.unconfirmSlot(inv, 'poll1');
      expect(repo.unconfirmPollAndClearInvitation).toHaveBeenCalledWith('poll1', inv);
      expect(repo.unconfirmPollOnly).not.toHaveBeenCalled();
      expect(notifications.notify).toHaveBeenCalledTimes(2);
    });

    it('custom 투표 되돌리기는 invitation을 건드리지 않음', async () => {
      repo.findPollById.mockResolvedValue({ id: 'poll2', invitationId: inv, voteType: 'custom', status: 'confirmed' } as never);
      repo.findInvitationById.mockResolvedValue({ title: '모임A' } as never);
      repo.findAllParticipantUserIds.mockResolvedValue(['u1']);

      await service.unconfirmSlot(inv, 'poll2');
      expect(repo.unconfirmPollOnly).toHaveBeenCalledWith('poll2');
      expect(repo.unconfirmPollAndClearInvitation).not.toHaveBeenCalled();
    });
  });
});
