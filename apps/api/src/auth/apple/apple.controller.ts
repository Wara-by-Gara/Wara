import { Controller, Post, Get, Body, Query, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { AppleService } from './apple.service';
import { AppleCallbackDto, AppleCallbackSchema } from './apple-callback.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

const ACCESS_TOKEN_COOKIE = 'accessToken';
const REFRESH_TOKEN_COOKIE = 'refreshToken';
const IS_LOGGED_IN_COOKIE = 'is_logged_in';

@Controller('auth')
export class AppleController {
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
}
