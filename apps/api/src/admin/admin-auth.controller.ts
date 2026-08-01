import { Controller, Get, Logger, Query, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { AuthService } from '../auth/auth.service';
import { Provider } from '../auth/enums/provider.enum';
import { Platform } from '../auth/enums/platform.enum';
import { UserRole } from '../common/enums/role.enum';

const ACCESS_TOKEN_COOKIE = 'accessToken';
const REFRESH_TOKEN_COOKIE = 'refreshToken';
const IS_LOGGED_IN_COOKIE = 'is_logged_in';

@Controller('admin/auth')
export class AdminAuthController {
  private readonly logger = new Logger(AdminAuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
    const isProd = this.configService.get('NODE_ENV') === 'production';
    const accessMaxAge = this.configService.get<number>('JWT_ACCESS_EXPIRES_IN', 1800) * 1000;
    const refreshMaxAge = this.configService.get<number>('JWT_REFRESH_EXPIRES_IN', 1209600) * 1000;
    const base = { httpOnly: true, secure: isProd, sameSite: 'lax' as const, path: '/' };

    res.cookie(ACCESS_TOKEN_COOKIE, accessToken, { ...base, maxAge: accessMaxAge });
    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, { ...base, maxAge: refreshMaxAge });
    res.cookie(IS_LOGGED_IN_COOKIE, '1', { httpOnly: false, secure: isProd, sameSite: 'lax', path: '/', maxAge: refreshMaxAge });
  }

  @Public()
  @Get('kakao/redirect')
  kakaoRedirect(@Res() res: Response) {
    const state = this.authService.generateState();
    const url = this.authService.getAdminKakaoAuthorizationUrl(state);
    return res.redirect(url);
  }

  @Public()
  @Get('kakao/callback')
  async kakaoCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    const adminFrontendUrl = this.configService.getOrThrow<string>('ADMIN_FRONTEND_URL');
    const adminRedirectUri = this.configService.getOrThrow<string>('KAKAO_ADMIN_REDIRECT_URI');

    if (error || !code) {
      return res.redirect(`${adminFrontendUrl}/login?auth_error=cancelled`);
    }

    try {
      const { accessToken, refreshToken } = await this.authService.socialLogin({
        provider: Provider.KAKAO,
        platform: Platform.WEB,
        code,
        state,
        redirectUri: adminRedirectUri,
      });

      const payload = this.jwtService.decode(accessToken) as { role?: string } | null;
      if (payload?.role !== UserRole.ADMIN) {
        return res.redirect(`${adminFrontendUrl}/login?auth_error=unauthorized`);
      }

      this.setAuthCookies(res, accessToken, refreshToken);
      return res.redirect(`${adminFrontendUrl}/dashboard`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error({ err, errMessage: message }, `Admin Kakao OAuth callback failed: ${message}`);
      return res.redirect(`${adminFrontendUrl}/login?auth_error=failed`);
    }
  }
}
