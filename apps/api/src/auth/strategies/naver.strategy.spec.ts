import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';
import { NaverStrategy } from './naver.strategy';
import { Platform } from '../enums/platform.enum';
import { Provider } from '../enums/provider.enum';

const mockHttp = {
  post: jest.fn(),
  get: jest.fn(),
};

const mockConfig = {
  getOrThrow: jest.fn((key: string): string => {
    const map: Record<string, string> = {
      NAVER_CLIENT_ID: 'test-client-id',
      NAVER_CLIENT_SECRET: 'test-client-secret',
      NAVER_CALLBACK_URL: 'http://localhost:3001/api/v1/auth/naver/callback',
    };
    if (!(key in map)) throw new Error(`Unknown key: ${key}`);
    return map[key]!;
  }),
};

describe('NaverStrategy', () => {
  let strategy: NaverStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NaverStrategy,
        { provide: HttpService, useValue: mockHttp },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    strategy = module.get(NaverStrategy);
    jest.clearAllMocks();
    mockConfig.getOrThrow.mockImplementation((key: string): string => {
      const map: Record<string, string> = {
        NAVER_CLIENT_ID: 'test-client-id',
        NAVER_CLIENT_SECRET: 'test-client-secret',
        NAVER_CALLBACK_URL: 'http://localhost:3001/api/v1/auth/naver/callback',
      };
      if (!(key in map)) throw new Error(`Unknown key: ${key}`);
      return map[key]!;
    });
  });

  it('provider = NAVER', () => {
    expect(strategy.provider).toBe(Provider.NAVER);
  });

  describe('getAuthorizationUrl', () => {
    it('네이버 OAuth URL에 client_id, redirect_uri, state 포함', () => {
      const url = strategy.getAuthorizationUrl(Platform.WEB, 'test-state');

      expect(url).toContain('https://nid.naver.com/oauth2.0/authorize');
      expect(url).toContain('client_id=test-client-id');
      expect(url).toContain('state=test-state');
      expect(url).toContain(encodeURIComponent('http://localhost:3001/api/v1/auth/naver/callback'));
    });
  });

  describe('authenticate', () => {
    const tokenResponse = { data: { access_token: 'naver-access-token' } };
    const baseUser = {
      id: 'naver-uid',
      name: '홍길동',
      email: 'test@naver.com',
      profile_image: 'https://img.naver.com/photo.jpg',
      birthyear: '1995',
    };

    beforeEach(() => {
      mockHttp.post.mockReturnValue(of(tokenResponse));
    });

    it('성공 시 SocialUser 반환', async () => {
      mockHttp.get.mockReturnValue(of({ data: { response: { ...baseUser, gender: null } } }));

      const user = await strategy.authenticate({ code: 'auth-code', state: 'st', platform: Platform.WEB });

      expect(user.provider).toBe(Provider.NAVER);
      expect(user.providerAccountId).toBe('naver-uid');
      expect(user.name).toBe('홍길동');
      expect(user.email).toBe('test@naver.com');
    });

    it('gender M → male', async () => {
      mockHttp.get.mockReturnValue(of({ data: { response: { ...baseUser, gender: 'M' } } }));

      const user = await strategy.authenticate({ code: 'code', state: 'st', platform: Platform.WEB });

      expect(user.gender).toBe('male');
    });

    it('gender F → female', async () => {
      mockHttp.get.mockReturnValue(of({ data: { response: { ...baseUser, gender: 'F' } } }));

      const user = await strategy.authenticate({ code: 'code', state: 'st', platform: Platform.WEB });

      expect(user.gender).toBe('female');
    });

    it('gender 없음 → undefined', async () => {
      mockHttp.get.mockReturnValue(of({ data: { response: { ...baseUser, gender: null } } }));

      const user = await strategy.authenticate({ code: 'code', state: 'st', platform: Platform.WEB });

      expect(user.gender).toBeUndefined();
    });

    it('토큰 엔드포인트 요청 시 code, client_id, client_secret 포함', async () => {
      mockHttp.get.mockReturnValue(of({ data: { response: { ...baseUser, gender: null } } }));

      await strategy.authenticate({ code: 'auth-code', state: 'st', platform: Platform.WEB });

      expect(mockHttp.post).toHaveBeenCalledWith(
        'https://nid.naver.com/oauth2.0/token',
        null,
        expect.objectContaining({
          params: expect.objectContaining({
            code: 'auth-code',
            client_id: 'test-client-id',
            client_secret: 'test-client-secret',
          }),
        }),
      );
    });

    it('유저 정보 요청 시 Bearer 토큰 사용', async () => {
      mockHttp.get.mockReturnValue(of({ data: { response: { ...baseUser, gender: null } } }));

      await strategy.authenticate({ code: 'code', state: 'st', platform: Platform.WEB });

      expect(mockHttp.get).toHaveBeenCalledWith(
        'https://openapi.naver.com/v1/nid/me',
        expect.objectContaining({
          headers: { Authorization: 'Bearer naver-access-token' },
        }),
      );
    });
  });
});
