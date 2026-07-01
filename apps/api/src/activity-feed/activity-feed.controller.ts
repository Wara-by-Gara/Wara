import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { BlocklistGuard } from '../common/guards/blocklist.guard';
import { ParticipantGuard } from '../common/guards/participant.guard';
import { ParseUlidPipe } from '../common/pipes/parse-ulid.pipe';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ActivityFeedService } from './activity-feed.service';
import { listActivitySchema, type ListActivityDto } from './dto/list-activity.dto';

@Controller('invitations/:invitationId/activity')
@UseGuards(BlocklistGuard)
export class ActivityFeedController {
  constructor(private readonly service: ActivityFeedService) {}

  /** 초대장 활동 피드 (참가·사진·댓글·투표확정 시간순 병합, 커서 백필). */
  @Get()
  @UseGuards(ParticipantGuard)
  list(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Query(new ZodValidationPipe(listActivitySchema)) dto: ListActivityDto,
  ) {
    return this.service.list(invitationId, dto);
  }
}
