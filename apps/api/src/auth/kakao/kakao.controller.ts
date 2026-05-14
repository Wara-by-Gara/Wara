import { Controller, Post, Get, Query, Body, Res, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { KakaoService } from './kakao.service';
import { KakaoLoginSchema, KakaoLoginDto } from './kakao-login.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Public } from '../../common/decorators/public.decorator';

@Controller('auth/kakao')
export class KakaoController {
  constructor(
    private readonly kakaoService: KakaoService,
    private readonly config: ConfigService,
  ) {}

  /**
   * iOS SDK / 웹 JS SDK 방식
   * Kakao SDK로 발급받은 accessToken을 전달하면 JWT를 발급
   *
   * POST /auth/kakao/login
   * Body: { accessToken: string }
   */
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post('login')
  login(@Body(new ZodValidationPipe(KakaoLoginSchema)) dto: KakaoLoginDto) {
    return this.kakaoService.loginWithToken(dto);
  }

  /**
   * 웹 서버사이드 OAuth — Step 1
   * 브라우저를 카카오 로그인 페이지로 바로 리다이렉트
   *
   * GET /auth/kakao
   */
  @Public()
  @Get()
  redirect(@Res() res: Response) {
    return res.redirect(302, this.kakaoService.getAuthorizationUrl());
  }

  /**
   * 웹 서버사이드 OAuth — Step 2
   * 카카오 인증 완료 후 리다이렉트되는 callback 엔드포인트
   * 토큰 발급 후 프론트엔드로 리다이렉트
   *
   * GET /auth/kakao/callback?code=xxx&state=xxx
   */
  @Public()
  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('error') error: string | undefined,
    @Res() res: Response,
  ) {
    if (error) {
      throw new BadRequestException(`카카오 인증 실패: ${error}`);
    }
    if (!code) {
      throw new BadRequestException('code 파라미터가 필요합니다.');
    }

    const { accessToken, refreshToken } = await this.kakaoService.loginWithCode(code);
    const frontendUrl = this.config.getOrThrow<string>('FRONTEND_URL');
    const redirectUrl = `${frontendUrl}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`;

    return res.redirect(302, redirectUrl);
  }
}
