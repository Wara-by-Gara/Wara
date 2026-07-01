import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { AdminReportsController } from './admin-reports.controller';
import { ReportsService } from './reports.service';
import { ReportsRepository } from './reports.repository';

/** 콘텐츠 신고/모데레이션(S-ZHHHHY, S-AQQDWN). 사용자 신고 → 어드민 큐 → 숨김/복원. */
@Module({
  controllers: [ReportsController, AdminReportsController],
  providers: [ReportsService, ReportsRepository],
})
export class ReportsModule {}
