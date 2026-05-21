import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { SocialAuthFactory } from './social-auth.factory';
import { OauthPolicyService } from './oauth-policy.service';
import { Provider } from './enums/provider.enum';
import { Platform } from './enums/platform.enum';
import { ErrorCode } from '../common/constants/error-codes';

const mockRepo = {
  upsertSocialAccount: jest.fn(),
  findUserById: jest.fn(),
  saveRefreshToken: jest.fn(),
  revokeValidRefreshToken: jest.fn(),
  findRefreshTokenByHash: jest.fn(),
};

const mockJwt = {
  sign: jest.fn(),
  signAsync: jest.fn(),
  verify: jest.fn(),
};

const mockConfig = {
  getOrThrow: jest.fn((key: string) => {
    if (key === 'JWT_ACCESS_SECRET') return 'test-secret';
    throw new Error(`Unknown key: ${key}`);
  }),
  get: jest.fn((key: string, defaultValue?: unknown) => {
    if (key === 'JWT_REFRESH_EXPIRES_IN') return defaultValue ?? 1209600;
    return defaultValue;
  }),
};

const mockStrategy = {
  authenticate: jest.fn(),
  getAuthorizationUrl: jest.fn(),
};

const mockFactory = {
  getStrategy: jest.fn().mockReturnValue(mockStrategy),
};

