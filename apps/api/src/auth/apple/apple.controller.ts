import { Controller, Post, Get, Body, Res, Logger } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { AppleService } from './apple.service';
import { AppleCallbackDto, AppleCallbackSchema, AppleWebCallbackDto, AppleWebCallbackSchema } from './apple-callback.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

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

  // iOS SDK용: id_token 검증 후 토큰 JSON 반환
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post('apple/callback')
  async appleCallback(
    @Body(new ZodValidationPipe(AppleCallbackSchema)) dto: AppleCallbackDto,
  ) {
    return this.appleService.login(dto);
  }

  // 웹 OAuth용: Apple이 form_post로 콜백 → 쿠키 세팅 → 프론트엔드로 리다이렉트
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

      res.cookie('accessToken', accessToken, { ...base, maxAge: accessMaxAge });
      res.cookie('refreshToken', refreshToken, { ...base, maxAge: refreshMaxAge });
      res.cookie('is_logged_in', '1', { httpOnly: false, secure: isProd, sameSite: 'lax', path: '/', maxAge: refreshMaxAge });

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
