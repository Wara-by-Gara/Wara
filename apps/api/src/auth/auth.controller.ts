import { Controller, Post, Res, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';

/**
 * 인증 컨트롤러
 *
 * Cookie 옵션 (모든 엔드포인트):
 * - httpOnly: true (XSS 방어)
 * - secure: true (HTTPS만, 프로덕션)
 * - sameSite: 'strict' (CSRF 방어)
 * - maxAge: 7일
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Refresh Token으로 새 Access Token 발급
   * POST /auth/refresh
   *
   * Cookie에서 refreshToken 읽기 → 검증 → 새 accessToken 발급 → 응답 body에 포함
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['refreshToken'];
    const result = await this.authService.refreshToken(refreshToken);

    // 새 Refresh Token도 발급하는 경우 (선택사항)
    // res.cookie('refreshToken', newRefreshToken, { ... });

    return result;
  }

  /**
   * 로그아웃: Refresh Token 무효화
   * POST /auth/logout
   *
   * Cookie에서 refreshToken 읽기 → DB에서 삭제 → Cookie 삭제
   */
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['refreshToken'];
    await this.authService.logout(refreshToken);

    // Cookie 삭제
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    // 204: 빈 응답 (ResponseFormatInterceptor는 실행되지 않음)
  }
}
