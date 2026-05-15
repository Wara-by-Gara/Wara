import { Public } from './../common/decorators/public.decorator';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { RefreshTokenDto, RefreshTokenSchema } from './dto/refresh-token.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refreshTokens(@Body(new ZodValidationPipe(RefreshTokenSchema)) body: RefreshTokenDto) {
    return this.authService.refresh(body.refreshToken);
  }
}