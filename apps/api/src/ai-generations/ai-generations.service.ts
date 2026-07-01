import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { AiMonitoringService } from '../ai/ai-monitoring.service';
import { AiImageJobsRepository } from '../invitations/ai-image-jobs.repository';
import { S3Service } from '../s3/s3.service';
import { TemplatesRepository } from '../templates/templates.repository';
import { ErrorCode } from '../common/constants/error-codes';
import { AiGenerationsRepository } from './ai-generations.repository';
import { AiGenerationsGateway } from './ai-generations.gateway';
import type { CreateAiGenerationDto } from './dto/create-ai-generation.dto';

// 한도. ai_image_jobs(invitation 합성)와 합산.
const AI_DAILY_LIMIT = 3;
// 보정 결과를 임시 저장하는 S3 prefix. 라이프사이클 규칙에 1시간 TTL을 걸어둘 자리.
const RESULT_KEY_PREFIX = 'ai-generations/results/';
// 원본 업로드 허용 prefix. invitation 만들기에서 presigned URL로 올린 임시 이미지.
const ALLOWED_SOURCE_PREFIXES = ['public/invitations/', 'temp/ai-source/'];
// 외부 URL로 저장된 템플릿 이미지 fetch 타임아웃/크기 제한.
const TEMPLATE_FETCH_TIMEOUT_MS = 10_000;
const TEMPLATE_MAX_BYTES = 10 * 1024 * 1024; // 10MB

// invitations.service.ts의 default prompt와 동일 — 동일한 합성 의도를 유지.
const DEFAULT_COMPOSITE_PROMPT =
  '왼쪽 이미지의 인물을 오른쪽 이미지의 초대장 배경 디자인에 자연스럽게 합성해 주세요. ' +
  '배경 디자인과 분위기를 최대한 유지하면서 인물을 배경에 어울리게 배치해 주세요.';

@Injectable()
export class AiGenerationsService {
  private readonly logger = new Logger(AiGenerationsService.name);

  constructor(
    private readonly repository: AiGenerationsRepository,
    private readonly aiJobsRepository: AiImageJobsRepository,
    private readonly templatesRepository: TemplatesRepository,
    private readonly aiService: AiService,
    private readonly aiMonitoringService: AiMonitoringService,
    private readonly s3Service: S3Service,
    private readonly gateway: AiGenerationsGateway,
  ) {}

  // POST /ai/generations — 한도/서킷/path/template 검증 후 즉시 { id, status } 반환.
  // 실제 OpenAI 호출은 setImmediate로 응답 이후 백그라운드 실행.
  async createGeneration(dto: CreateAiGenerationDto, userId: string) {
    if (!ALLOWED_SOURCE_PREFIXES.some((p) => dto.sourceImageKey.startsWith(p))) {
      throw new ForbiddenException(ErrorCode.INSUFFICIENT_ROLE);
    }

    if (this.aiMonitoringService.isCircuitOpen) {
      throw new ServiceUnavailableException(ErrorCode.AI_SERVICE_UNAVAILABLE);
    }

    const template = await this.templatesRepository.findById(dto.templateId);
    if (!template) throw new NotFoundException(ErrorCode.AI_TEMPLATE_NOT_FOUND);

    // 한도는 두 흐름(invitation 합성 + 만들기 단계 합성) 합산.
    const [jobs, gens] = await Promise.all([
      this.aiJobsRepository.countTodayByUser(userId),
      this.repository.countTodayByUser(userId),
    ]);
    if (jobs + gens >= AI_DAILY_LIMIT) {
      throw new HttpException(ErrorCode.AI_DAILY_LIMIT_EXCEEDED, HttpStatus.TOO_MANY_REQUESTS);
    }

    const row = await this.repository.create({
      userId,
      templateId: dto.templateId,
      sourceImageKey: dto.sourceImageKey,
    });

    setImmediate(() => {
      void this.processAsync(row.id, userId, dto.templateId, dto.sourceImageKey);
    });

    return { id: row.id, status: row.status };
  }

  // GET /ai/generations/quota — 오늘 남은 AI 생성 횟수. 두 흐름(invitation 합성 + 만들기 단계) 합산.
  async getDailyQuota(userId: string) {
    const [jobs, gens] = await Promise.all([
      this.aiJobsRepository.countTodayByUser(userId),
      this.repository.countTodayByUser(userId),
    ]);
    const used = jobs + gens;
    return {
      limit: AI_DAILY_LIMIT,
      used,
      remaining: Math.max(0, AI_DAILY_LIMIT - used),
    };
  }

