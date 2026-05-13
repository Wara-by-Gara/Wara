export const AUDIT_LOG_REPOSITORY = Symbol('IAuditLogRepository');

export interface AuditLogEntry {
  adminUserId: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  requestBody: unknown;
  responseStatus: number;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface IAuditLogRepository {
  insert(entry: AuditLogEntry): Promise<void>;
}
