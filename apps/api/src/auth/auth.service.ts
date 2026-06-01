import { BadRequestException, Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes, randomUUID } from 'crypto';
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
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly repository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly socialAuthFactory: SocialAuthFactory,
    private readonly oauthPolicyService: OauthPolicyService,
  ) {}

  generateState(): string {
    return this.jwtService.sign(
      { nonce: randomUUID() },
      { secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'), expiresIn: '10m' },
    );
  }

  verifyState(state: string): void {
    try {
      this.jwtService.verify(state, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
    } catch {
      throw new UnauthorizedException({
        code: ErrorCode.AUTH_INVALID_STATE,
        message: '유효하지 않은 state입니다.',
      });
    }
  }

  getAuthorizationUrl(
    provider: Provider,
    platform: Platform,
  ): { url: string; state: string } {
    const strategy = this.socialAuthFactory.getStrategy(provider);
    const state = this.generateState();
    const url = strategy.getAuthorizationUrl(platform, state);
    return { url, state };
  }

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

    const expiresIn = this.config.get<number>('JWT_REFRESH_EXPIRES_IN', 1209600);
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    await this.repository.saveRefreshToken({
      userId,
      tokenHash,
      expiresAt,
      deviceInfo: options?.deviceInfo,
      ipAddress: options?.ipAddress,
    });

    return rawToken;
  }

  async refresh(
    rawRefreshToken: string,
    options?: { deviceInfo?: string; ipAddress?: string },
  ) {
    const tokenHash = this.hashToken(rawRefreshToken);

    // find + revoke를 단일 쿼리로 처리 → race condition 방지
    const stored = await this.repository.revokeValidRefreshToken(tokenHash);
    if (!stored) {
      this.logger.warn('Refresh token not found or invalid');
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

    const user = await this.repository.findUserById(stored.userId);

    if (!user) {
      this.logger.warn(`User not found: ${stored.userId}`);
      throw new UnauthorizedException({
        code: ErrorCode.TOKEN_INVALID,
        message: '유효하지 않은 refresh token입니다.',
      });
    }

    this.logger.debug(`Token refreshed for user: ${user.id}`);
    const payload: JwtPayload = {
      id: user.id,
      role: user.role as UserRole,
      scope: user.role === UserRole.ADMIN ? ['admin'] : [],
    };

    const refreshExpiresIn = this.config.get<number>('JWT_REFRESH_EXPIRES_IN', 1209600);
    const [accessToken, refreshToken] = await Promise.all([
      this.issueAccessToken(payload),
      this.issueRefreshToken(user.id, options),
    ]);
    return { accessToken, refreshToken, refreshExpiresIn };
  }

  async socialLogin(params: {
    provider: Provider;
    platform: Platform;
    code: string;
    state?: string;
  }) {
    if (params.state) {
      this.verifyState(params.state);
    }

    this.oauthPolicyService.validatePlatform(params.provider, params.platform);

    const strategy = this.socialAuthFactory.getStrategy(params.provider);

    const socialUser = await strategy.authenticate({
      code: params.code,
      state: params.state,
      platform: params.platform,
    });

    const { userId, isNew } = await this.repository.upsertSocialAccount({
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

    const needsProfileCompletion = !user.name || !user.email || !user.birthYear;
    return { accessToken, refreshToken, isNew, needsProfileCompletion };
  }

  async socialLoginWithProviderToken(params: {
    provider: Provider;
    providerToken: string;
  }) {
    this.oauthPolicyService.validatePlatform(params.provider, Platform.MOBILE);

    const strategy = this.socialAuthFactory.getStrategy(params.provider);
    if (!strategy.authenticateWithProviderToken) {
      throw new BadRequestException(`${params.provider} does not support token-based login`);
    }

    const socialUser = await strategy.authenticateWithProviderToken(params.providerToken);

    const { userId, isNew } = await this.repository.upsertSocialAccount({
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

    const needsProfileCompletion = !user.name || !user.email || !user.birthYear;
    return { accessToken, refreshToken, isNew, needsProfileCompletion };
  }

  async logout(rawRefreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(rawRefreshToken);

    // 이미 만료/무효화된 토큰 → idempotent: 로그아웃된 상태로 간주하고 성공 처리
    const revoked = await this.repository.revokeValidRefreshToken(tokenHash);
    if (!revoked) {
      this.logger.debug('Logout called with invalid or expired token (idempotent)');
      return;
    }

    this.logger.debug(`User logged out: ${revoked.userId}`);
  }
}