  // GET /ai/generations/:id — 본인 것만. completed면 다운로드 URL 발급.
  async getGeneration(id: string, userId: string) {
    const row = await this.repository.findById(id);
    if (!row || row.userId !== userId) {
      throw new NotFoundException(ErrorCode.AI_GENERATION_NOT_FOUND);
    }

    const downloadUrl =
      row.status === 'completed' && row.resultImageKey
        ? await this.s3Service.getDownloadPresignedUrl(
            row.resultImageKey,
            `wara-ai-${row.id}.png`,
          )
        : null;

    return {
      id: row.id,
      status: row.status,
      templateId: row.templateId,
      downloadUrl,
      errorCode: row.errorCode ?? null,
      createdAt: row.createdAt,
      completedAt: row.completedAt ?? null,
    };
  }

  // setImmediate로 호출. throw 금지 — DB에 failed 기록만.
  private async processAsync(
    id: string,
    userId: string,
    templateId: string,
    sourceImageKey: string,
  ): Promise<void> {
    try {
      await this.repository.updateStatus(id, 'processing');

      const template = await this.templatesRepository.findById(templateId);
      if (!template) {
        await this.repository.updateStatus(id, 'failed', {
          errorCode: ErrorCode.AI_TEMPLATE_NOT_FOUND,
        });
        this.gateway.emitGenerationFailed(userId, id, ErrorCode.AI_TEMPLATE_NOT_FOUND);
        return;
      }

      const [sourceBuffer, templateBuffer] = await Promise.all([
        this.s3Service.getObjectBuffer(sourceImageKey),
        this.fetchTemplateImage(template.previewImageKey),
      ]);
      const prompt = template.prompt ?? DEFAULT_COMPOSITE_PROMPT;
      const mime = sourceImageKey.endsWith('.webp') ? 'image/webp' : 'image/png';

      const resultBuffer = await this.aiService.compositeImages(
        sourceBuffer,
        templateBuffer,
        prompt,
        mime,
      );

      const resultKey = `${RESULT_KEY_PREFIX}${id}.png`;
      await this.s3Service.putObjectBuffer(resultKey, resultBuffer, 'image/png');

      await this.repository.updateStatus(id, 'completed', { resultImageKey: resultKey });
      this.gateway.emitGenerationCompleted(userId, id);
    } catch (err) {
      const errorCode = this.classifyError(err);
      await this.repository.updateStatus(id, 'failed', { errorCode }).catch(() => undefined);
      this.gateway.emitGenerationFailed(userId, id, errorCode);
      const e = err as { message?: string; name?: string; status?: number; stack?: string };
      this.logger.error(
        `[AI generation ${id}] 실패: ${errorCode} - ${e?.name ?? ''}: ${e?.message ?? ''} (status: ${e?.status ?? 'n/a'})`,
        e?.stack,
      );
    }
  }

  // 템플릿의 previewImageKey가 dev 환경에선 web의 정적 파일 URL이고
  // prod에선 S3 키일 수 있어 두 경로 모두 지원.
  // 외부 URL fetch는 SSRF 영향 최소화를 위해 timeout + 응답 크기 상한 적용.
  private async fetchTemplateImage(key: string): Promise<Buffer> {
    if (key.startsWith('http://') || key.startsWith('https://')) {
      const controller = new AbortController();
      const timer = setTimeout(
        () => controller.abort(),
        TEMPLATE_FETCH_TIMEOUT_MS,
      );
      try {
        const res = await fetch(key, { signal: controller.signal });
        if (!res.ok) {
          throw new Error(
            `template fetch failed: ${res.status} ${res.statusText}`,
          );
        }
        const contentLength = Number(res.headers.get('content-length') ?? '0');
        if (contentLength > TEMPLATE_MAX_BYTES) {
          throw new Error(
            `template too large: ${contentLength} > ${TEMPLATE_MAX_BYTES}`,
          );
        }
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.byteLength > TEMPLATE_MAX_BYTES) {
          throw new Error(
            `template too large: ${buf.byteLength} > ${TEMPLATE_MAX_BYTES}`,
          );
        }
        return buf;
      } finally {
        clearTimeout(timer);
      }
    }
    return this.s3Service.getObjectBuffer(key);
  }

  private classifyError(err: unknown): string {
    const e = err as { message?: string };
    if (e?.message === ErrorCode.AI_TIMEOUT) return ErrorCode.AI_TIMEOUT;
    if (e?.message === ErrorCode.AI_PROCESSING_FAILED) return ErrorCode.AI_PROCESSING_FAILED;
    return ErrorCode.AI_PROCESSING_FAILED;
  }
}
