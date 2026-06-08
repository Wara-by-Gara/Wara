import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FriendsService } from './friends.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ParseUlidPipe } from '../common/pipes/parse-ulid.pipe';
import type { JwtPayload } from '../common/types/jwt-payload.type';

@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Get()
  getFriends(@CurrentUser() user: JwtPayload) {
    return this.friendsService.getFriends(user.id);
  }

  // 삭제(숨김)한 친구 목록 — :userId 라우트보다 먼저 선언
  @Get('hidden')
  getHiddenFriends(@CurrentUser() user: JwtPayload) {
    return this.friendsService.getHiddenFriends(user.id);
  }

  @Get(':userId')
  getFriendProfile(
    @CurrentUser() user: JwtPayload,
    @Param('userId', ParseUlidPipe) userId: string,
  ) {
    return this.friendsService.getFriendProfile(user.id, userId);
  }

  // 친구 삭제 (영구 숨김)
  @Delete(':userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  hideFriend(
    @CurrentUser() user: JwtPayload,
    @Param('userId', ParseUlidPipe) userId: string,
  ) {
    return this.friendsService.hideFriend(user.id, userId);
  }

  // 삭제한 친구 복원
  @Post(':userId/restore')
  @HttpCode(HttpStatus.NO_CONTENT)
  restoreFriend(
    @CurrentUser() user: JwtPayload,
    @Param('userId', ParseUlidPipe) userId: string,
  ) {
    return this.friendsService.restoreFriend(user.id, userId);
  }
}
