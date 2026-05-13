import { UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UserRole } from '../enums/role.enum';
import { createMockExecutionContext, createMockRequest } from './test-utils';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: jest.Mocked<Reflector>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: Reflector,
          useValue: { getAllAndOverride: jest.fn() },
        },
        {
          provide: JwtService,
          useValue: { verifyAsync: jest.fn() },
        },
      ],
    }).compile();

    guard = module.get(JwtAuthGuard);
    reflector = module.get(Reflector);
    jwtService = module.get(JwtService);
  });

  it('@Public() 메타데이터가 있으면 통과한다', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const ctx = createMockExecutionContext(createMockRequest());

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('Authorization Bearer 헤더의 토큰을 검증하여 req.user에 주입한다', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const payload = { userId: 'u1', role: UserRole.MEMBER, scope: [] };
    jwtService.verifyAsync.mockResolvedValue(payload);

    const req = createMockRequest({
      headers: { authorization: 'Bearer abc.def.ghi' },
    });
    const ctx = createMockExecutionContext(req);

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith('abc.def.ghi');
    expect(req.user).toEqual(payload);
  });

  it('헤더에 토큰이 없으면 쿠키의 accessToken을 사용한다', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const payload = { userId: 'u1', role: UserRole.MEMBER, scope: [] };
    jwtService.verifyAsync.mockResolvedValue(payload);

    const req = createMockRequest({ cookies: { accessToken: 'cookie.tok.en' } });
    const ctx = createMockExecutionContext(req);

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith('cookie.tok.en');
  });

  it('토큰이 없으면 TOKEN_INVALID로 401을 던진다', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const ctx = createMockExecutionContext(createMockRequest());

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    await expect(guard.canActivate(ctx)).rejects.toThrow('TOKEN_INVALID');
  });

  it('토큰이 만료되면 TOKEN_EXPIRED로 401을 던진다', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    jwtService.verifyAsync.mockRejectedValue(
      new TokenExpiredError('jwt expired', new Date()),
    );

    const ctx = createMockExecutionContext(
      createMockRequest({ headers: { authorization: 'Bearer x' } }),
    );

    await expect(guard.canActivate(ctx)).rejects.toThrow('TOKEN_EXPIRED');
  });

  it('토큰이 유효하지 않으면 TOKEN_INVALID로 401을 던진다', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    jwtService.verifyAsync.mockRejectedValue(new Error('invalid signature'));

    const ctx = createMockExecutionContext(
      createMockRequest({ headers: { authorization: 'Bearer x' } }),
    );

    await expect(guard.canActivate(ctx)).rejects.toThrow('TOKEN_INVALID');
  });
});
