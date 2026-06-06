import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthService } from '../auth/auth.service';
import { Provider } from '../auth/enums/provider.enum';
import { MobileTokenDto, MobileTokenSchema } from '../auth/dto/mobile-token.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ParseUlidPipe } from '../common/pipes/parse-ulid.pipe';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { UpdateUserSchema, UpdateUserDto } from './dto/update-user.dto';
import { DeleteUserSchema, type DeleteUserDto } from './dto/delete-user.dto';
import type { JwtPayload } from '../common/types/jwt-payload.type';
import { SocialProviderSchema } from '../common/types/social-provider.type';
import type { SocialProvider } from '../common/types/social-provider.type';
import { ProfileImagePresignedUrlSchema, type ProfileImagePresignedUrlDto } from './dto/profile-image-presigned-url.dto';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @Post('me/presigned-url')
  generatePresignedUrl(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(ProfileImagePresignedUrlSchema)) dto: ProfileImagePresignedUrlDto,
  ) {
    return this.usersService.generatePresignedUrl(user.id, dto);
  }

  @Get('me')
  getMe(@CurrentUser() user: JwtPayload) {
    return this.usersService.getMe(user.id);
  }

  @Patch('me')
  updateMe(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(UpdateUserSchema)) data: UpdateUserDto,
  ) {
    return this.usersService.updateMe(user.id, data);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteMe(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(DeleteUserSchema)) dto: DeleteUserDto,
  ) {
    return this.usersService.deleteMe(user.id, dto);
  }

  @Get('me/socials')
  getMySocials(@CurrentUser() user: JwtPayload) {
    return this.usersService.getMySocials(user.id);
  }

  @Delete('me/socials/:provider')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteMySocial(
    @CurrentUser() user: JwtPayload,
    @Param('provider', new ZodValidationPipe(SocialProviderSchema)) provider: SocialProvider,
  ) {
    return this.usersService.deleteMySocial(user.id, provider);
  }

  @Post('me/socials/:provider/link/url')
  @HttpCode(HttpStatus.OK)
  linkSocialUrl(
    @CurrentUser() user: JwtPayload,
    @Param('provider', new ZodValidationPipe(SocialProviderSchema)) provider: SocialProvider,
  ) {
    return this.authService.getLinkAuthorizationUrl(provider as Provider, user.id);
  }

  @Post('me/socials/:provider/link/token')
  @HttpCode(HttpStatus.OK)
  linkSocialWithToken(
    @CurrentUser() user: JwtPayload,
    @Param('provider', new ZodValidationPipe(SocialProviderSchema)) provider: SocialProvider,
    @Body(new ZodValidationPipe(MobileTokenSchema)) body: MobileTokenDto,
  ) {
    return this.authService.linkSocialAccountWithProviderToken({
      userId: user.id,
      provider: provider as Provider,
      providerToken: body.providerToken,
    });
  }

  @Post('me/merge')
  @HttpCode(HttpStatus.OK)
  mergeAccounts(
    @CurrentUser() user: JwtPayload,
    @Body() body: { mergeToken: string },
  ) {
    return this.authService.mergeAccounts(user.id, body.mergeToken);
  }

  @Get(':id')
  getUserById(@Param('id', ParseUlidPipe) id: string) {
    return this.usersService.getUserById(id);
  }
}
