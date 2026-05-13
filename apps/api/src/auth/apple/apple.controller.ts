import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { AppleCallbackDto, AppleCallbackSchema } from './apple-callback.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller('auth')
export class AppleController {
  constructor(private readonly authService: AuthService) {}

  // Apple은 카카오/네이버와 달리 redirect 없이 바로 POST로 callback이 옴
  // Content-Type: application/x-www-form-urlencoded
  @Post('apple/callback')
  async appleCallback(
    @Body(new ZodValidationPipe(AppleCallbackSchema)) dto: AppleCallbackDto,
  ) {
    // TODO: 하림님(Repository) + 숙희님(JWT) 작업 머지 후 연결
    // return this.authService.appleLogin(dto);
  }
}
