import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { SocialAuthFactory } from './social-auth.factory';
import { OauthPolicyService } from './oauth-policy.service';
import { ErrorCode } from '../common/constants/error-codes';

const mockAuthRepo = () => ({
  revokeValidRefreshToken: jest.fn(),
  findRefreshTokenByHash: jest.fn(),
  findUserById: jest.fn(),
  saveRefreshToken: jest.fn(),
  upsertSocialAccount: jest.fn(),
});

const mockJwtService = () => ({
  sign: jest.fn(),
  signAsync: jest.fn(),
  verify: jest.fn(),
});

const mockConfigService = () => ({
  get: jest.fn().mockReturnValue(1209600),
  getOrThrow: jest.fn().mockReturnValue('test-secret'),
});

const mockSocialAuthFactory = () => ({
  getStrategy: jest.fn(),
});

const mockOauthPolicyService = () => ({
  validatePlatform: jest.fn(),
});

describe('AuthService', () => {
  let service: AuthService;
  let repo: ReturnType<typeof mockAuthRepo>;
  let jwtService: ReturnType<typeof mockJwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthRepository, useFactory: mockAuthRepo },
        { provide: JwtService, useFactory: mockJwtService },
        { provide: ConfigService, useFactory: mockConfigService },
        { provide: SocialAuthFactory, useFactory: mockSocialAuthFactory },
        { provide: OauthPolicyService, useFactory: mockOauthPolicyService },
      ],
    }).compile();

    service = module.get(AuthService);
    repo = module.get(AuthRepository) as unknown as ReturnType<typeof mockAuthRepo>;
    jwtService = module.get(JwtService) as unknown as ReturnType<typeof mockJwtService>;
  });

  describe('verifyState', () => {
    it('유효한 state — 예외 없음', () => {
      jwtService.verify.mockReturnValue({ nonce: 'abc' });
      expect(() => service.verifyState('valid-state')).not.toThrow();
    });

    it('위조된/만료된 state — AUTH_INVALID_STATE(401)', () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('invalid signature');
      });

      expect(() => service.verifyState('tampered')).toThrow(UnauthorizedException);
      expect(() => service.verifyState('tampered')).toThrowError(
        expect.objectContaining({ response: expect.objectContaining({ code: ErrorCode.AUTH_INVALID_STATE }) }),
      );
    });
  });

  describe('logout', () => {
    it('유효한 refresh token — 폐기 후 정상 반환', async () => {
      repo.revokeValidRefreshToken.mockResolvedValue({ userId: 'U001' });

      await expect(service.logout('valid-token')).resolves.toBeUndefined();
      expect(repo.revokeValidRefreshToken).toHaveBeenCalledTimes(1);
    });

    it('이미 폐기된/없는 token — idempotent 처리 (예외 없음)', async () => {
      repo.revokeValidRefreshToken.mockResolvedValue(null);

      await expect(service.logout('already-revoked')).resolves.toBeUndefined();
    });
  });

  describe('refresh', () => {
    it('만료된 refresh token — TOKEN_EXPIRED(401)', async () => {
      repo.revokeValidRefreshToken.mockResolvedValue(null);
      repo.findRefreshTokenByHash.mockResolvedValue({ id: '1', userId: 'U001' });

      await expect(service.refresh('expired-token')).rejects.toThrow(UnauthorizedException);
      await expect(service.refresh('expired-token')).rejects.toMatchObject({
        response: expect.objectContaining({ code: ErrorCode.TOKEN_EXPIRED }),
      });
    });

    it('존재하지 않는 refresh token — TOKEN_INVALID(401)', async () => {
      repo.revokeValidRefreshToken.mockResolvedValue(null);
      repo.findRefreshTokenByHash.mockResolvedValue(null);

      await expect(service.refresh('unknown-token')).rejects.toThrow(UnauthorizedException);
      await expect(service.refresh('unknown-token')).rejects.toMatchObject({
        response: expect.objectContaining({ code: ErrorCode.TOKEN_INVALID }),
      });
    });

    it('유효한 refresh token — 새 토큰 쌍 반환', async () => {
      repo.revokeValidRefreshToken.mockResolvedValue({ userId: 'U001' });
      repo.findUserById.mockResolvedValue({ id: 'U001', role: 'USER' });
      repo.saveRefreshToken.mockResolvedValue(undefined);
      jwtService.signAsync.mockResolvedValue('new-access-token');
      jwtService.sign.mockReturnValue('new-access-token');

      const result = await service.refresh('valid-token');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('동일 refresh token 재사용 — 두 번째 호출 TOKEN_INVALID(401)', async () => {
      // 첫 번째: 성공 (revokeValidRefreshToken이 토큰 반환)
      repo.revokeValidRefreshToken
        .mockResolvedValueOnce({ userId: 'U001' })
        .mockResolvedValueOnce(null); // 두 번째: 이미 폐기됨
      repo.findRefreshTokenByHash.mockResolvedValue(null); // DB에도 없음 (폐기됨)
      repo.findUserById.mockResolvedValue({ id: 'U001', role: 'USER' });
      repo.saveRefreshToken.mockResolvedValue(undefined);
      jwtService.signAsync.mockResolvedValue('new-access-token');

      await service.refresh('reused-token');

      await expect(service.refresh('reused-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('socialLogin', () => {
    it('위조된 state — AUTH_INVALID_STATE(401)', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('invalid signature');
      });

      await expect(
        service.socialLogin({ provider: 'kakao' as any, platform: 'WEB' as any, code: 'code123', state: 'tampered-state' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('유효한 state — 소셜 로그인 진행', async () => {
      jwtService.verify.mockReturnValue({ nonce: 'abc' });
      const mockStrategy = {
        authenticate: jest.fn().mockResolvedValue({ providerAccountId: 'social123', email: 'test@test.com' }),
      };
      const factory = service['socialAuthFactory'] as any;
      factory.getStrategy = jest.fn().mockReturnValue(mockStrategy);
      repo.upsertSocialAccount.mockResolvedValue({ userId: 'U001' });
      repo.findUserById.mockResolvedValue({ id: 'U001', role: 'USER' });
      repo.saveRefreshToken.mockResolvedValue(undefined);
      jwtService.signAsync.mockResolvedValue('access-token');

      const result = await service.socialLogin({
        provider: 'kakao' as any,
        platform: 'WEB' as any,
        code: 'valid-code',
        state: 'valid-state',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
  });
});
