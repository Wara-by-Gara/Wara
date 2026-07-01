import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { JwtPayload } from '../common/types/jwt-payload.type';
import { ReportsService } from './reports.service';
import { createReportSchema, type CreateReportDto } from './dto/create-report.dto';

@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  /** 사진/댓글 신고 접수. 동일 대상 중복 신고는 409. */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(createReportSchema)) dto: CreateReportDto,
  ) {
    return this.service.report(user.id, dto);
  }
}
