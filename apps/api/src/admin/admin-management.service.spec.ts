import { NotFoundException } from '@nestjs/common';
import { AdminManagementService } from './admin-management.service';
import type { AdminManagementRepository } from './admin-management.repository';

describe('AdminManagementService', () => {
  let repo: jest.Mocked<Pick<
    AdminManagementRepository,
    'findUserById' | 'countHostedActive' | 'countParticipations' | 'setUserSuspension'
    | 'findInvitationById' | 'setInvitationStatus' | 'softDeleteInvitation'
  >>;
  let service: AdminManagementService;

  beforeEach(() => {
    repo = {
      findUserById: jest.fn(),
      countHostedActive: jest.fn().mockResolvedValue(0),
      countParticipations: jest.fn().mockResolvedValue(0),
      setUserSuspension: jest.fn(),
      findInvitationById: jest.fn(),
      setInvitationStatus: jest.fn(),
      softDeleteInvitation: jest.fn().mockResolvedValue(undefined),
    } as never;
    service = new AdminManagementService(repo as never);
  });

  it('getUser: 없는 유저면 404', async () => {
    repo.findUserById.mockResolvedValue(null);
    await expect(service.getUser('uX')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('getUser: 프로필 + 통계 반환', async () => {
    repo.findUserById.mockResolvedValue({ id: 'u1', email: 'a@b.c', name: '홍', nickname: null, profileImageUrl: null, role: 'member', suspendedAt: null, suspendedReason: null, deletedAt: null, createdAt: new Date() } as never);
    repo.countHostedActive.mockResolvedValue(2);
    repo.countParticipations.mockResolvedValue(5);
    const res = await service.getUser('u1');
    expect(res.stats).toEqual({ hostedActive: 2, participations: 5 });
  });

  it('suspendUser: suspendedAt 세팅', async () => {
    repo.setUserSuspension.mockResolvedValue({ id: 'u1', suspendedAt: new Date() } as never);
    const res = await service.suspendUser('u1', '스팸');
    expect(repo.setUserSuspension).toHaveBeenCalledWith('u1', expect.any(Date), '스팸');
    expect(res.suspendedAt).not.toBeNull();
  });

  it('unsuspendUser: suspendedAt 해제', async () => {
    repo.setUserSuspension.mockResolvedValue({ id: 'u1', suspendedAt: null } as never);
    await service.unsuspendUser('u1');
    expect(repo.setUserSuspension).toHaveBeenCalledWith('u1', null, null);
  });

  it('deleteInvitation: 없는 모임이면 404', async () => {
    repo.findInvitationById.mockResolvedValue(null);
    await expect(service.deleteInvitation('iX')).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.softDeleteInvitation).not.toHaveBeenCalled();
  });

  it('setInvitationStatus: 상태 변경', async () => {
    repo.setInvitationStatus.mockResolvedValue({ id: 'i1', status: 'closed' } as never);
    const res = await service.setInvitationStatus('i1', 'closed');
    expect(res).toEqual({ id: 'i1', status: 'closed' });
  });
});
