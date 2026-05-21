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
};

const mockConfig = {
  getOrThrow: jest.fn().mockReturnValue('http://localhost:3000'),
};

const mockRes = {
  redirect: jest.fn(),
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
        'http://localhost:3000/invitations/create?auth_error=1',
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
        'http://localhost:3000/invitations/create?auth_error=1',
      );
    });

    it('성공 → access_token, refresh_token 포함 URL로 redirect', async () => {
      mockService.socialLogin.mockResolvedValue({
        accessToken: 'acc',
        refreshToken: 'ref',
        isNew: false,
      });

      await controller.oauthCallback(
        { provider: Provider.NAVER },
        'code123',
        'state123',
        '',
        mockRes as unknown as Response,
      );

      expect(mockRes.redirect).toHaveBeenCalledWith(
        expect.stringContaining('access_token=acc'),
      );
      expect(mockRes.redirect).toHaveBeenCalledWith(
        expect.stringContaining('refresh_token=ref'),
      );
    });

    it('service 에러 → 에러 URL로 redirect', async () => {
      mockService.socialLogin.mockRejectedValue(new Error('auth failed'));

      await controller.oauthCallback(
        { provider: Provider.NAVER },
        'code123',
        'bad-state',
        '',
        mockRes as unknown as Response,
      );

      expect(mockRes.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/invitations/create?auth_error=1',
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
    it('service.refresh 결과 반환', async () => {
      mockService.refresh.mockResolvedValue({ accessToken: 'new-acc', refreshToken: 'new-ref' });

      const result = await controller.refreshTokens({ refreshToken: 'raw-token' });

      expect(result).toEqual({ accessToken: 'new-acc', refreshToken: 'new-ref' });
      expect(mockService.refresh).toHaveBeenCalledWith('raw-token');
    });
  });

  describe('logout', () => {
    it('service.logout 호출', async () => {
      mockService.logout.mockResolvedValue(undefined);

      await controller.logout({ refreshToken: 'raw-token' });

      expect(mockService.logout).toHaveBeenCalledWith('raw-token');
    });
  });
});
