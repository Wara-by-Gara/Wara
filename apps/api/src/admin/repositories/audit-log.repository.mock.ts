import { Injectable } from '@nestjs/common';
import { AuditLogEntry, IAuditLogRepository } from './audit-log.repository.interface';

@Injectable()
export class MockAuditLogRepository implements IAuditLogRepository {
  private readonly entries: AuditLogEntry[] = [];

  async insert(entry: AuditLogEntry): Promise<void> {
    this.entries.push(entry);
  }

  all(): readonly AuditLogEntry[] {
    return this.entries;
  }

  clear(): void {
    this.entries.length = 0;
  }
}
