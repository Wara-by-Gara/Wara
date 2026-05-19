import { Controller, Delete, Get, HttpCode, HttpStatus, Param, UseGuards } from '@nestjs/common';
import { RequireMemberRole } from '../common/decorators/member-role.decorator';
import { MemberRole } from '../common/enums/member-role.enum';
import { HostGuard } from '../common/guards/host.guard';
import { ParseUlidPipe } from '../common/pipes/parse-ulid.pipe';
import { BlocklistService } from './blocklist.service';

@Controller('invitations/:invitationId/blocklist')
@UseGuards(HostGuard)
@RequireMemberRole(MemberRole.HOST)
export class BlocklistController {
  constructor(private readonly blocklistService: BlocklistService) {}

  @Get()
  list(@Param('invitationId', ParseUlidPipe) invitationId: string) {
    return this.blocklistService.list(invitationId);
  }

  @Delete(':userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unblock(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Param('userId', ParseUlidPipe) userId: string,
  ): Promise<void> {
    await this.blocklistService.unblock(invitationId, userId);
  }
}
