import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ReportsRepository } from './reports.repository';
import { ErrorCode } from '../common/constants/error-codes';
import type { CreateReportDto } from './dto/create-report.dto';
import type { UpdateReportDto, ListReportsDto } from './dto/update-report.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly repo: ReportsRepository) {}

  // ── 사용자 ────────────────────────────────────────────────────────────────────

  async report(userId: string, dto: CreateReportDto) {
    const target = await this.repo.findTarget(dto.targetType, dto.targetId);
    if (!target) throw new NotFoundException(ErrorCode.REPORT_TARGET_NOT_FOUND);

    const row = await this.repo.create({
      reporterUserId: userId,
      targetType:     dto.targetType,
      targetId:       dto.targetId,
      invitationId:   target.invitationId,
      reason:         dto.reason ?? null,
    });
    // onConflict → 이미 신고한 대상
    if (!row) throw new ConflictException(ErrorCode.REPORT_ALREADY_EXISTS);
    return { id: row.id, status: row.status };
  }

  // ── 어드민 ────────────────────────────────────────────────────────────────────

  listForAdmin(dto: ListReportsDto) {
    return this.repo.list(dto.status, dto.limit);
  }

  async updateForAdmin(id: string, dto: UpdateReportDto, adminUserId: string) {
    await this.getReport(id);
    return this.repo.update(id, {
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.adminMemo !== undefined && { adminMemo: dto.adminMemo }),
      handledByUserId: adminUserId,
    });
  }

  /** 신고 대상 콘텐츠 숨김 + 신고 resolved 처리. */
  async hide(id: string, adminUserId: string) {
    const report = await this.getReport(id);
    await this.repo.setHidden(report.targetType, report.targetId, true);
    return this.repo.update(id, { status: 'resolved', handledByUserId: adminUserId });
  }

  /** 숨김 복원. 신고는 dismissed 처리. */
  async restore(id: string, adminUserId: string) {
    const report = await this.getReport(id);
    await this.repo.setHidden(report.targetType, report.targetId, false);
    return this.repo.update(id, { status: 'dismissed', handledByUserId: adminUserId });
  }

  private async getReport(id: string) {
    const report = await this.repo.findById(id);
    if (!report) throw new NotFoundException(ErrorCode.REPORT_NOT_FOUND);
    return report;
  }
}
