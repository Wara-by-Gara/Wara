import { Body, Controller, Get, Param, Patch, Post, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { AdminOnly } from '../common/decorators/admin-only.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ParseUlidPipe } from '../common/pipes/parse-ulid.pipe';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { JwtPayload } from '../common/types/jwt-payload.type';
import { ReportsService } from './reports.service';
import {
  updateReportSchema,
  listReportsSchema,
  type UpdateReportDto,
  type ListReportsDto,
} from './dto/update-report.dto';

// 어드민 신고 큐. 글로벌 JwtAuthGuard 인증 + @AdminOnly()로 role=admin 검증.
@Controller('admin/reports')
@AdminOnly()
export class AdminReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get()
  list(@Query(new ZodValidationPipe(listReportsSchema)) dto: ListReportsDto) {
    return this.service.listForAdmin(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUlidPipe) id: string,
    @CurrentUser() admin: JwtPayload,
    @Body(new ZodValidationPipe(updateReportSchema)) dto: UpdateReportDto,
  ) {
    return this.service.updateForAdmin(id, dto, admin.id);
  }

  /** 신고 대상 콘텐츠 숨김 + 신고 resolved */
  @Post(':id/hide')
  @HttpCode(HttpStatus.OK)
  hide(@Param('id', ParseUlidPipe) id: string, @CurrentUser() admin: JwtPayload) {
    return this.service.hide(id, admin.id);
  }

  /** 숨김 복원 + 신고 dismissed */
  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  restore(@Param('id', ParseUlidPipe) id: string, @CurrentUser() admin: JwtPayload) {
    return this.service.restore(id, admin.id);
  }
}
