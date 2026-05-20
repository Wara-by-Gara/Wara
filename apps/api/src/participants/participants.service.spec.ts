import { ConflictException, ForbiddenException, BadRequestException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ParticipantsService } from './participants.service';
import { ParticipantsRepository } from './participants.repository';
import { BlocklistRepository } from '../common/repositories/blocklist.repository';
import { ErrorCode } from '../common/constants/error-codes';
import type { Participant } from '../../drizzle/schema';

const mockRepo = () => ({
  findAllByInvitation: jest.fn(),
  findByIdWithUser: jest.fn(),
  findById: jest.fn(),
  findByUserAndInvitation: jest.fn(),
  findInvitationStatus: jest.fn(),
  create: jest.fn(),
  updateRsvpStatus: jest.fn(),
  updateHidden: jest.fn(),
  hardDelete: jest.fn(),
  getMutualParticipants: jest.fn(),
  getSharedInvitations: jest.fn(),
});

const mockBlocklistRepo = () => ({
  add: jest.fn(),
});

function makeParticipant(overrides: Partial<Participant> = {}): Participant {
  return {
    id: 'P001',
    userId: 'U001',
    invitationId: 'INV001',
    memberRole: 'GUEST',
    rsvpStatus: 'attending',
    isHidden: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Participant;
}

describe('ParticipantsService', () => {
  let service: ParticipantsService;
  let repo: ReturnType<typeof mockRepo>;
  let blocklistRepo: ReturnType<typeof mockBlocklistRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParticipantsService,
        { provide: ParticipantsRepository, useFactory: mockRepo },
        { provide: BlocklistRepository, useFactory: mockBlocklistRepo },
      ],
    }).compile();

    service = module.get(ParticipantsService);
    repo = module.get(ParticipantsRepository) as unknown as ReturnType<typeof mockRepo>;
    blocklistRepo = module.get(BlocklistRepository) as unknown as ReturnType<typeof mockBlocklistRepo>;
  });

  describe('join', () => {
    it('이미 참가한 초대장에 재참가 시 PARTICIPANT_ALREADY_EXISTS(409)', async () => {
      repo.findByUserAndInvitation.mockResolvedValue(makeParticipant());

      await expect(
        service.join('U001', 'INV001', { rsvpStatus: 'attending' }),
      ).rejects.toThrow(ConflictException);

      await expect(
        service.join('U001', 'INV001', { rsvpStatus: 'attending' }),
      ).rejects.toMatchObject({ message: ErrorCode.PARTICIPANT_ALREADY_EXISTS });
    });

    it('마감된 초대장 참가 시 INVITATION_CLOSED(422)', async () => {
      repo.findByUserAndInvitation.mockResolvedValue(null);
      repo.findInvitationStatus.mockResolvedValue('closed');

      await expect(
        service.join('U001', 'INV001', { rsvpStatus: 'attending' }),
      ).rejects.toThrow(UnprocessableEntityException);

      await expect(
        service.join('U001', 'INV001', { rsvpStatus: 'attending' }),
      ).rejects.toMatchObject({ message: ErrorCode.INVITATION_CLOSED });
    });

    it('존재하지 않는 초대장 참가 시 PARTICIPANT_NOT_FOUND(404)', async () => {
      repo.findByUserAndInvitation.mockResolvedValue(null);
      repo.findInvitationStatus.mockResolvedValue(null);

      await expect(
        service.join('U001', 'INV999', { rsvpStatus: 'attending' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('정상 참가 시 participant 생성', async () => {
      repo.findByUserAndInvitation.mockResolvedValue(null);
      repo.findInvitationStatus.mockResolvedValue('open');
      repo.create.mockResolvedValue(makeParticipant());

      const result = await service.join('U001', 'INV001', { rsvpStatus: 'attending' });

      expect(repo.create).toHaveBeenCalledWith({ userId: 'U001', invitationId: 'INV001', rsvpStatus: 'attending' });
      expect(result).toBeDefined();
    });
  });

  describe('updateRsvp', () => {
    it('타인의 RSVP 변경 시도 시 RSVP_PERMISSION_DENIED(403)', async () => {
      const viewer = makeParticipant({ id: 'P001' });

      await expect(
        service.updateRsvp('INV001', 'P002', { rsvpStatus: 'absent' }, viewer),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        service.updateRsvp('INV001', 'P002', { rsvpStatus: 'absent' }, viewer),
      ).rejects.toMatchObject({ message: ErrorCode.RSVP_PERMISSION_DENIED });
    });

    it('HOST의 RSVP 변경 시도 시 RSVP_PERMISSION_DENIED(403)', async () => {
      const host = makeParticipant({ id: 'P001', memberRole: 'HOST' });

      await expect(
        service.updateRsvp('INV001', 'P001', { rsvpStatus: 'absent' }, host),
      ).rejects.toThrow(ForbiddenException);
    });

    it('마감된 초대장 RSVP 변경 시 INVITATION_CLOSED(422)', async () => {
      const viewer = makeParticipant({ id: 'P001', memberRole: 'GUEST' });
      repo.findInvitationStatus.mockResolvedValue('closed');

      await expect(
        service.updateRsvp('INV001', 'P001', { rsvpStatus: 'absent' }, viewer),
      ).rejects.toThrow(UnprocessableEntityException);

      await expect(
        service.updateRsvp('INV001', 'P001', { rsvpStatus: 'absent' }, viewer),
      ).rejects.toMatchObject({ message: ErrorCode.INVITATION_CLOSED });
    });

    it('정상 RSVP 변경', async () => {
      const viewer = makeParticipant({ id: 'P001', memberRole: 'GUEST' });
      repo.findInvitationStatus.mockResolvedValue('open');
      repo.updateRsvpStatus.mockResolvedValue({ ...makeParticipant(), rsvpStatus: 'absent' });

      const result = await service.updateRsvp('INV001', 'P001', { rsvpStatus: 'absent' }, viewer);

      expect(repo.updateRsvpStatus).toHaveBeenCalledWith('P001', 'absent');
      expect(result?.rsvpStatus).toBe('absent');
    });
  });

  describe('leave', () => {
    it('존재하지 않는 participant 탈퇴 시 PARTICIPANT_NOT_FOUND(404)', async () => {
      repo.findById.mockResolvedValue(null);
      const viewer = makeParticipant({ id: 'P001', invitationId: 'INV001' });

      await expect(service.leave('P001', viewer)).rejects.toThrow(NotFoundException);
    });

    it('다른 초대장의 participant 탈퇴 시도 시 PARTICIPANT_NOT_FOUND(404)', async () => {
      repo.findById.mockResolvedValue(makeParticipant({ id: 'P001', invitationId: 'INV999' }));
      const viewer = makeParticipant({ id: 'P001', invitationId: 'INV001' });

      await expect(service.leave('P001', viewer)).rejects.toThrow(NotFoundException);
    });

    it('HOST가 본인 탈퇴 시도 시 HOST_CANNOT_LEAVE(400)', async () => {
      const host = makeParticipant({ id: 'P001', memberRole: 'HOST', invitationId: 'INV001' });
      repo.findById.mockResolvedValue(host);

      await expect(service.leave('P001', host)).rejects.toThrow(BadRequestException);
      await expect(service.leave('P001', host)).rejects.toMatchObject({ message: ErrorCode.HOST_CANNOT_LEAVE });
    });

    it('GUEST가 타인 강퇴 시도 시 RSVP_PERMISSION_DENIED(403)', async () => {
      const target = makeParticipant({ id: 'P002', memberRole: 'GUEST', invitationId: 'INV001' });
      repo.findById.mockResolvedValue(target);
      const viewer = makeParticipant({ id: 'P001', memberRole: 'GUEST', invitationId: 'INV001' });

      await expect(service.leave('P002', viewer)).rejects.toThrow(ForbiddenException);
    });

    it('HOST가 GUEST 강퇴 시 blocklist에 추가', async () => {
      const target = makeParticipant({ id: 'P002', memberRole: 'GUEST', userId: 'U002', invitationId: 'INV001' });
      repo.findById.mockResolvedValue(target);
      repo.hardDelete.mockResolvedValue(undefined);
      blocklistRepo.add.mockResolvedValue(undefined);
      const host = makeParticipant({ id: 'P001', memberRole: 'HOST', userId: 'U001', invitationId: 'INV001' });

      await service.leave('P002', host);

      expect(repo.hardDelete).toHaveBeenCalledWith('P002');
      expect(blocklistRepo.add).toHaveBeenCalledWith('INV001', 'U002', 'U001');
    });

    it('본인 탈퇴 시 blocklist 추가 없음', async () => {
      const viewer = makeParticipant({ id: 'P001', memberRole: 'GUEST', userId: 'U001', invitationId: 'INV001' });
      repo.findById.mockResolvedValue(viewer);
      repo.hardDelete.mockResolvedValue(undefined);

      await service.leave('P001', viewer);

      expect(repo.hardDelete).toHaveBeenCalledWith('P001');
      expect(blocklistRepo.add).not.toHaveBeenCalled();
    });
  });
});
