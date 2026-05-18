import { Public } from './../common/decorators/public.decorator';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { RefreshTokenDto, RefreshTokenSchema } from './dto/refresh-token.dto';
import { ProviderParamDto, ProviderParamSchema } from './dto/provider.param.dto';
import { SocialCallbackDto, SocialCallbackSchema } from './dto/social-callback.dto';
import { Platform } from './enums/platform.enum';
import { ErrorCode } from '../common/constants/error-codes';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Get(':provider/url')
  getAuthUrl(
    @Param(new ZodValidationPipe(ProviderParamSchema)) { provider }: ProviderParamDto,
    @Query('platform') platform: Platform,
  ) {
    return this.authService.getAuthorizationUrl(provider, platform);
  }

  @Public()
  @Post(':provider/callback')
  @HttpCode(HttpStatus.OK)
  socialCallback(
    @Param(new ZodValidationPipe(ProviderParamSchema)) { provider }: ProviderParamDto,
    @Query('platform') platform: Platform,
    @Body(new ZodValidationPipe(SocialCallbackSchema)) body: SocialCallbackDto,
  ) {
    if (body.error) {
      throw new UnauthorizedException({
        code: ErrorCode.AUTH_INVALID_TOKEN,
        message: body.error_description ?? body.error,
      });
    }
    return this.authService.socialLogin({ provider, platform, code: body.code, state: body.state });
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refreshTokens(@Body(new ZodValidationPipe(RefreshTokenSchema)) body: RefreshTokenDto) {
    return this.authService.refresh(body.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Body(new ZodValidationPipe(RefreshTokenSchema)) body: RefreshTokenDto) {
    return this.authService.logout(body.refreshToken);
  }
}
