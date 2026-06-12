import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { z } from 'zod';
import { Public } from '../common/decorators/public.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { DevAuthService } from './dev-auth.service';

const DevTokenSchema = z.object({
  email: z.string().email(),
});
type DevTokenDto = z.infer<typeof DevTokenSchema>;

@Controller('auth/dev')
export class DevAuthController {
  constructor(
    private readonly devAuthService: DevAuthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Post('token')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  issueDevToken(
    @Body(new ZodValidationPipe(DevTokenSchema)) body: DevTokenDto,
  ) {
    return this.devAuthService.issueDevToken(body.email);
  }

  // 브라우저 dev 로그인: 쿠키 세팅 후 프론트로 리다이렉트 (dev 전용, prod 미등록)
  @Public()
  @Get('login')
  @Throttle({ default: { ttl: 60000, limit: 60 } })
  async devLogin(@Query('email') email: string, @Res() res: Response) {
    const { accessToken, refreshToken } =
      await this.devAuthService.issueDevSession(email);
    const isProd = this.config.get('NODE_ENV') === 'production';
    const frontendUrl = this.config.getOrThrow<string>('FRONTEND_URL');
    const base = {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax' as const,
      path: '/',
    };
    res.cookie('accessToken', accessToken, { ...base, maxAge: 30 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, {
      ...base,
      maxAge: 14 * 24 * 60 * 60 * 1000,
    });
    res.cookie('is_logged_in', '1', {
      httpOnly: false,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 14 * 24 * 60 * 60 * 1000,
    });
    return res.redirect(`${frontendUrl}/`);
  }
}
