import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Provider } from './enums/provider.enum';
import { Platform } from './enums/platform.enum';
import { ErrorCode } from '../common/constants/error-codes';

const mockService = {
  getAuthorizationUrl: jest.fn(),
  socialLogin: jest.fn(),
  refresh: jest.fn(),
  logout: jest.fn(),
  isLinkState: jest.fn().mockReturnValue(false),
};

const mockConfig = {
  getOrThrow: jest.fn().mockReturnValue('http://localhost:3000'),
  get: jest.fn().mockImplementation((key: string, fallback?: unknown) => {
    if (key === 'NODE_ENV') return 'test';
    if (key === 'JWT_ACCESS_EXPIRES_IN') return 1800;
    if (key === 'JWT_REFRESH_EXPIRES_IN') return 1209600;
    return fallback;
  }),
};

const mockRes = {
  redirect: jest.fn(),
  cookie: jest.fn(),
  clearCookie: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockService },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    controller = module.get(AuthController);
    jest.clearAllMocks();
    mockConfig.getOrThrow.mockReturnValue('http://localhost:3000');
  });

  describe('getAuthUrl', () => {
    it('service.getAuthorizationUrl 결과 반환', () => {
      mockService.getAuthorizationUrl.mockReturnValue({ url: 'https://nid.naver.com/...', state: 'st' });

      const result = controller.getAuthUrl({ provider: Provider.NAVER }, Platform.WEB);

      expect(result).toEqual({ url: 'https://nid.naver.com/...', state: 'st' });
      expect(mockService.getAuthorizationUrl).toHaveBeenCalledWith(Provider.NAVER, Platform.WEB);
    });
  });

  describe('oauthRedirect', () => {
    it('OAuth URL로 redirect', () => {
      mockService.getAuthorizationUrl.mockReturnValue({ url: 'https://nid.naver.com/...', state: 'st' });

      controller.oauthRedirect({ provider: Provider.NAVER }, mockRes as unknown as Response);

      expect(mockRes.redirect).toHaveBeenCalledWith('https://nid.naver.com/...');
    });
  });

  describe('oauthCallback (GET)', () => {
    it('error 파라미터 있으면 → 에러 URL로 redirect', async () => {
      await controller.oauthCallback(
        { provider: Provider.NAVER },
        '',
        '',
        'access_denied',
        mockRes as unknown as Response,
      );

      expect(mockRes.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/login?auth_error=cancelled',
      );
    });

    it('code 없으면 → 에러 URL로 redirect', async () => {
      await controller.oauthCallback(
        { provider: Provider.NAVER },
        '',
        'state',
        '',
        mockRes as unknown as Response,
      );

      expect(mockRes.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/login?auth_error=cancelled',
      );
    });

    it('성공 (프로필 완성) → 쿠키 설정 후 홈(/)으로 redirect', async () => {
      mockService.socialLogin.mockResolvedValue({
        accessToken: 'acc',
        refreshToken: 'ref',
        isNew: false,
        needsProfileCompletion: false,
      });

      await controller.oauthCallback(
        { provider: Provider.NAVER },
        'code123',
        'state123',
        '',
        mockRes as unknown as Response,
      );

      expect(mockRes.cookie).toHaveBeenCalledWith('accessToken', 'acc', expect.any(Object));
      expect(mockRes.cookie).toHaveBeenCalledWith('refreshToken', 'ref', expect.any(Object));
      expect(mockRes.redirect).toHaveBeenCalledWith('http://localhost:3000/?auth_success=1');
    });

    it('성공 (프로필 미완성) → 쿠키 설정 후 /signup으로 redirect', async () => {
      mockService.socialLogin.mockResolvedValue({
        accessToken: 'acc',
        refreshToken: 'ref',
        isNew: true,
        needsProfileCompletion: true,
      });

      await controller.oauthCallback(
        { provider: Provider.NAVER },
        'code123',
        'state123',
        '',
        mockRes as unknown as Response,
      );

      expect(mockRes.cookie).toHaveBeenCalledWith('accessToken', 'acc', expect.any(Object));
      expect(mockRes.cookie).toHaveBeenCalledWith('refreshToken', 'ref', expect.any(Object));
      expect(mockRes.redirect).toHaveBeenCalledWith('http://localhost:3000/signup');
    });

    it('service 에러 → /login?auth_error=1 로 redirect', async () => {
      mockService.socialLogin.mockRejectedValue(new Error('auth failed'));

      await controller.oauthCallback(
        { provider: Provider.NAVER },
        'code123',
        'bad-state',
        '',
        mockRes as unknown as Response,
      );

      expect(mockRes.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/login?auth_error=failed',
      );
    });
  });

  describe('socialCallback (POST)', () => {
    it('body.error 있으면 → UnauthorizedException(AUTH_INVALID_TOKEN)', () => {
      let thrown: unknown;
      try {
        controller.socialCallback(
          { provider: Provider.KAKAO },
          Platform.MOBILE,
          { code: '', error: 'access_denied', error_description: '사용자 취소' },
        );
      } catch (e) {
        thrown = e;
      }

      expect(thrown).toBeInstanceOf(UnauthorizedException);
      expect((thrown as UnauthorizedException).getResponse()).toMatchObject({
        code: ErrorCode.AUTH_INVALID_TOKEN,
      });
    });

    it('성공 → service.socialLogin 호출 후 결과 반환', () => {
      mockService.socialLogin.mockResolvedValue({ accessToken: 'acc', refreshToken: 'ref', isNew: false });

      const result = controller.socialCallback(
        { provider: Provider.KAKAO },
        Platform.MOBILE,
        { code: 'code123', state: 'st' },
      );

      expect(mockService.socialLogin).toHaveBeenCalledWith({
        provider: Provider.KAKAO,
        platform: Platform.MOBILE,
        code: 'code123',
        state: 'st',
      });
      expect(result).toBeDefined();
    });
  });

  describe('refreshTokens', () => {
    it('쿠키에서 refreshToken 읽어 service.refresh 호출', async () => {
      mockService.refresh.mockResolvedValue({ accessToken: 'new-acc', refreshToken: 'new-ref', refreshExpiresIn: 1209600 });
      const req = { cookies: { refreshToken: 'raw-token' } };

      const result = await controller.refreshTokens(
        req as unknown as import('express').Request,
        {},
        mockRes as unknown as Response,
      );

      expect(mockService.refresh).toHaveBeenCalledWith('raw-token');
      expect(mockRes.cookie).toHaveBeenCalledWith('accessToken', 'new-acc', expect.any(Object));
      expect(result).toEqual({ refreshExpiresIn: 1209600 });
    });
  });

  describe('logout', () => {
    it('쿠키에서 refreshToken 읽어 service.logout 호출 후 쿠키 클리어', async () => {
      mockService.logout.mockResolvedValue(undefined);
      const req = { cookies: { refreshToken: 'raw-token' } };

      await controller.logout(
        req as unknown as import('express').Request,
        {},
        mockRes as unknown as Response,
      );

      expect(mockService.logout).toHaveBeenCalledWith('raw-token');
      expect(mockRes.clearCookie).toHaveBeenCalledWith('accessToken', expect.any(Object));
      expect(mockRes.clearCookie).toHaveBeenCalledWith('refreshToken', expect.any(Object));
    });
  });
});