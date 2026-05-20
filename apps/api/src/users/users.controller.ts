import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ParseUlidPipe } from '../common/pipes/parse-ulid.pipe';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { UpdateUserSchema, UpdateUserDto } from './dto/update-user.dto';
import type { JwtPayload } from '../common/types/jwt-payload.type';
import { SocialProviderSchema } from '../common/types/social-provider.type';
import type { SocialProvider } from '../common/types/social-provider.type';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: '내 프로필 조회' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({ status: 401, description: 'AUTH_USER_NOT_FOUND' })
  getMe(@CurrentUser() user: JwtPayload) {
    return this.usersService.getMe(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: '내 프로필 수정' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({ status: 400, description: 'VALIDATION_ERROR' })
  updateMe(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(UpdateUserSchema)) data: UpdateUserDto,
  ) {
    return this.usersService.updateMe(user.id, data);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '회원 탈퇴 (소프트 딜리트)' })
  @ApiResponse({ status: 204, description: '성공' })
  deleteMe(@CurrentUser() user: JwtPayload) {
    return this.usersService.deleteMe(user.id);
  }

  @Get('me/socials')
  @ApiOperation({ summary: '내 소셜 계정 목록 조회' })
  @ApiResponse({ status: 200, description: '성공' })
  getMySocials(@CurrentUser() user: JwtPayload) {
    return this.usersService.getMySocials(user.id);
  }

  @Delete('me/socials/:provider')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '소셜 계정 연결 해제' })
  @ApiResponse({ status: 204, description: '성공' })
  @ApiResponse({ status: 400, description: 'VALIDATION_ERROR' })
  deleteMySocial(
    @CurrentUser() user: JwtPayload,
    @Param('provider', new ZodValidationPipe(SocialProviderSchema)) provider: SocialProvider,
  ) {
    return this.usersService.deleteMySocial(user.id, provider);
  }

  @Get(':id')
  @ApiOperation({ summary: '유저 공개 프로필 조회' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({ status: 404, description: 'PARTICIPANT_NOT_FOUND' })
  getUserById(@Param('id', ParseUlidPipe) id: string) {
    return this.usersService.getUserById(id);
  }
}
