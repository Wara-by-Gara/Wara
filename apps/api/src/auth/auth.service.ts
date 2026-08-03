import { BadRequestException, ConflictException, Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { AuthRepository } from './auth.repository';
import { AuthRedisStore } from './auth.redis-store';
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
    private readonly refreshStore: AuthRedisStore,
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

  // verify 없이 payload만 디코딩해 link 모드 여부만 판별. 위조 가능성은 후속 verifyLinkState/verifyState에서 차단.
  isLinkState(state: string): boolean {
    try {
      const decoded = this.jwtService.decode(state) as { link?: boolean } | null;
      return decoded?.link === true;
    } catch {
      return false;
    }
  }

  private generateLinkState(userId: string): string {
    return this.jwtService.sign(
      { nonce: randomUUID(), userId, link: true },
      { secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'), expiresIn: '10m' },
    );
  }

  private verifyLinkState(state: string): { userId: string } {
    try {
      const payload = this.jwtService.verify(state, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      }) as { link?: boolean; userId?: string };
      if (payload.link !== true || !payload.userId) {
        throw new Error();
      }
      return { userId: payload.userId };
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

  getAdminKakaoAuthorizationUrl(state: string): string {
    const clientId = this.config.getOrThrow<string>('KAKAO_CLIENT_ID');
    const redirectUri = this.config.getOrThrow<string>('KAKAO_ADMIN_REDIRECT_URI');
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'profile_nickname,profile_image,account_email',
      state,
    });
    return `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
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

    await this.refreshStore.save({
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
    const stored = await this.refreshStore.revokeIfValid(tokenHash);
    if (!stored) {
      this.logger.warn('Refresh token not found or invalid');
      const found = await this.refreshStore.findByHash(tokenHash);

      if (found) {
        if (found.revokedAt) {
          // 이미 revoke된 토큰을 다시 사용 → 도난 의심. 해당 user의 모든 활성 세션 즉시 무효화.
          this.logger.warn(
            `Suspicious refresh token reuse detected for user ${found.userId}`,
          );
          await this.refreshStore.revokeAllByUserId(found.userId);
          throw new UnauthorizedException({
            code: ErrorCode.SUSPICIOUS_REFRESH,
            message:
              '의심스러운 토큰 사용이 감지됐어요. 다시 로그인해주세요.',
          });
        }
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

    // 어드민 제재 유저는 토큰 재발급 차단 + 전체 세션 무효화.
    if (user.suspendedAt) {
      this.logger.warn(`Suspended user refresh blocked: ${user.id}`);
      await this.refreshStore.revokeAllByUserId(user.id);
      throw new UnauthorizedException({
        code: ErrorCode.AUTH_ACCOUNT_SUSPENDED,
        message: '정지된 계정입니다.',
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
    redirectUri?: string;
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
      redirectUri: params.redirectUri,
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

  getLinkAuthorizationUrl(
    provider: Provider,
    userId: string,
  ): { url: string; state: string } {
    const strategy = this.socialAuthFactory.getStrategy(provider);
    const state = this.generateLinkState(userId);
    const url = strategy.getAuthorizationUrl(Platform.WEB, state);
    return { url, state };
  }

  async linkSocialAccountWithCode(params: {
    provider: Provider;
    code: string;
    state: string;
  }): Promise<{ userId: string; provider: Provider }> {
    const { userId } = this.verifyLinkState(params.state);
    const strategy = this.socialAuthFactory.getStrategy(params.provider);
    const socialUser = await strategy.authenticate({
      code: params.code,
      state: params.state,
      platform: Platform.WEB,
    });
    await this.linkSocialAccountInternal({
      userId,
      provider: params.provider,
      providerAccountId: socialUser.providerAccountId,
    });
    return { userId, provider: params.provider };
  }

  async linkSocialAccountWithProviderToken(params: {
    userId: string;
    provider: Provider;
    providerToken: string;
  }): Promise<{ provider: Provider }> {
    const strategy = this.socialAuthFactory.getStrategy(params.provider);
    if (!strategy.authenticateWithProviderToken) {
      throw new BadRequestException(
        `${params.provider} does not support token-based login`,
      );
    }
    const socialUser = await strategy.authenticateWithProviderToken(
      params.providerToken,
    );
    await this.linkSocialAccountInternal({
      userId: params.userId,
      provider: params.provider,
      providerAccountId: socialUser.providerAccountId,
    });
    return { provider: params.provider };
  }

  // 다른 user에 이미 연결된 소셜이면 409. 동일 user에 이미 같은 소셜이면 idempotent.
  private async linkSocialAccountInternal(params: {
    userId: string;
    provider: Provider;
    providerAccountId: string;
  }): Promise<void> {
    const existing = await this.repository.findSocialAccountByProviderAccountId(
      params.provider,
      params.providerAccountId,
    );
    if (existing) {
      if (existing.userId !== params.userId) {
        // 두 user가 같은 사람일 경우 후속 merge 흐름으로 연결할 수 있도록 mergeToken을 함께 전달.
        const mergeToken = this.generateMergeToken(existing.userId, params.userId);
        throw new ConflictException({
          code: ErrorCode.SOCIAL_ALREADY_LINKED,
          message: '이 소셜 계정은 다른 사용자에게 연결되어 있습니다.',
          mergeToken,
        });
      }
      return;
    }
    await this.repository.linkSocialAccount({
      userId: params.userId,
      provider: params.provider,
      providerAccountId: params.providerAccountId,
    });
  }

  private generateMergeToken(sourceUserId: string, targetUserId: string): string {
    return this.jwtService.sign(
      { nonce: randomUUID(), sourceUserId, targetUserId, merge: true },
      { secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'), expiresIn: '10m' },
    );
  }

  private verifyMergeToken(token: string): { sourceUserId: string; targetUserId: string } {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      }) as { merge?: boolean; sourceUserId?: string; targetUserId?: string };
      if (
        payload.merge !== true ||
        !payload.sourceUserId ||
        !payload.targetUserId
      ) {
        throw new Error();
      }
      return {
        sourceUserId: payload.sourceUserId,
        targetUserId: payload.targetUserId,
      };
    } catch {
      throw new UnauthorizedException({
        code: ErrorCode.MERGE_TOKEN_INVALID,
        message: '유효하지 않은 merge token입니다.',
      });
    }
  }

  async mergeAccounts(currentUserId: string, mergeToken: string): Promise<{ mergedUserId: string }> {
    const { sourceUserId, targetUserId } = this.verifyMergeToken(mergeToken);
    // 현재 로그인된 user가 target과 일치해야 함 (mergeToken만 알면 임의 user merge 불가)
    if (targetUserId !== currentUserId) {
      throw new UnauthorizedException({
        code: ErrorCode.MERGE_TOKEN_INVALID,
        message: '유효하지 않은 merge token입니다.',
      });
    }
    await this.repository.mergeUserData(sourceUserId, targetUserId);
    // mergeUserData는 DB 트랜잭션만 처리 → Redis의 source user 활성 세션도 revoke
    await this.refreshStore.revokeAllByUserId(sourceUserId);
    return { mergedUserId: targetUserId };
  }

  async logout(rawRefreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(rawRefreshToken);

    // 이미 만료/무효화된 토큰 → idempotent: 로그아웃된 상태로 간주하고 성공 처리
    const revoked = await this.refreshStore.revokeIfValid(tokenHash);
    if (!revoked) {
      this.logger.debug('Logout called with invalid or expired token (idempotent)');
      return;
    }

    this.logger.debug(`User logged out: ${revoked.userId}`);
  }
}
