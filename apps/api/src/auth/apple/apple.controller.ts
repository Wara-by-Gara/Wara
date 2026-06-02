import { Controller, Post, Get, Body, Query, Res, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { AppleService } from './apple.service';
import { AppleCallbackDto, AppleCallbackSchema, AppleWebCallbackDto, AppleWebCallbackSchema } from './apple-callback.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

const ACCESS_TOKEN_COOKIE = 'accessToken';
const REFRESH_TOKEN_COOKIE = 'refreshToken';
const IS_LOGGED_IN_COOKIE = 'is_logged_in';

@Controller('auth')
export class AppleController {
  private readonly logger = new Logger(AppleController.name);

  constructor(
    private readonly appleService: AppleService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Get('apple/state')
  getState() {
    return { state: this.appleService.generateState() };
  }

  @Public()
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Get('apple/url')
  getWebUrl() {
    const state = this.appleService.generateState();
    const url = this.appleService.getWebAuthorizationUrl(state);
    return { url, state };
  }

  // Apple은 redirect 없이 POST로 callback이 옴 (Content-Type: application/x-www-form-urlencoded)
  // platform=web: 쿠키 세팅 + 프론트엔드로 리다이렉트 (웹 브라우저 플로우)
  // platform=mobile (기본값): JSON 반환 (expo-apple-authentication 플로우)
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post('apple/callback')
  async appleCallback(
    @Query('platform') platform: string,
    @Body(new ZodValidationPipe(AppleCallbackSchema)) dto: AppleCallbackDto,
    @Res() res: Response,
  ): Promise<void> {
    const result = await this.appleService.login(dto);

    if (platform === 'web') {
      const isProd = this.configService.get('NODE_ENV') === 'production';
      const accessMaxAge = this.configService.get<number>('JWT_ACCESS_EXPIRES_IN', 1800) * 1000;
      const refreshMaxAge = this.configService.get<number>('JWT_REFRESH_EXPIRES_IN', 1209600) * 1000;
      const base = { httpOnly: true, secure: isProd, sameSite: 'lax' as const, path: '/' };

      res.cookie(ACCESS_TOKEN_COOKIE, result.accessToken, { ...base, maxAge: accessMaxAge });
      res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, { ...base, maxAge: refreshMaxAge });
      res.cookie(IS_LOGGED_IN_COOKIE, '1', { httpOnly: false, secure: isProd, sameSite: 'lax', path: '/', maxAge: refreshMaxAge });

      const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
      res.redirect(result.needsProfileCompletion ? `${frontendUrl}/signup` : `${frontendUrl}/?auth_success=1`);
      return;
    }

    res.status(200).json(result);
  }

  // 웹 OAuth용: Apple이 form_post로 서버에 직접 콜백 → 쿠키 세팅 → 프론트엔드로 리다이렉트
  // Apple 에러 응답(user_cancelled_authorize 등) 시 id_token 없이 error 필드만 올 수 있음
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post('apple/web-callback')
  async appleWebCallback(
    @Body(new ZodValidationPipe(AppleWebCallbackSchema)) dto: AppleWebCallbackDto,
    @Res() res: Response,
  ) {
    const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');

    if (dto.error || !dto.id_token || !dto.code) {
      return res.redirect(`${frontendUrl}/login?auth_error=1`);
    }

    try {
      const { accessToken, refreshToken, needsProfileCompletion } = await this.appleService.login(dto as AppleCallbackDto);
      const isProd = this.configService.get('NODE_ENV') === 'production';
      const accessMaxAge = this.configService.get<number>('JWT_ACCESS_EXPIRES_IN', 1800) * 1000;
      const refreshMaxAge = this.configService.get<number>('JWT_REFRESH_EXPIRES_IN', 1209600) * 1000;
      const base = { httpOnly: true, secure: isProd, sameSite: 'lax' as const, path: '/' };

      res.cookie(ACCESS_TOKEN_COOKIE, accessToken, { ...base, maxAge: accessMaxAge });
      res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, { ...base, maxAge: refreshMaxAge });
      res.cookie(IS_LOGGED_IN_COOKIE, '1', { httpOnly: false, secure: isProd, sameSite: 'lax', path: '/', maxAge: refreshMaxAge });

      if (needsProfileCompletion) {
        return res.redirect(`${frontendUrl}/signup`);
      }
      return res.redirect(`${frontendUrl}/?auth_success=1`);
    } catch (err) {
      this.logger.error('Apple web callback failed', err);
      return res.redirect(`${frontendUrl}/login?auth_error=1`);
    }
  }
}
