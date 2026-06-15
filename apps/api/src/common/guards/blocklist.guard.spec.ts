import { BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { BlocklistGuard } from './blocklist.guard';
import { BlocklistRepository } from '../repositories/blocklist.repository';
import { UserRole } from '../enums/role.enum';
import { ErrorCode } from '../constants/error-codes';

function makeContext(overrides: {
  user?: { id: string; role: UserRole } | null;
  invitationId?: string | undefined;
}): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        user: overrides.user,
        params: overrides.invitationId !== undefined
          ? { invitationId: overrides.invitationId }
          : {},
      }),
    }),
  } as unknown as ExecutionContext;
}

describe('BlocklistGuard', () => {
  let guard: BlocklistGuard;
  let repository: jest.Mocked<BlocklistRepository>;

  beforeEach(() => {
    repository = { isBlocked: jest.fn() } as unknown as jest.Mocked<BlocklistRepository>;
    guard = new BlocklistGuard(repository);
  });

  it('비인증 요청(user 없음) → UnauthorizedException(TOKEN_INVALID)', async () => {
    const ctx = makeContext({ user: null, invitationId: 'inv-1' });

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    await expect(guard.canActivate(ctx)).rejects.toThrow(ErrorCode.TOKEN_INVALID);
  });

  it('ADMIN 역할 → 차단 목록 조회 없이 true 반환', async () => {
    const ctx = makeContext({ user: { id: 'admin-1', role: UserRole.ADMIN }, invitationId: 'inv-1' });

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(repository.isBlocked).not.toHaveBeenCalled();
  });

  it('invitationId 없음 → BadRequestException(INVITATION_ID_REQUIRED)', async () => {
    const ctx = makeContext({ user: { id: 'user-1', role: UserRole.MEMBER }, invitationId: undefined });

    await expect(guard.canActivate(ctx)).rejects.toThrow(BadRequestException);
    await expect(guard.canActivate(ctx)).rejects.toThrow(ErrorCode.INVITATION_ID_REQUIRED);
  });

  it('invitationId 빈 문자열 → BadRequestException', async () => {
    const ctx = makeContext({ user: { id: 'user-1', role: UserRole.MEMBER }, invitationId: '' });

    await expect(guard.canActivate(ctx)).rejects.toThrow(BadRequestException);
  });

  it('차단된 유저 → ForbiddenException(INVITATION_ACCESS_REVOKED)', async () => {
    repository.isBlocked.mockResolvedValue(true);
    const ctx = makeContext({ user: { id: 'user-1', role: UserRole.MEMBER }, invitationId: 'inv-1' });

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    await expect(guard.canActivate(ctx)).rejects.toThrow(ErrorCode.INVITATION_ACCESS_REVOKED);
  });

  it('차단 안 된 유저 → true 반환', async () => {
    repository.isBlocked.mockResolvedValue(false);
    const ctx = makeContext({ user: { id: 'user-1', role: UserRole.MEMBER }, invitationId: 'inv-1' });

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
  });

  it('repository 호출 시 userId + invitationId 정확히 전달', async () => {
    repository.isBlocked.mockResolvedValue(false);
    const ctx = makeContext({ user: { id: 'user-42', role: UserRole.MEMBER }, invitationId: 'inv-99' });

    await guard.canActivate(ctx);

    expect(repository.isBlocked).toHaveBeenCalledWith('user-42', 'inv-99');
  });
});
