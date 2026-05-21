import { Controller, Delete, Get, HttpCode, HttpStatus, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RequireMemberRole } from '../common/decorators/member-role.decorator';
import { MemberRole } from '../common/enums/member-role.enum';
import { HostGuard } from '../common/guards/host.guard';
import { ParseUlidPipe } from '../common/pipes/parse-ulid.pipe';
import { BlocklistService } from './blocklist.service';

@ApiTags('Blocklist')
@ApiBearerAuth('access-token')
@Controller('invitations/:invitationId/blocklist')
@UseGuards(HostGuard)
@RequireMemberRole(MemberRole.HOST)
export class BlocklistController {
  constructor(private readonly blocklistService: BlocklistService) {}

  @Get()
  @ApiOperation({ summary: '차단 목록 조회 (HOST 전용)' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({ status: 403, description: 'INSUFFICIENT_ROLE' })
  list(@Param('invitationId', ParseUlidPipe) invitationId: string) {
    return this.blocklistService.list(invitationId);
  }

  @Delete(':userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '차단 해제 (HOST 전용)' })
  @ApiResponse({ status: 204, description: '성공' })
  @ApiResponse({ status: 403, description: 'INSUFFICIENT_ROLE' })
  async unblock(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Param('userId', ParseUlidPipe) userId: string,
  ): Promise<void> {
    await this.blocklistService.unblock(invitationId, userId);
  }
}
