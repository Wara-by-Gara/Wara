import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { AdminScopeGuard } from './admin-scope.guard';
import { UserRole } from '../enums/role.enum';
import { createMockExecutionContext, createMockRequest } from './test-utils';

describe('AdminScopeGuard', () => {
  let guard: AdminScopeGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AdminScopeGuard,
        { provide: Reflector, useValue: { getAllAndOverride: jest.fn() } },
      ],
    }).compile();

    guard = module.get(AdminScopeGuard);
    reflector = module.get(Reflector);
  });

  it('@AdminOnly 메타데이터가 없으면 통과한다', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const ctx = createMockExecutionContext(createMockRequest());

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('user.scope에 admin이 포함되면 통과한다', () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const ctx = createMockExecutionContext(
      createMockRequest({
        user: { id: 'u1', role: UserRole.ADMIN, scope: ['admin'] },
      }),
    );

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('user가 없으면 TOKEN_INVALID로 401을 던진다', () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const ctx = createMockExecutionContext(createMockRequest());

    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('scope에 admin이 없으면 INSUFFICIENT_SCOPE로 403을 던진다', () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const ctx = createMockExecutionContext(
      createMockRequest({
        user: { id: 'u1', role: UserRole.ADMIN, scope: [] },
      }),
    );

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(ctx)).toThrow('INSUFFICIENT_SCOPE');
  });

  it('scope 배열 자체가 없으면 INSUFFICIENT_SCOPE로 403을 던진다', () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const ctx = createMockExecutionContext(
      createMockRequest({
        user: {
          id: 'u1',
          role: UserRole.ADMIN,
          scope: undefined as unknown as string[],
        },
      }),
    );

    expect(() => guard.canActivate(ctx)).toThrow('INSUFFICIENT_SCOPE');
  });
});
