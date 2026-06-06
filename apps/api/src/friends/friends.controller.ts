import { Controller, Get, Param } from '@nestjs/common';
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

  @Get(':userId')
  getFriendProfile(
    @CurrentUser() user: JwtPayload,
    @Param('userId', ParseUlidPipe) userId: string,
  ) {
    return this.friendsService.getFriendProfile(user.id, userId);
  }
}
