import { Public } from './../common/decorators/public.decorator';
import { Controller, HttpCode, HttpStatus, Logger, Post, Req, Res } from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  /**
   * Refresh Token으로 새 Access Token + 새 Refresh Token 발급
   * POST /auth/refresh
   *
   * Cookie의 refreshToken 읽기 → Token Rotation → 새 토큰 쿠키 설정 → accessToken 응답
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // signedCookies: 서명 유효 시 string, 변조 시 false, 미존재 시 undefined
    const rawRefreshToken = req.signedCookies['refreshToken'] || '';
    const result = await this.authService.refresh(rawRefreshToken, {
      ipAddress: req.ip,
      deviceInfo: req.headers['user-agent'] as string | undefined,
    });

    // Defensive: service에서 반환한 토큰 검증
    if (!result?.refreshToken || typeof result.refreshToken !== 'string') {
      throw new Error('Invalid token response from auth service');
    }

    // 새 Refresh Token을 httpOnly 서명 쿠키로 설정
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      signed: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 1209600 * 1000, // 14일 (JWT_REFRESH_EXPIRES_IN과 일치)
    });

    // 응답에는 accessToken만 포함 (refreshToken은 쿠키로 관리)
    return { accessToken: result.accessToken };
  }

  /**
   * 로그아웃: Refresh Token 무효화
   * POST /auth/logout
   *
   * Cookie의 refreshToken을 DB에서 revoke (soft delete) → 쿠키 삭제
   */
  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawRefreshToken = req.signedCookies['refreshToken'] || '';

    // 쿠키가 있으면 토큰 무효화 (실패 시에도 계속 진행해서 쿠키는 삭제)
    if (rawRefreshToken) {
      try {
        await this.authService.logout(rawRefreshToken);
      } catch (err) {
        // 서비스에서 토큰 무효화 실패해도, 쿠키는 반드시 삭제 (idempotent)
        this.logger.warn(`Logout service error (cookie will still be cleared): ${err instanceof Error ? err.message : err}`);
      }
    }

    // 쿠키 삭제 (있든 없든 실행 → idempotent)
    res.clearCookie('refreshToken', {
      httpOnly: true,
      signed: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    // 204: 빈 응답 (ResponseFormatInterceptor는 실행되지 않음)
  }
}
