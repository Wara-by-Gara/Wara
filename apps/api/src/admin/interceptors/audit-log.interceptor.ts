import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import { JwtPayload } from '../../common/types/jwt-payload.type';
import {
  ADMIN_ACTION_KEY,
  AdminActionMeta,
} from '../decorators/admin-action.decorator';
import {
  AuditLogEntry,
  AuditLogRepository,
} from '../repositories/audit-log.repository';

const SENSITIVE_FIELD_REGEX = /password|token|secret|access[_-]?token|refresh[_-]?token/i;
const MASK = '***';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly auditLogRepository: AuditLogRepository,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const meta = this.reflector.getAllAndOverride<AdminActionMeta | undefined>(
      ADMIN_ACTION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!meta) return next.handle();

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const user = request.user as JwtPayload | undefined;

    return next.handle().pipe(
      tap(() => {
        this.recordAsync({
          adminUserId: user?.id ?? 'unknown',
          action: meta.action,
          targetType: meta.targetType ?? null,
          targetId: this.extractTargetId(request),
          requestBody: this.maskSensitive(request.body),
          responseStatus: response.statusCode,
          ipAddress: request.ip ?? null,
          userAgent: request.headers['user-agent'] ?? null,
        });
      }),
    );
  }

  private extractTargetId(request: Request): string | null {
    const params = request.params as Record<string, unknown> | undefined;
    const id = params?.id;
    return typeof id === 'string' ? id : null;
  }

  private maskSensitive(value: unknown): unknown {
    if (value === null || value === undefined) return value;
    if (Array.isArray(value)) return value.map((item) => this.maskSensitive(item));
    if (typeof value !== 'object') return value;
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_FIELD_REGEX.test(key)) {
        result[key] = MASK;
      } else {
        result[key] = this.maskSensitive(val);
      }
    }
    return result;
  }

  private recordAsync(entry: AuditLogEntry): void {
    this.auditLogRepository.insert(entry).catch((err) => {
      this.logger.error(
        `Audit log insert failed (admin=${entry.adminUserId}, action=${entry.action})`,
        err instanceof Error ? err.stack : String(err),
      );
    });
  }
}