const mockPolicy = {
  validatePlatform: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthRepository, useValue: mockRepo },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
        { provide: SocialAuthFactory, useValue: mockFactory },
        { provide: OauthPolicyService, useValue: mockPolicy },
      ],
    }).compile();

    service = module.get(AuthService);
    jest.clearAllMocks();

    mockConfig.getOrThrow.mockImplementation((key: string) => {
      if (key === 'JWT_ACCESS_SECRET') return 'test-secret';
      throw new Error(`Unknown key: ${key}`);
    });
    mockConfig.get.mockImplementation((key: string, defaultValue?: unknown) => {
      if (key === 'JWT_REFRESH_EXPIRES_IN') return 1209600;
      return defaultValue;
    });
  });

  describe('verifyState', () => {
    it('유효한 state → 정상 통과', () => {
      mockJwt.verify.mockReturnValue({ nonce: 'abc' });

      expect(() => service.verifyState('valid-token')).not.toThrow();
    });

    it('유효하지 않은 state → UnauthorizedException(AUTH_INVALID_STATE)', () => {
      mockJwt.verify.mockImplementation(() => { throw new Error('invalid'); });

      let thrown: unknown;
      try { service.verifyState('bad-token'); } catch (e) { thrown = e; }

      expect(thrown).toBeInstanceOf(UnauthorizedException);
      expect((thrown as UnauthorizedException).getResponse()).toMatchObject({ code: ErrorCode.AUTH_INVALID_STATE });
    });
  });

  describe('getAuthorizationUrl', () => {
    it('strategy.getAuthorizationUrl 결과 + state 반환', () => {
      mockJwt.sign.mockReturnValue('state-token');
      mockStrategy.getAuthorizationUrl.mockReturnValue('https://nid.naver.com/...');
      mockFactory.getStrategy.mockReturnValue(mockStrategy);

      const result = service.getAuthorizationUrl(Provider.NAVER, Platform.WEB);

      expect(result).toEqual({ url: 'https://nid.naver.com/...', state: 'state-token' });
      expect(mockFactory.getStrategy).toHaveBeenCalledWith(Provider.NAVER);
    });
  });

  describe('socialLogin', () => {
    const socialUser = {
      provider: Provider.NAVER,
      providerAccountId: 'naver-uid',
      name: '홍길동',
      email: 'test@naver.com',
      profileImage: 'https://img.example.com/photo.jpg',
    };
    const dbUser = { id: 'user-ulid', role: 'USER' };

    beforeEach(() => {
      mockJwt.verify.mockReturnValue({ nonce: 'abc' });
      mockStrategy.authenticate.mockResolvedValue(socialUser);
      mockFactory.getStrategy.mockReturnValue(mockStrategy);
      mockRepo.upsertSocialAccount.mockResolvedValue({ userId: 'user-ulid', isNew: false });
      mockRepo.findUserById.mockResolvedValue(dbUser);
      mockRepo.saveRefreshToken.mockResolvedValue(undefined);
      mockJwt.signAsync.mockResolvedValue('access-token');
    });

    it('state 있으면 verifyState 호출', async () => {
      await service.socialLogin({ provider: Provider.NAVER, platform: Platform.WEB, code: 'code', state: 'st' });

      expect(mockJwt.verify).toHaveBeenCalledWith('st', expect.objectContaining({ secret: 'test-secret' }));
    });

    it('state 없으면 verifyState 미호출', async () => {
      await service.socialLogin({ provider: Provider.NAVER, platform: Platform.WEB, code: 'code' });

      expect(mockJwt.verify).not.toHaveBeenCalled();
    });

    it('플랫폼 정책 검증 호출', async () => {
      await service.socialLogin({ provider: Provider.NAVER, platform: Platform.WEB, code: 'code' });

      expect(mockPolicy.validatePlatform).toHaveBeenCalledWith(Provider.NAVER, Platform.WEB);
    });

    it('신규 유저 → isNew: true 반환', async () => {
      mockRepo.upsertSocialAccount.mockResolvedValue({ userId: 'user-ulid', isNew: true });

      const result = await service.socialLogin({ provider: Provider.NAVER, platform: Platform.WEB, code: 'code' });

      expect(result.isNew).toBe(true);
    });

    it('기존 유저 → isNew: false 반환', async () => {
      const result = await service.socialLogin({ provider: Provider.NAVER, platform: Platform.WEB, code: 'code' });

      expect(result.isNew).toBe(false);
      expect(result.accessToken).toBe('access-token');
    });

    it('DB에서 유저를 찾지 못하면 → UnauthorizedException(AUTH_USER_NOT_FOUND)', async () => {
      mockRepo.findUserById.mockResolvedValue(null);

      const err = await service
        .socialLogin({ provider: Provider.NAVER, platform: Platform.WEB, code: 'code' })
        .catch(e => e);

      expect(err).toBeInstanceOf(UnauthorizedException);
      expect((err as UnauthorizedException).getResponse()).toMatchObject({ code: ErrorCode.AUTH_USER_NOT_FOUND });
    });
  });

  describe('refresh', () => {
    const dbUser = { id: 'user-ulid', role: 'USER' };
    const storedToken = { userId: 'user-ulid', tokenHash: 'hash' };

    beforeEach(() => {
      mockJwt.signAsync.mockResolvedValue('new-access-token');
      mockRepo.saveRefreshToken.mockResolvedValue(undefined);
    });

    it('유효한 토큰 → 새 토큰 발급', async () => {
      mockRepo.revokeValidRefreshToken.mockResolvedValue(storedToken);
      mockRepo.findUserById.mockResolvedValue(dbUser);

      const result = await service.refresh('raw-token');

      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBeDefined();
    });

    it('만료된 토큰 (DB에 존재) → UnauthorizedException(TOKEN_EXPIRED)', async () => {
      mockRepo.revokeValidRefreshToken.mockResolvedValue(null);
      mockRepo.findRefreshTokenByHash.mockResolvedValue({ tokenHash: 'hash' });

      const err = await service.refresh('expired-token').catch(e => e);
      expect(err).toBeInstanceOf(UnauthorizedException);
      expect((err as UnauthorizedException).getResponse()).toMatchObject({ code: ErrorCode.TOKEN_EXPIRED });
    });

    it('존재하지 않는 토큰 → UnauthorizedException(TOKEN_INVALID)', async () => {
      mockRepo.revokeValidRefreshToken.mockResolvedValue(null);
      mockRepo.findRefreshTokenByHash.mockResolvedValue(null);

      const err = await service.refresh('unknown-token').catch(e => e);
      expect(err).toBeInstanceOf(UnauthorizedException);
      expect((err as UnauthorizedException).getResponse()).toMatchObject({ code: ErrorCode.TOKEN_INVALID });
    });

    it('토큰은 유효하지만 유저 없음 → UnauthorizedException(TOKEN_INVALID)', async () => {
      mockRepo.revokeValidRefreshToken.mockResolvedValue(storedToken);
      mockRepo.findUserById.mockResolvedValue(null);

      const err = await service.refresh('raw-token').catch(e => e);
      expect(err).toBeInstanceOf(UnauthorizedException);
      expect((err as UnauthorizedException).getResponse()).toMatchObject({ code: ErrorCode.TOKEN_INVALID });
    });
  });

  describe('logout', () => {
    it('유효한 토큰 → revokeValidRefreshToken 호출', async () => {
      mockRepo.revokeValidRefreshToken.mockResolvedValue({ userId: 'u1' });

      await service.logout('raw-token');

      expect(mockRepo.revokeValidRefreshToken).toHaveBeenCalledTimes(1);
    });

    it('이미 무효화된 토큰 → 에러 없이 idempotent 처리', async () => {
      mockRepo.revokeValidRefreshToken.mockResolvedValue(null);

      await expect(service.logout('invalid-token')).resolves.toBeUndefined();
    });
  });
});
