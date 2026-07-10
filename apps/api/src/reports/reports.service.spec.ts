import { NotFoundException, ConflictException } from '@nestjs/common';
import { ReportsService } from './reports.service';
import type { ReportsRepository } from './reports.repository';
import { ErrorCode } from '../common/constants/error-codes';

describe('ReportsService', () => {
  let repo: jest.Mocked<Pick<
    ReportsRepository,
    'findTarget' | 'create' | 'findById' | 'update' | 'setHidden'
  >>;
  let service: ReportsService;

  beforeEach(() => {
    repo = {
      findTarget: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn().mockResolvedValue({ id: 'r1' }),
      setHidden: jest.fn().mockResolvedValue(undefined),
    } as never;
    service = new ReportsService(repo as never);
  });

  describe('report', () => {
    it('대상이 없으면 REPORT_TARGET_NOT_FOUND', async () => {
      repo.findTarget.mockResolvedValue(null);
      await expect(service.report('u1', { targetType: 'photo', targetId: 'p1' } as never))
        .rejects.toBeInstanceOf(NotFoundException);
    });

    it('중복 신고면 REPORT_ALREADY_EXISTS (create가 null)', async () => {
      repo.findTarget.mockResolvedValue({ invitationId: 'inv1' });
      repo.create.mockResolvedValue(null);
      await expect(service.report('u1', { targetType: 'photo', targetId: 'p1' } as never))
        .rejects.toBeInstanceOf(ConflictException);
    });

    it('성공 시 대상 invitationId를 함께 저장', async () => {
      repo.findTarget.mockResolvedValue({ invitationId: 'inv1' });
      repo.create.mockResolvedValue({ id: 'r1', status: 'pending' } as never);
      const res = await service.report('u1', { targetType: 'feedback', targetId: 'f1', reason: '스팸' } as never);
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({
        reporterUserId: 'u1', targetType: 'feedback', targetId: 'f1', invitationId: 'inv1', reason: '스팸',
      }));
      expect(res).toEqual({ id: 'r1', status: 'pending' });
    });
  });

  describe('hide / restore', () => {
    it('hide는 대상을 숨기고 신고를 resolved로', async () => {
      repo.findById.mockResolvedValue({ id: 'r1', targetType: 'photo', targetId: 'p1' } as never);
      await service.hide('r1', 'admin1');
      expect(repo.setHidden).toHaveBeenCalledWith('photo', 'p1', true);
      expect(repo.update).toHaveBeenCalledWith('r1', { status: 'resolved', handledByUserId: 'admin1' });
    });

    it('restore는 숨김을 풀고 신고를 dismissed로', async () => {
      repo.findById.mockResolvedValue({ id: 'r1', targetType: 'feedback', targetId: 'f1' } as never);
      await service.restore('r1', 'admin1');
      expect(repo.setHidden).toHaveBeenCalledWith('feedback', 'f1', false);
      expect(repo.update).toHaveBeenCalledWith('r1', { status: 'dismissed', handledByUserId: 'admin1' });
    });

    it('없는 신고 처리 시 REPORT_NOT_FOUND', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.hide('rX', 'admin1')).rejects.toMatchObject({ message: ErrorCode.REPORT_NOT_FOUND });
    });
  });
});
