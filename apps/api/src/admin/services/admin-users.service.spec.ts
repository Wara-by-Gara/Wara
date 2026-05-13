import {
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { UserRole } from '../../common/enums/role.enum';
import {
  AdminUserView,
  IUserRepository,
  USER_REPOSITORY,
} from '../repositories/user.repository.interface';
import { AdminUsersService } from './admin-users.service';

const buildUser = (overrides: Partial<AdminUserView> = {}): AdminUserView => ({
  id: 'user-1',
  email: 'a@b.com',
  name: null,
  nickname: null,
  role: UserRole.MEMBER,
  deletedAt: null,
  promotedBy: null,
  promotedAt: null,
  ...overrides,
});

describe('AdminUsersService', () => {
  let service: AdminUsersService;
  let repo: jest.Mocked<IUserRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AdminUsersService,
        {
          provide: USER_REPOSITORY,
          useValue: {
            findById: jest.fn(),
            countAdmins: jest.fn(),
            updateRole: jest.fn(),
            updateStatus: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(AdminUsersService);
    repo = module.get(USER_REPOSITORY);
  });

  it('대상 user가 없으면 USER_NOT_FOUND', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(
      service.updateStatus('actor', 'target', { role: UserRole.ADMIN }),
    ).rejects.toThrow(NotFoundException);
  });

  it('자기 자신을 member로 강등하려 하면 CANNOT_DEMOTE_SELF', async () => {
    repo.findById.mockResolvedValue(buildUser({ id: 'me', role: UserRole.ADMIN }));

    await expect(
      service.updateStatus('me', 'me', { role: UserRole.MEMBER }),
    ).rejects.toThrow(ForbiddenException);
    await expect(
      service.updateStatus('me', 'me', { role: UserRole.MEMBER }),
    ).rejects.toThrow('CANNOT_DEMOTE_SELF');
  });

  it('최후의 admin을 강등하려 하면 CANNOT_DEMOTE_LAST_ADMIN', async () => {
    repo.findById.mockResolvedValue(
      buildUser({ id: 'last', role: UserRole.ADMIN }),
    );
    repo.countAdmins.mockResolvedValue(1);

    await expect(
      service.updateStatus('actor', 'last', { role: UserRole.MEMBER }),
    ).rejects.toThrow('CANNOT_DEMOTE_LAST_ADMIN');
  });

  it('admin 2명 이상일 때 다른 admin은 강등 가능', async () => {
    repo.findById.mockResolvedValue(
      buildUser({ id: 'target', role: UserRole.ADMIN }),
    );
    repo.countAdmins.mockResolvedValue(3);
    repo.updateStatus.mockResolvedValue(
      buildUser({ id: 'target', role: UserRole.MEMBER }),
    );

    const result = await service.updateStatus('actor', 'target', {
      role: UserRole.MEMBER,
    });

    expect(result.role).toBe(UserRole.MEMBER);
    expect(repo.updateStatus).toHaveBeenCalledWith('target', {
      role: UserRole.MEMBER,
      deleted: undefined,
      promotedBy: undefined,
    });
  });

  it('admin 승격 시 promotedBy로 actorId가 기록된다', async () => {
    repo.findById.mockResolvedValue(buildUser({ id: 'target' }));
    repo.updateStatus.mockResolvedValue(
      buildUser({ id: 'target', role: UserRole.ADMIN, promotedBy: 'actor' }),
    );

    const result = await service.updateStatus('actor', 'target', {
      role: UserRole.ADMIN,
    });

    expect(repo.updateStatus).toHaveBeenCalledWith('target', {
      role: UserRole.ADMIN,
      deleted: undefined,
      promotedBy: 'actor',
    });
    expect(result.promotedBy).toBe('actor');
  });

  it('soft delete 요청은 deleted 필드만 전달', async () => {
    repo.findById.mockResolvedValue(buildUser({ id: 'target' }));
    repo.updateStatus.mockResolvedValue(
      buildUser({ id: 'target', deletedAt: new Date() }),
    );

    await service.updateStatus('actor', 'target', { deleted: true });

    expect(repo.updateStatus).toHaveBeenCalledWith('target', {
      role: undefined,
      deleted: true,
      promotedBy: undefined,
    });
  });
});
