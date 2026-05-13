import { Injectable, UnauthorizedException } from '@nestjs/common';
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
      // TODO(숙희): 숙희 Token 서비스에서 Refresh Token 검증
      // const decoded = await this.tokenService.verifyRefreshToken(refreshToken);
      // const decoded = { userId: '...' };

      // TODO(하림): 하림 Repository에서 DB의 Refresh Token 확인
      // const storedToken = await this.repository.findByToken(refreshToken);
      // if (!storedToken) throw new UnauthorizedException('Invalid refresh token');

      // 임시: userId는 decoded에서 나올 것
      const userId = 'TODO_userId_from_decoded';

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
   * Cookie의 Refresh Token을 DB에서 삭제
   */
  async logout(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not provided');
    }

    try {
      // TODO(하림): 하림 Repository에서 Refresh Token 삭제 (단건 로그아웃)
      // await this.repository.deleteByToken(refreshToken);

      return { message: 'Logged out successfully' };
    } catch (error) {
      throw new UnauthorizedException('Failed to logout');
    }
  }
}
