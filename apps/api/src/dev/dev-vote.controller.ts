import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { DateVoteService } from '../date-vote/date-vote.service';

/** E2E·로컬 검증용. DevAuthModule은 production에서 로드되지 않음. */
@Controller('dev/vote')
export class DevVoteController {
  constructor(private readonly dateVoteService: DateVoteService) {}

  @Public()
  @Post('process-expired')
  @HttpCode(HttpStatus.OK)
  async processExpiredPolls() {
    await this.dateVoteService.processExpiredPolls();
    return { ok: true };
  }
}
