import { Controller, Get, Query } from '@nestjs/common';
import { AdminOnly } from '../common/decorators/admin-only.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  AnalyticsPeriodDto,
  AnalyticsPeriodSchema,
  RetentionQueryDto,
  RetentionQuerySchema,
} from './dto/analytics-period.dto';
import { DashboardService } from './dashboard.service';

/**
 * 관리자 대시보드 분석 endpoint.
 * - 글로벌 JwtAuthGuard 인증 + @AdminOnly() role=admin 검증
 * - 공통 쿼리: ?from=ISO&to=ISO (생략 시 최근 30일)
 * - 공유/전환/바이럴/시간대는 별도 ShareAnalyticsController(admin/analytics/shares/*)
 */
@Controller('admin/analytics')
@AdminOnly()
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('overview')
  async overview(
    @Query(new ZodValidationPipe(AnalyticsPeriodSchema))
    period: AnalyticsPeriodDto,
  ) {
    return this.service.getOverview(period);
  }

  @Get('active-users')
  async activeUsers(
    @Query(new ZodValidationPipe(AnalyticsPeriodSchema))
    period: AnalyticsPeriodDto,
  ) {
    return this.service.getActiveUsers(period);
  }

  @Get('retention')
  async retention(
    @Query(new ZodValidationPipe(RetentionQuerySchema))
    query: RetentionQueryDto,
  ) {
    return this.service.getRetention(query.weeks);
  }

  @Get('growth')
  async growth(
    @Query(new ZodValidationPipe(AnalyticsPeriodSchema))
    period: AnalyticsPeriodDto,
  ) {
    return this.service.getGrowth(period);
  }

  @Get('invitations')
  async invitations(
    @Query(new ZodValidationPipe(AnalyticsPeriodSchema))
    period: AnalyticsPeriodDto,
  ) {
    return this.service.getInvitationStats(period);
  }

  @Get('feedback')
  async feedback(
    @Query(new ZodValidationPipe(AnalyticsPeriodSchema))
    period: AnalyticsPeriodDto,
  ) {
    return this.service.getFeedback(period);
  }
}
