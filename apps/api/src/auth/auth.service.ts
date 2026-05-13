import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash } from 'crypto';
import { AuthRepository } from './auth.repository';

@Injectable()
export class AuthService {
  constructor(private readonly repository: AuthRepository) {}

  /**
   * Refresh Token으로 새 Access Token 발급
   * Cookie에서 refreshToken을 읽어 검증한 후 새 Access Token 발급
   */
  async refreshToken(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not provided');
    }

    try {
      // raw token을 해시로 변환 (DB에는 tokenHash만 저장)
      const tokenHash = createHash('sha256').update(refreshToken).digest('hex');

      // TODO(숙희): 숙희 Token 서비스에서 Refresh Token 검증
      // const decoded = await this.tokenService.verifyRefreshToken(refreshToken);
      // const decoded = { userId: '...' };

      // DB의 Refresh Token 확인 (유효한 것만: revokedAt IS NULL + expiresAt > now)
      const storedToken = await this.repository.findValidByTokenHash(tokenHash);
      if (!storedToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // 사용 기록 업데이트
      await this.repository.updateLastUsedAt(tokenHash);

      // 임시: userId는 decoded에서 나올 것
      const userId = storedToken.userId;

      // TODO(숙희): 새 Access Token 발급
      // const newAccessToken = await this.tokenService.generateAccessToken(userId);
      const newAccessToken = 'TODO_new_access_token';

      return {
        accessToken: newAccessToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * 로그아웃: Refresh Token 무효화
   * Cookie의 Refresh Token을 DB에서 revoke (soft delete)
   */
  async logout(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not provided');
    }

    try {
      const tokenHash = createHash('sha256').update(refreshToken).digest('hex');

      // Refresh Token 무효화 (revokedAt 설정)
      await this.repository.revokeByTokenHash(tokenHash);

      return { message: 'Logged out successfully' };
    } catch (error) {
      throw new UnauthorizedException('Failed to logout');
    }
  }
}
