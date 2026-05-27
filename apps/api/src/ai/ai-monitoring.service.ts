import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { gte, count } from 'drizzle-orm';
import { DRIZZLE, DrizzleDB } from '../database/database.module';
import { aiImageJobs } from '../database/schema';

/** 경고 임계치: 1시간 기준 */
const SPIKE_WARNING_THRESHOLD = 30;
/** 서킷 오픈 임계치: 1시간 기준 */
const CIRCUIT_OPEN_THRESHOLD = 60;
/** 서킷 자동 복구 시간 (30분) */
const CIRCUIT_RESET_MS = 30 * 60 * 1000;

@Injectable()
export class AiMonitoringService {
  private readonly logger = new Logger(AiMonitoringService.name);
  private _isCircuitOpen = false;
  private circuitOpenedAt: Date | null = null;

  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  get isCircuitOpen(): boolean {
    // 30분 경과 시 자동 복구
    if (this._isCircuitOpen && this.circuitOpenedAt) {
      const elapsed = Date.now() - this.circuitOpenedAt.getTime();
      if (elapsed >= CIRCUIT_RESET_MS) {
        this._isCircuitOpen = false;
        this.circuitOpenedAt = null;
        this.logger.log('[AI 서킷 복구] 30분 경과 후 자동 복구됨');
      }
    }
    return this._isCircuitOpen;
  }

  /** 10분마다 지난 1시간 AI 요청 수 집계 — 스파이크 감지 */
  @Cron('*/10 * * * *')
  async checkAiUsageSpike(): Promise<void> {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const [row] = await this.db
        .select({ cnt: count() })
        .from(aiImageJobs)
        .where(gte(aiImageJobs.createdAt, oneHourAgo));

      const jobCount = row?.cnt ?? 0;

      if (jobCount >= CIRCUIT_OPEN_THRESHOLD) {
        if (!this._isCircuitOpen) {
          this._isCircuitOpen = true;
          this.circuitOpenedAt = new Date();
          this.logger.error(
            `[AI 서킷 오픈] 지난 1시간 요청: ${jobCount}건 (임계치: ${CIRCUIT_OPEN_THRESHOLD}). 새 요청 차단.`,
          );
        }
      } else if (jobCount >= SPIKE_WARNING_THRESHOLD) {
        this.logger.warn(
          `[AI 사용량 급증 경고] 지난 1시간 요청: ${jobCount}건 (임계치: ${SPIKE_WARNING_THRESHOLD})`,
        );
      }
    } catch (err) {
      this.logger.error('[AI 모니터링] 집계 중 오류 발생', err);
    }
  }
}
