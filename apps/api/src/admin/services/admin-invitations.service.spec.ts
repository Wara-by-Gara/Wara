import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  AdminInvitationView,
  IInvitationAdminRepository,
  INVITATION_ADMIN_REPOSITORY,
} from '../repositories/invitation-admin.repository.interface';
import { AdminInvitationsService } from './admin-invitations.service';

const buildInvitation = (
  overrides: Partial<AdminInvitationView> = {},
): AdminInvitationView => ({
  id: 'inv-1',
  userId: 'user-1',
  title: 'test',
  status: 'active',
  closedAt: null,
  closedReason: null,
  ...overrides,
});

describe('AdminInvitationsService', () => {
  let service: AdminInvitationsService;
  let repo: jest.Mocked<IInvitationAdminRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AdminInvitationsService,
        {
          provide: INVITATION_ADMIN_REPOSITORY,
          useValue: { findById: jest.fn(), close: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(AdminInvitationsService);
    repo = module.get(INVITATION_ADMIN_REPOSITORY);
  });

  it('존재하지 않는 invitation은 INVITATION_NOT_FOUND', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(
      service.updateStatus('inv-1', { status: 'closed' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('reason과 함께 종료한다', async () => {
    repo.findById.mockResolvedValue(buildInvitation());
    repo.close.mockResolvedValue(
      buildInvitation({ status: 'closed', closedReason: 'spam' }),
    );

    const result = await service.updateStatus('inv-1', {
      status: 'closed',
      reason: 'spam',
    });

    expect(repo.close).toHaveBeenCalledWith('inv-1', 'spam');
    expect(result.status).toBe('closed');
    expect(result.closedReason).toBe('spam');
  });

  it('reason 없이도 종료 가능', async () => {
    repo.findById.mockResolvedValue(buildInvitation());
    repo.close.mockResolvedValue(buildInvitation({ status: 'closed' }));

    await service.updateStatus('inv-1', { status: 'closed' });

    expect(repo.close).toHaveBeenCalledWith('inv-1', null);
  });
});
