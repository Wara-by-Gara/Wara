import { Injectable } from '@nestjs/common';

export type AuditLogEntry = {
  adminUserId: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  requestBody: unknown;
  responseStatus: number;
  ipAddress: string | null;
  userAgent: string | null;
};

/**
 * Admin 작업 감사 로그 Repository.
 * 현재는 placeholder — Drizzle 구현(`audit_logs` 테이블 머지 후) 시 메서드 본문 교체.
 */
@Injectable()
export class AuditLogRepository {
  async insert(_entry: AuditLogEntry): Promise<void> {
    throw new Error('AuditLogRepository.insert: NotImplemented');
  }
}
