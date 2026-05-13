import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { UserRole } from '../../common/enums/role.enum';
import {
  AdminUserView,
  IUserRepository,
  USER_REPOSITORY,
} from '../repositories/user.repository.interface';
import { AdminBootstrapService } from './admin-bootstrap.service';

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

const buildService = (envValue: string) => {
  const userRepo: jest.Mocked<IUserRepository> = {
    findById: jest.fn(),
    countAdmins: jest.fn(),
    updateRole: jest.fn(),
    updateStatus: jest.fn(),
  };
  const configValues = new Map([['INITIAL_ADMIN_USER_IDS', envValue]]);
  return Test.createTestingModule({
    providers: [
      AdminBootstrapService,
      {
        provide: ConfigService,
        useValue: {
          get: (key: string, defaultValue?: string) =>
            configValues.get(key) ?? defaultValue ?? '',
        },
      },
      { provide: USER_REPOSITORY, useValue: userRepo },
    ],
  })
    .compile()
    .then((module) => ({
      service: module.get(AdminBootstrapService),
      userRepo,
    }));
};

describe('AdminBootstrapService', () => {
  it('env에 매칭되는 user는 admin으로 승격된다', async () => {
    const { service, userRepo } = await buildService('user-1,user-2');
    const user = buildUser({ id: 'user-1', role: UserRole.MEMBER });
    userRepo.updateRole.mockResolvedValue({ ...user, role: UserRole.ADMIN });

    const result = await service.ensureAdminRoleIfEligible(user);

    expect(userRepo.updateRole).toHaveBeenCalledWith('user-1', UserRole.ADMIN);
    expect(result.role).toBe(UserRole.ADMIN);
  });

  it('env에 매칭되지 않는 user는 변경되지 않는다', async () => {
    const { service, userRepo } = await buildService('user-1,user-2');
    const user = buildUser({ id: 'user-99', role: UserRole.MEMBER });

    const result = await service.ensureAdminRoleIfEligible(user);

    expect(userRepo.updateRole).not.toHaveBeenCalled();
    expect(result).toBe(user);
  });

  it('이미 admin인 user는 updateRole이 호출되지 않는다', async () => {
    const { service, userRepo } = await buildService('user-1');
    const user = buildUser({ id: 'user-1', role: UserRole.ADMIN });

    const result = await service.ensureAdminRoleIfEligible(user);

    expect(userRepo.updateRole).not.toHaveBeenCalled();
    expect(result).toBe(user);
  });

  it('env가 빈 문자열이면 어떤 user도 승격되지 않는다', async () => {
    const { service, userRepo } = await buildService('');
    const user = buildUser({ id: 'user-1', role: UserRole.MEMBER });

    await service.ensureAdminRoleIfEligible(user);

    expect(userRepo.updateRole).not.toHaveBeenCalled();
  });

  it('env CSV의 공백과 빈 항목은 무시한다', async () => {
    const { service, userRepo } = await buildService(' user-1 , , user-2 ');
    userRepo.updateRole.mockImplementation(async (id, role) =>
      buildUser({ id, role }),
    );

    await service.ensureAdminRoleIfEligible(buildUser({ id: 'user-1' }));
    await service.ensureAdminRoleIfEligible(buildUser({ id: 'user-2' }));

    expect(userRepo.updateRole).toHaveBeenCalledTimes(2);
  });
});
