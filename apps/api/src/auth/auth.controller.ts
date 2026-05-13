import { Public } from './../common/decorators/public.decorator';
import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';

import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { RefreshTokenDto, RefreshTokenSchema } from './dto/refresh-token.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Refresh Token으로 새 Access Token + 새 Refresh Token 발급
   * POST /auth/refresh
   *
   * Body에서 refreshToken 읽기 → 검증 → 새 토큰들 발급 → 쿠키 설정
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body(new ZodValidationPipe(RefreshTokenSchema)) body: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.refresh(body.refreshToken);

    // 새 Refresh Token을 httpOnly 쿠키로 설정
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
    });

    // 응답에는 accessToken만 포함 (refreshToken은 쿠키로 관리)
    return { accessToken: result.accessToken };
  }

  /**
   * 로그아웃: Refresh Token 무효화
   * POST /auth/logout
   *
   * Cookie에서 refreshToken 읽기 → DB에서 revoke → Cookie 삭제
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
