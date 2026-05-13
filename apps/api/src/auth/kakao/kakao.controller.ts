import { Controller, Post, Get, Query, Body, BadRequestException } from '@nestjs/common';
import { KakaoService } from './kakao.service';
import { KakaoLoginSchema, KakaoLoginDto } from './kakao-login.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller('auth')
export class KakaoController {
  constructor(private readonly kakaoService: KakaoService) {}

  /**
   * iOS SDK / 웹 JS SDK 방식
   * Kakao SDK로 발급받은 accessToken을 전달하면 JWT를 발급
   *
   * POST /auth/kakao/login
   * Body: { accessToken: string }
   */
  @Post('kakao/login')
  login(@Body(new ZodValidationPipe(KakaoLoginSchema)) dto: KakaoLoginDto) {
    return this.kakaoService.loginWithToken(dto);
  }

  /**
   * 웹 서버사이드 OAuth — Step 1
   * 프론트엔드가 이 URL로 이동하면 카카오 로그인 페이지로 리다이렉트
   *
   * GET /auth/kakao
   * Response: { url: string }  (프론트에서 window.location.href = url 로 이동)
   */
  @Get('kakao')
  getAuthorizationUrl() {
    const url = this.kakaoService.getAuthorizationUrl();
    return { url };
  }

  /**
   * 웹 서버사이드 OAuth — Step 2
   * 카카오 인증 완료 후 리다이렉트되는 callback 엔드포인트
   * KAKAO_REDIRECT_URI와 정확히 일치해야 함
   *
   * GET /auth/kakao/callback?code=xxx&state=xxx
   */
  @Get('kakao/callback')
  callback(
    @Query('code') code: string,
    @Query('error') error?: string,
  ) {
    if (error) {
      throw new BadRequestException(`카카오 인증 실패: ${error}`);
    }
    if (!code) {
      throw new BadRequestException('code 파라미터가 필요합니다.');
    }

    return this.kakaoService.loginWithCode(code);
  }
}
