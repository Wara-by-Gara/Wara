import { Controller, Get, Query } from '@nestjs/common';
import { AdminOnly } from '../common/decorators/admin-only.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  AnalyticsPeriodDto,
  AnalyticsPeriodSchema,
} from './dto/analytics-period.dto';
import { ShareAnalyticsService } from './share-analytics.service';

/**
 * 관리자용 공유 로그 분석 endpoint.
 * - 글로벌 JwtAuthGuard로 인증 + @AdminOnly() 로 role=admin 검증
 * - 공통 쿼리: ?from=ISO&to=ISO (둘 다 생략 시 최근 30일)
 */
@Controller('admin/analytics/shares')
@AdminOnly()
export class ShareAnalyticsController {
  constructor(private readonly service: ShareAnalyticsService) {}

  @Get('channels')
  async channels(
    @Query(new ZodValidationPipe(AnalyticsPeriodSchema))
    period: AnalyticsPeriodDto,
  ) {
    return this.service.getChannels(period);
  }

  @Get('conversion')
  async conversion(
    @Query(new ZodValidationPipe(AnalyticsPeriodSchema))
    period: AnalyticsPeriodDto,
  ) {
    return this.service.getConversion(period);
  }

  @Get('viral')
  async viral(
    @Query(new ZodValidationPipe(AnalyticsPeriodSchema))
    period: AnalyticsPeriodDto,
  ) {
    return this.service.getViral(period);
  }

  @Get('timeline')
  async timeline(
    @Query(new ZodValidationPipe(AnalyticsPeriodSchema))
    period: AnalyticsPeriodDto,
  ) {
    return this.service.getTimeline(period);
  }
}
