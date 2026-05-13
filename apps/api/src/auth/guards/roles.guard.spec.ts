import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../enums/role.enum';
import { createMockExecutionContext, createMockRequest } from './test-utils';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        RolesGuard,
        { provide: Reflector, useValue: { getAllAndOverride: jest.fn() } },
      ],
    }).compile();

    guard = module.get(RolesGuard);
    reflector = module.get(Reflector);
  });

  it('@Roles 메타데이터가 없으면 통과한다', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const ctx = createMockExecutionContext(createMockRequest());

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('user.role이 허용 role 중 하나면 통과한다', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    const ctx = createMockExecutionContext(
      createMockRequest({
        user: { userId: 'u1', role: UserRole.ADMIN, scope: [] },
      }),
    );

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('user가 없으면 TOKEN_INVALID로 401을 던진다', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    const ctx = createMockExecutionContext(createMockRequest());

    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('role이 일치하지 않으면 INSUFFICIENT_ROLE로 403을 던진다', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    const ctx = createMockExecutionContext(
      createMockRequest({
        user: { userId: 'u1', role: UserRole.MEMBER, scope: [] },
      }),
    );

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(ctx)).toThrow('INSUFFICIENT_ROLE');
  });
});
