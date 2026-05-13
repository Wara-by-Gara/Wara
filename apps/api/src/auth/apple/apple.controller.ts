import { Controller, Post, Get, Body } from '@nestjs/common';
import { AppleService } from './apple.service';
import { AppleCallbackDto, AppleCallbackSchema } from './apple-callback.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller('auth')
export class AppleController {
  constructor(private readonly appleService: AppleService) {}

  // 클라이언트가 Apple 로그인 시작 전에 서버 서명 state를 받아가는 엔드포인트
  // 이 state를 Apple 인증 요청에 포함시키면 callback에서 CSRF 검증 가능
  @Get('apple/state')
  getState() {
    return { state: this.appleService.generateState() };
  }

  // Apple은 카카오/네이버와 달리 redirect 없이 바로 POST로 callback이 옴
  // Content-Type: application/x-www-form-urlencoded
  @Post('apple/callback')
  async appleCallback(
    @Body(new ZodValidationPipe(AppleCallbackSchema)) dto: AppleCallbackDto,
  ) {
    return this.appleService.login(dto);
  }
}
