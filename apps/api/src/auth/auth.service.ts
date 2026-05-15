import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import { AuthRepository } from './auth.repository';
import { SocialAuthFactory } from './social-auth.factory';
import { OauthPolicyService } from './oauth-policy.service';
import { Provider } from './enums/provider.enum';
import { Platform } from './enums/platform.enum';
import { UserRole } from '../common/enums/role.enum';
import type { JwtPayload } from '../common/types/jwt-payload.type';
import { ErrorCode } from '../common/constants/error-codes';

@Injectable()
export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly socialAuthFactory: SocialAuthFactory,
    private readonly oauthPolicyService: OauthPolicyService,
  ) {}

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async issueAccessToken(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload);
  }

  async issueRefreshToken(
    userId: string,

    options?: {
      deviceInfo?: string;
      ipAddress?: string;
    },
  ): Promise<string> {
    const rawToken = randomBytes(40).toString('hex');
    const tokenHash = this.hashToken(rawToken);

    const refreshExpiresIn = this.config.get<number>(
      'JWT_REFRESH_EXPIRES_IN',
      1209600,
    );

    const expiresAt = new Date(Date.now() + refreshExpiresIn * 1000);

    await this.repository.saveRefreshToken({
      userId,
      tokenHash,
      expiresAt,
      deviceInfo: options?.deviceInfo,
      ipAddress: options?.ipAddress,
    });

    return rawToken;
  }

  async refresh(rawRefreshToken: string) {
    const tokenHash = this.hashToken(rawRefreshToken);
    const stored = await this.repository.findValidRefreshToken(tokenHash);

    if (!stored) {
      const expired = await this.repository.findRefreshTokenByHash(tokenHash);

      if (expired) {
        throw new UnauthorizedException({
          code: ErrorCode.TOKEN_EXPIRED,
          message: 'refresh token이 만료되었습니다.',
        });
      }

      throw new UnauthorizedException({
        code: ErrorCode.TOKEN_INVALID,
        message: '유효하지 않은 refresh token입니다.',
      });
    }

    await this.repository.revokeRefreshToken(stored.userId, tokenHash);

    const user = await this.repository.findUserById(stored.userId);

    if (!user) {
      throw new UnauthorizedException({
        code: ErrorCode.TOKEN_INVALID,
        message: '유효하지 않은 refresh token입니다.',
      });
    }

    const payload: JwtPayload = {
      id: user.id,
      role: user.role as UserRole,
      scope: user.role === UserRole.ADMIN ? ['admin'] : [],
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.issueAccessToken(payload),
      this.issueRefreshToken(user.id),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async socialLogin(params: {
    provider: Provider;
    platform: Platform;
    code: string;
    state?: string;
  }) {
    this.oauthPolicyService.validatePlatform(params.provider, params.platform);

    const strategy = this.socialAuthFactory.getStrategy(params.provider);

    const socialUser = await strategy.authenticate({
      code: params.code,
      state: params.state,
      platform: params.platform,
    });

    const { userId } = await this.repository.upsertSocialAccount({
      provider: params.provider,
      providerAccountId: socialUser.providerAccountId,
      email: socialUser.email,
      name: socialUser.name,
      profileImageUrl: socialUser.profileImage,
    });

    const user = await this.repository.findUserById(userId);

    if (!user) {
      throw new UnauthorizedException({
        code: ErrorCode.AUTH_USER_NOT_FOUND,
        message: '유저 정보를 찾을 수 없습니다.',
      });
    }

    const payload: JwtPayload = {
      id: user.id,
      role: user.role as UserRole,
      scope: user.role === UserRole.ADMIN ? ['admin'] : [],
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.issueAccessToken(payload),
      this.issueRefreshToken(user.id),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
