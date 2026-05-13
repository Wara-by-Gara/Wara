import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { BlocklistGuard } from './blocklist.guard';
import { UserRole } from '../enums/role.enum';
import {
  BLOCKLIST_REPOSITORY,
  IBlocklistRepository,
} from '../repositories/blocklist.repository.interface';
import { createMockExecutionContext, createMockRequest } from './test-utils';

describe('BlocklistGuard', () => {
  let guard: BlocklistGuard;
  let repo: jest.Mocked<IBlocklistRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        BlocklistGuard,
        {
          provide: BLOCKLIST_REPOSITORY,
          useValue: { isBlocked: jest.fn() },
        },
      ],
    }).compile();

    guard = module.get(BlocklistGuard);
    repo = module.get(BLOCKLIST_REPOSITORY);
  });

  it('user가 없으면 TOKEN_INVALID로 401을 던진다', async () => {
    const ctx = createMockExecutionContext(
      createMockRequest({ params: { invitationId: 'inv1' } }),
    );

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('admin은 차단됐어도 통과한다', async () => {
    repo.isBlocked.mockResolvedValue(true);
    const ctx = createMockExecutionContext(
      createMockRequest({
        user: { userId: 'u1', role: UserRole.ADMIN, scope: ['admin'] },
        params: { invitationId: 'inv1' },
      }),
    );

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(repo.isBlocked).not.toHaveBeenCalled();
  });

  it('invitationId 파라미터가 없으면 400을 던진다', async () => {
    const ctx = createMockExecutionContext(
      createMockRequest({
        user: { userId: 'u1', role: UserRole.MEMBER, scope: [] },
      }),
    );

    await expect(guard.canActivate(ctx)).rejects.toThrow(BadRequestException);
  });

  it('차단되지 않았으면 통과한다', async () => {
    repo.isBlocked.mockResolvedValue(false);
    const ctx = createMockExecutionContext(
      createMockRequest({
        user: { userId: 'u1', role: UserRole.MEMBER, scope: [] },
        params: { invitationId: 'inv1' },
      }),
    );

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('차단된 일반 사용자는 ACCESS_REVOKED로 403을 던진다', async () => {
    repo.isBlocked.mockResolvedValue(true);
    const ctx = createMockExecutionContext(
      createMockRequest({
        user: { userId: 'u1', role: UserRole.MEMBER, scope: [] },
        params: { invitationId: 'inv1' },
      }),
    );

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    await expect(guard.canActivate(ctx)).rejects.toThrow('ACCESS_REVOKED');
  });
});
